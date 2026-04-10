import type { Database } from "bun:sqlite";
import {
  getAllProjects,
  getAllThreadsByProject,
  getMessagesByThread,
} from "../database/workspace-repository.js";
import {
  searchUnencryptedMessageEntriesBySubstring,
  searchUnencryptedMessageEntries,
  searchUnencryptedThreadEntriesBySubstring,
  searchUnencryptedThreadEntries,
} from "../database/search-repository.js";
import type {
  IpcResult,
  WorkspaceSearchResult,
} from "../../shared/contracts/workspace.js";
import { withIpcErrorAsync } from "./ipc-error.js";
import { CryptoService } from "../../shared/crypto/crypto-service.js";
import { decryptThreadTitleForDisplay, sessionKeys } from "./workspace-service.js";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 25;
const MIN_QUERY_LENGTH = 2;
const SNIPPET_RADIUS = 36;
const ENCRYPTED_CONTENT_PLACEHOLDER = "[Encrypted Content]";

interface RankedSearchResult extends WorkspaceSearchResult {
  rankBucket: number;
  rankTimestamp: number;
}

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

function toFtsPhraseQuery(query: string): string {
  return `"${query.replace(/"/g, "\"\"")}"`;
}

function normalizeLimit(limit?: number): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit ?? DEFAULT_LIMIT)));
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function findMatchIndex(haystack: string, needle: string): number {
  return haystack.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());
}

function buildSnippet(value: string, query: string): string {
  const compact = normalizeText(value);
  if (!compact) {
    return "";
  }

  const matchIndex = findMatchIndex(compact, query);
  if (matchIndex === -1) {
    return compact.length <= SNIPPET_RADIUS * 2
      ? compact
      : `${compact.slice(0, SNIPPET_RADIUS * 2 - 1)}...`;
  }

  const start = Math.max(0, matchIndex - SNIPPET_RADIUS);
  const end = Math.min(compact.length, matchIndex + query.length + SNIPPET_RADIUS);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < compact.length ? "..." : "";

  return `${prefix}${compact.slice(start, end)}${suffix}`;
}

function looksLikeEncryptedPayload(value: string): boolean {
  try {
    return CryptoService.base64ToUint8Array(value).byteLength >= 28;
  } catch {
    return false;
  }
}

async function decryptMessageForSearch(content: string, key: CryptoKey): Promise<string> {
  try {
    return await CryptoService.decrypt(content, key);
  } catch {
    return looksLikeEncryptedPayload(content) ? ENCRYPTED_CONTENT_PLACEHOLDER : content;
  }
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getRankBucket(result: WorkspaceSearchResult, query: string): number {
  const threadTitle = result.threadTitle.toLocaleLowerCase();
  const normalizedQuery = query.toLocaleLowerCase();

  if (result.kind === "thread") {
    if (threadTitle.startsWith(normalizedQuery)) {
      return 0;
    }

    if (threadTitle.includes(normalizedQuery)) {
      return 1;
    }
  }

  return 2;
}

function sortAndLimitResults(
  results: WorkspaceSearchResult[],
  query: string,
  limit: number
): WorkspaceSearchResult[] {
  return results
    .map((result): RankedSearchResult => ({
      ...result,
      rankBucket: getRankBucket(result, query),
      rankTimestamp: toTimestamp(result.kind === "message" ? result.messageCreatedAt : result.activityAt),
    }))
    .sort((left, right) => {
      if (left.rankBucket !== right.rankBucket) {
        return left.rankBucket - right.rankBucket;
      }

      if (left.rankTimestamp !== right.rankTimestamp) {
        return right.rankTimestamp - left.rankTimestamp;
      }

      return left.id.localeCompare(right.id);
    })
    .slice(0, limit)
    .map(({ rankBucket: _rankBucket, rankTimestamp: _rankTimestamp, ...result }) => result);
}

function dedupeResults(results: WorkspaceSearchResult[]): WorkspaceSearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.id)) {
      return false;
    }

    seen.add(result.id);
    return true;
  });
}

