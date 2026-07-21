/**
 * Produces the validated is valid server url result used by CLI automation.
 * @param serverUrl - The server url value required by this operation.
 * @returns - Whether the inspected value satisfies the documented condition.
 */
export function isValidServerUrl(serverUrl: string): boolean {
  try {
    const parsed = new URL(serverUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Produces the validated mask secret result used by CLI automation.
 * @param value - The value value required by this operation.
 * @returns - The normalized string representation.
 */
export function maskSecret(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}...${value.slice(-2)}`;
}

/**
 * Produces the validated quote shell value result used by CLI automation.
 * @param value - The value value required by this operation.
 * @returns - The normalized string representation.
 */
export function quoteShellValue(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * Produces the validated sanitize server address result used by CLI automation.
 * @param address - The address value required by this operation.
 * @returns - The normalized string representation.
 */
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

/**
 * Retrieves or derives setup save server name without mutating Jellyfin state.
 * @param explicitName - The explicit name value required by this operation.
 * @param servers - The servers value required by this operation.
 * @returns - The normalized string representation.
 */
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
