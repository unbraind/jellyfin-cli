export function isValidServerUrl(serverUrl: string): boolean {
  try {
    const parsed = new URL(serverUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function maskSecret(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}...${value.slice(-2)}`;
}

export function quoteShellValue(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
