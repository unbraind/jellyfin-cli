function splitCamelCaseToken(token: string): string[] {
  return token
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/\s+/g)
    .filter((part) => part.length > 0);
}

function normalizeToken(token: string): string {
  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }
  if (
    token.endsWith('s')
    && token.length > 3
    && !token.endsWith('ss')
    && !token.endsWith('us')
    && !token.endsWith('is')
  ) {
    return token.slice(0, -1);
  }
  return token;
}

function expandTokenAliases(token: string): string[] {
  switch (token) {
    case 'apikey':
      return ['apikey', 'api', 'key', 'auth'];
    case 'health':
      return ['health', 'ping'];
    case 'quickconnect':
      return ['quickconnect', 'quick', 'connect'];
    case 'livetv':
      return ['livetv', 'live', 'tv'];
    case 'syncplay':
      return ['syncplay', 'sync', 'play'];
    case 'userdata':
      return ['userdata', 'user', 'data'];
    case 'clientlog':
      return ['clientlog', 'client', 'log', 'document'];
    case 'chapter':
      return ['chapter', 'segment'];
    case 'identify':
      return ['identify', 'search', 'lookup', 'remote'];
    case 'notification':
      return ['notification', 'notify', 'message'];
    case 'unshare':
      return ['unshare', 'share', 'remove'];
    case 'run':
      return ['run', 'running', 'start', 'execute'];
    case 'transcoding':
      return ['transcoding', 'encoding', 'transcode'];
    case 'mute':
      return ['mute', 'command'];
    case 'unmute':
      return ['unmute', 'command'];
    case 'volume':
      return ['volume', 'level', 'command'];
    default:
      return [token];
  }
}

export function tokenizeIntentValue(value: string): string[] {
  const tokens = value
    .split(/[^A-Za-z0-9]+/g)
    .flatMap((part) => splitCamelCaseToken(part))
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 1)
    .map((token) => normalizeToken(token))
    .flatMap((token) => expandTokenAliases(token));

  return Array.from(new Set(tokens));
}

export function tokenizePathValue(path: string): Set<string> {
  return new Set(tokenizeIntentValue(path));
}
