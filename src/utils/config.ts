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

const ENV_ALIASES = {
  SERVER_URL: [ENV_KEYS.SERVER_URL, 'JF_SERVER_URL'],
  API_KEY: [ENV_KEYS.API_KEY, 'JF_API_KEY'],
  USERNAME: [ENV_KEYS.USERNAME, 'JF_USER'],
  PASSWORD: [ENV_KEYS.PASSWORD, 'JF_PASSWORD'],
  USER_ID: [ENV_KEYS.USER_ID, 'JF_USER_ID'],
  TIMEOUT: [ENV_KEYS.TIMEOUT, 'JF_TIMEOUT'],
  OUTPUT_FORMAT: [ENV_KEYS.OUTPUT_FORMAT, 'JF_FORMAT'],
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

function resolveEnvValue(keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

function getEnvConfig(): Partial<JellyfinConfig> {
  const config: Partial<JellyfinConfig> = {};

  const serverUrl = resolveEnvValue(ENV_ALIASES.SERVER_URL);
  if (serverUrl) {
    config.serverUrl = serverUrl;
  }
  const apiKey = resolveEnvValue(ENV_ALIASES.API_KEY);
  if (apiKey) {
    config.apiKey = apiKey;
  }
  const username = resolveEnvValue(ENV_ALIASES.USERNAME);
  if (username) {
    config.username = username;
  }
  const password = resolveEnvValue(ENV_ALIASES.PASSWORD);
  if (password) {
    config.password = password;
  }
  const userId = resolveEnvValue(ENV_ALIASES.USER_ID);
  if (userId) {
    config.userId = userId;
  }
  const timeoutValue = resolveEnvValue(ENV_ALIASES.TIMEOUT);
  if (timeoutValue) {
    const timeout = parseInt(timeoutValue, 10);
    if (!Number.isNaN(timeout)) {
      config.timeout = timeout;
    }
  }
  const outputFormat = resolveEnvValue(ENV_ALIASES.OUTPUT_FORMAT);
  if (outputFormat) {
    config.outputFormat = parseOutputFormat(outputFormat);
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
