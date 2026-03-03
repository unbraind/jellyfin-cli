import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { JellyfinConfig } from '../types/index.js';
import { parseOutputFormat } from './output-format.js';

function getConfigDir(): string {
  return process.env.JELLYFIN_CONFIG_DIR || join(homedir(), '.jellyfin-cli');
}

function getSettingsFile(): string {
  return join(getConfigDir(), 'settings.json');
}

export const ENV_KEYS = {
  SERVER_URL: 'JELLYFIN_SERVER_URL',
  API_KEY: 'JELLYFIN_API_KEY',
  USERNAME: 'JELLYFIN_USERNAME',
  PASSWORD: 'JELLYFIN_PASSWORD',
  USER_ID: 'JELLYFIN_USER_ID',
  TIMEOUT: 'JELLYFIN_TIMEOUT',
  OUTPUT_FORMAT: 'JELLYFIN_OUTPUT_FORMAT',
} as const;

interface SettingsFile {
  defaultServer?: JellyfinConfig;
  servers?: Record<string, JellyfinConfig>;
  currentServer?: string;
  githubStarred?: boolean;
}

function ensureConfigDir(): void {
  const dir = getConfigDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function readSettingsFile(): SettingsFile {
  ensureConfigDir();
  const file = getSettingsFile();
  if (existsSync(file)) {
    try {
      const content = readFileSync(file, 'utf-8');
      return JSON.parse(content) as SettingsFile;
    } catch {
      return {};
    }
  }
  return {};
}

function writeSettingsFile(settings: SettingsFile): void {
  ensureConfigDir();
  const settingsPath = getSettingsFile();
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2), { encoding: 'utf-8', mode: 0o600 });
  try {
    chmodSync(settingsPath, 0o600);
  } catch {
    // Best-effort hardening (e.g. some filesystems/platforms may reject chmod).
  }
}

export { writeSettingsFile };

function getEnvConfig(): Partial<JellyfinConfig> {
  const config: Partial<JellyfinConfig> = {};
  
  if (process.env[ENV_KEYS.SERVER_URL]) {
    config.serverUrl = process.env[ENV_KEYS.SERVER_URL];
  }
  if (process.env[ENV_KEYS.API_KEY]) {
    config.apiKey = process.env[ENV_KEYS.API_KEY];
  }
  if (process.env[ENV_KEYS.USERNAME]) {
    config.username = process.env[ENV_KEYS.USERNAME];
  }
  if (process.env[ENV_KEYS.PASSWORD]) {
    config.password = process.env[ENV_KEYS.PASSWORD];
  }
  if (process.env[ENV_KEYS.USER_ID]) {
    config.userId = process.env[ENV_KEYS.USER_ID];
  }
  if (process.env[ENV_KEYS.TIMEOUT]) {
    const timeout = parseInt(process.env[ENV_KEYS.TIMEOUT]!, 10);
    if (!Number.isNaN(timeout)) {
      config.timeout = timeout;
    }
  }
  if (process.env[ENV_KEYS.OUTPUT_FORMAT]) {
    config.outputFormat = parseOutputFormat(process.env[ENV_KEYS.OUTPUT_FORMAT]);
  }
  
  return config;
}

function getFileConfig(serverName?: string): Partial<JellyfinConfig> {
  const settings = readSettingsFile();
  
  if (serverName && settings.servers?.[serverName]) {
    return settings.servers[serverName];
  }
  
  if (settings.currentServer && settings.servers?.[settings.currentServer]) {
    return settings.servers[settings.currentServer];
  }
  
  return settings.defaultServer ?? {};
}

export function getConfig(serverName?: string): JellyfinConfig {
  const envConfig = getEnvConfig();
  const fileConfig = getFileConfig(serverName);
  
  const merged: JellyfinConfig = {
    serverUrl: envConfig.serverUrl ?? fileConfig.serverUrl ?? '',
    apiKey: envConfig.apiKey ?? fileConfig.apiKey,
    username: envConfig.username ?? fileConfig.username,
    password: envConfig.password ?? fileConfig.password,
    userId: envConfig.userId ?? fileConfig.userId,
    timeout: envConfig.timeout ?? fileConfig.timeout ?? 30000,
    outputFormat: envConfig.outputFormat ?? fileConfig.outputFormat ?? 'toon',
  };
  
  return merged;
}

export function saveConfig(config: JellyfinConfig, serverName?: string, setAsDefault = false): void {
  const settings = readSettingsFile();
  
  if (serverName) {
    settings.servers = settings.servers ?? {};
    settings.servers[serverName] = config;
    if (setAsDefault) {
      settings.currentServer = serverName;
    }
  } else {
    settings.defaultServer = config;
  }
  
  writeSettingsFile(settings);
}

export function listServers(): { name: string; config: JellyfinConfig; isDefault: boolean }[] {
  const settings = readSettingsFile();
  const servers: { name: string; config: JellyfinConfig; isDefault: boolean }[] = [];
  
  if (settings.defaultServer) {
    servers.push({ name: 'default', config: settings.defaultServer, isDefault: !settings.currentServer });
  }
  
  if (settings.servers) {
    for (const [name, config] of Object.entries(settings.servers)) {
      servers.push({ name, config, isDefault: settings.currentServer === name });
    }
  }
  
  return servers;
}

export function deleteServer(name: string): boolean {
  const settings = readSettingsFile();
  
  if (name === 'default') {
    delete settings.defaultServer;
    writeSettingsFile(settings);
    return true;
  }
  
  if (settings.servers?.[name]) {
    delete settings.servers[name];
    if (settings.currentServer === name) {
      settings.currentServer = undefined;
    }
    writeSettingsFile(settings);
    return true;
  }
  
  return false;
}

export function setCurrentServer(name: string): boolean {
  const settings = readSettingsFile();
  
  if (name === 'default') {
    settings.currentServer = undefined;
    writeSettingsFile(settings);
    return true;
  }
  
  if (settings.servers?.[name]) {
    settings.currentServer = name;
    writeSettingsFile(settings);
    return true;
  }
  
  return false;
}

export function getSettingsPath(): string {
  return getSettingsFile();
}

export function isGithubStarred(): boolean {
  return readSettingsFile().githubStarred === true;
}

export function markGithubStarred(): void {
  const settings = readSettingsFile();
  settings.githubStarred = true;
  writeSettingsFile(settings);
}
