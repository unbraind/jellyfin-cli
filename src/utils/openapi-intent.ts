export const LOW_SIGNAL_TOKENS = new Set([
  'get',
  'list',
  'set',
  'create',
  'delete',
  'update',
  'info',
  'status',
  'show',
  'id',
  'name',
  'type',
  'index',
]);

const READ_ONLY_INTENT_TOKENS = new Set(['get', 'list', 'info', 'status', 'show']);
const MUTATING_INTENT_TOKENS = new Set([
  'add',
  'apply',
  'cancel',
  'clear',
  'create',
  'delete',
  'disable',
  'enable',
  'install',
  'merge',
  'move',
  'remove',
  'rename',
  'report',
  'restore',
  'restart',
  'set',
  'split',
  'start',
  'stop',
  'trigger',
  'uninstall',
  'update',
  'upload',
]);

export function isReadOnlyIntent(tokens: string[]): boolean {
  const hasReadOnlyToken = tokens.some((token) => READ_ONLY_INTENT_TOKENS.has(token));
  const hasMutatingToken = tokens.some((token) => MUTATING_INTENT_TOKENS.has(token));
  return hasReadOnlyToken && !hasMutatingToken;
}
