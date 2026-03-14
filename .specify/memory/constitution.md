<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles:
  - Placeholder Principle 1 -> I. Specification-First Delivery
  - Placeholder Principle 2 -> II. Independent, Testable User Value
  - Placeholder Principle 3 -> III. Explicit Assumptions and Traceability
  - Placeholder Principle 4 -> IV. Simplicity with Justified Complexity
  - Placeholder Principle 5 -> V. Documentation and Agent Context Sync
- Added sections:
  - Delivery Constraints
  - Workflow and Review Gates
- Removed sections:
  - None
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
  - ⚠ pending: .specify/templates/commands/*.md (directory not present in this repository)
  - ⚠ pending: README.md (file not present in this repository)
- Follow-up TODOs:
  - None
-->
# ChattyPad Constitution

## Core Principles

### I. Specification-First Delivery
Every material change MUST start with a specification that defines user value,
scope boundaries, acceptance scenarios, and measurable success criteria before
planning or implementation begins. Plans and tasks MUST derive from the approved
specification rather than introducing scope implicitly during execution.
Rationale: ChattyPad uses a Specify-driven workflow; delivery stays predictable
only when requirements are explicit before technical design begins.

### II. Independent, Testable User Value
Each user story MUST describe a slice of value that can be implemented,
validated, and demonstrated independently. Every plan MUST define how each
story is verified, and every task list MUST preserve that independence by
grouping work per story and including either automated tests or explicit
validation steps. Rationale: independent slices preserve MVP delivery and keep
partial progress releasable.

### III. Explicit Assumptions and Traceability
Specifications MUST record assumptions, open questions, edge cases, and
requirement-to-artifact traceability. Plans MUST map constitutional gates to
concrete design decisions, and tasks MUST reference exact file paths so that
work can be audited back to the originating story and requirement. Rationale:
AI-assisted delivery is only reliable when reasoning, scope, and outputs are
inspectable.

### IV. Simplicity with Justified Complexity
Teams MUST prefer the simplest design that satisfies the current specification.
Any added complexity, extra abstraction, or structural expansion that is not
strictly required by the user stories MUST be documented in the plan's
Complexity Tracking section with the rejected simpler alternative. Rationale:
small repos accumulate accidental architecture quickly; justification keeps the
system maintainable.

### V. Documentation and Agent Context Sync
Any change to process, structure, or active technology that affects delivery
MUST update the relevant templates, quickstart material, and agent-context
artifacts in the same change. Generated guidance MUST avoid agent-specific
assumptions unless the file is intentionally agent-specific. Rationale:
out-of-date scaffolding causes future plans and implementations to drift from
the actual project rules.

## Delivery Constraints

- Specifications MUST stay implementation-agnostic and describe WHAT users need
  and HOW success is measured.
- Plans MUST resolve all `NEEDS CLARIFICATION` items before design is finalized.
- Every feature plan MUST produce or explicitly waive `research.md`,
  `data-model.md`, `contracts/`, and `quickstart.md` based on feature fit.
- Tasks MUST use the canonical checklist format with sequential IDs, story
  labels where required, and exact file paths.
- Missing repository guidance files are not blockers, but their absence MUST be
  recorded in the constitution sync report when relevant to an amendment.

## Workflow and Review Gates

1. Specification gate: `spec.md` is complete only when user stories, acceptance
   scenarios, edge cases, assumptions, requirements, and success criteria are
   all present and testable.
2. Planning gate: `plan.md` MUST pass the Constitution Check by confirming
   story independence, assumption resolution, simplicity, and documentation
   impact before Phase 0 research is considered complete.
3. Task gate: `tasks.md` MUST preserve story-by-story delivery order, identify
   validation work for each story, and isolate cross-cutting work to setup,
   foundational, or polish phases.
4. Review gate: reviews MUST treat constitution violations as blocking defects.
   A feature is not complete until required documentation and agent-context
   updates are included or explicitly waived with rationale.

## Governance

This constitution overrides conflicting local process guidance for specification,
planning, task generation, and review. Amendments MUST be made in
`.specify/memory/constitution.md`, MUST include a Sync Impact Report, and MUST
update affected templates or record why an update is deferred. Versioning
follows semantic versioning for governance: MAJOR for incompatible principle or
governance changes, MINOR for new principles or materially expanded obligations,
and PATCH for clarifications that do not change expected behavior. Compliance
review is mandatory during specification, planning, task generation, and final
review for every feature. Files that cannot be updated because they do not
exist MUST be listed as pending in the Sync Impact Report rather than ignored.

**Version**: 1.0.0 | **Ratified**: 2026-03-14 | **Last Amended**: 2026-03-14