async function searchUnlockedEncryptedContent(
  db: Database,
  query: string
): Promise<WorkspaceSearchResult[]> {
  const results: WorkspaceSearchResult[] = [];
  const projects = getAllProjects(db);

  for (const project of projects) {
    if (!project.isEncrypted) {
      continue;
    }

    const key = sessionKeys.get(project.id);
    if (!key) {
      continue;
    }

    const threads = getAllThreadsByProject(db, project.id);
    for (const thread of threads) {
      const decryptedTitle = await decryptThreadTitleForDisplay(thread.title, key);
      if (findMatchIndex(decryptedTitle, query) !== -1) {
        results.push({
          id: `thread:${thread.id}`,
          kind: "thread",
          projectId: project.id,
          projectName: project.name,
          threadId: thread.id,
          threadTitle: decryptedTitle,
          snippet: buildSnippet(decryptedTitle, query),
          activityAt: thread.lastMessageAt ?? thread.updatedAt,
        });
      }

      const messages = getMessagesByThread(db, thread.id);
      for (const message of messages) {
        const decryptedContent = await decryptMessageForSearch(message.content, key);
        if (findMatchIndex(decryptedContent, query) === -1) {
          continue;
        }

        results.push({
          id: `message:${message.id}`,
          kind: "message",
          projectId: project.id,
          projectName: project.name,
          threadId: thread.id,
          threadTitle: decryptedTitle,
          messageId: message.id,
          snippet: buildSnippet(decryptedContent, query),
          activityAt: thread.lastMessageAt ?? thread.updatedAt,
          messageCreatedAt: message.createdAt,
        });
      }
    }
  }

  return results;
}

export async function searchWorkspace(
  db: Database,
  rawQuery: string,
  limit?: number
): Promise<IpcResult<WorkspaceSearchResult[]>> {
  const query = normalizeQuery(rawQuery);
  const normalizedLimit = normalizeLimit(limit);

  if (query.length < MIN_QUERY_LENGTH) {
    return {
      success: true,
      data: [],
    };
  }

  return withIpcErrorAsync(async () => {
    const ftsQuery = toFtsPhraseQuery(query);
    const useSubstringFallback = query.length < 3;
    const threadRows = useSubstringFallback
      ? searchUnencryptedThreadEntriesBySubstring(db, query)
      : searchUnencryptedThreadEntries(db, ftsQuery);
    const messageRows = useSubstringFallback
      ? searchUnencryptedMessageEntriesBySubstring(db, query)
      : searchUnencryptedMessageEntries(db, ftsQuery);

    const unencryptedResults: WorkspaceSearchResult[] = [
      ...threadRows.map((row) => ({
        id: `thread:${row.thread_id}`,
        kind: "thread" as const,
        projectId: row.project_id,
        projectName: row.project_name,
        threadId: row.thread_id,
        threadTitle: row.thread_title,
        snippet: buildSnippet(row.thread_title, query),
        activityAt: row.activity_at,
      })),
      ...messageRows.map((row) => ({
        id: `message:${row.message_id}`,
        kind: "message" as const,
        projectId: row.project_id,
        projectName: row.project_name,
        threadId: row.thread_id,
        threadTitle: row.thread_title,
        messageId: row.message_id,
        snippet: buildSnippet(row.content, query),
        activityAt: row.activity_at,
        messageCreatedAt: row.created_at,
      })),
    ];

    const unlockedEncryptedResults = await searchUnlockedEncryptedContent(db, query);
    return sortAndLimitResults(
      dedupeResults([...unencryptedResults, ...unlockedEncryptedResults]),
      query,
      normalizedLimit
    );
  }, {
    fallbackCode: "WORKSPACE_SEARCH_FAILED",
    fallbackMessage: "Search is currently unavailable.",
  });
}
