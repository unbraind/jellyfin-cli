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

export function sanitizeServerAddress(address?: string | null): string | undefined {
  if (!address) {
    return undefined;
  }
  return address.replace(/^(https?:\/\/)(https?:\/\/)/i, '$2');
}

interface ServerEntry {
  name: string;
  isDefault: boolean;
}

export function resolveSetupSaveServerName(
  explicitName: string | undefined,
  servers: ServerEntry[],
): string | undefined {
  if (explicitName && explicitName.trim().length > 0) {
    return explicitName;
  }

  const activeNamed = servers.find((server) => server.isDefault && server.name !== 'default');
  return activeNamed?.name;
}
