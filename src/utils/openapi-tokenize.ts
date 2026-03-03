function splitCamelCaseToken(token: string): string[] {
  return token
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/\s+/g)
    .filter((part) => part.length > 0);
}

function normalizeToken(token: string): string {
  if (token.endsWith('s') && token.length > 3) {
    return token.slice(0, -1);
  }
  return token;
}

export function tokenizeIntentValue(value: string): string[] {
  return value
    .split(/[^A-Za-z0-9]+/g)
    .flatMap((part) => splitCamelCaseToken(part))
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 1)
    .map((token) => normalizeToken(token));
}

export function tokenizePathValue(path: string): Set<string> {
  return new Set(tokenizeIntentValue(path));
}
