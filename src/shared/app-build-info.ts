declare const __CHATTYPAD_APP_VERSION__: string;
declare const __CHATTYPAD_GIT_COMMIT__: string;
declare const __CHATTYPAD_BUILD_DATE__: string;

export interface AppBuildInfo {
  version: string;
  gitCommit: string;
  buildDate: string;
}

export const appBuildInfo: AppBuildInfo = {
  version: __CHATTYPAD_APP_VERSION__,
  gitCommit: __CHATTYPAD_GIT_COMMIT__,
  buildDate: __CHATTYPAD_BUILD_DATE__,
};
