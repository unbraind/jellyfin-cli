const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Some optional plugins expose state changes through GET routes. Keep these exact
// templates fail-closed until their upstream contracts use safe HTTP semantics.
const STATE_CHANGING_READ_PATHS = new Set([
  '/meilisearch/reconnect',
  '/meilisearch/reindex',
  '/telegramnotifierapi/testnotifier',
  '/user_usage_stats/load_backup',
  '/user_usage_stats/save_backup',
  '/user_usage_stats/user_manage/add',
  '/user_usage_stats/user_manage/prune',
  '/user_usage_stats/user_manage/remove',
]);

/**
 * Classifies an OpenAPI operation by HTTP semantics plus known contract exceptions.
 * @param method - Upper- or lower-case HTTP method declared by OpenAPI.
 * @param path - Exact OpenAPI path template for the operation.
 * @returns Whether agents may execute the operation without mutation confirmation.
 */
export function isOpenApiOperationReadOnlySafe(method: string, path: string): boolean {
  return READ_ONLY_METHODS.has(method.toUpperCase()) &&
    !STATE_CHANGING_READ_PATHS.has(path.toLowerCase());
}
