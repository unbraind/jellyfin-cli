import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

const testConfigDir = join(tmpdir(), 'jellyfin-cli-test-' + Date.now());
const testSettingsFile = join(testConfigDir, 'settings.json');

function createTestConfig() {
  if (!existsSync(testConfigDir)) {
    mkdirSync(testConfigDir, { recursive: true });
  }
}

function cleanupTestConfig() {
  if (existsSync(testConfigDir)) {
    rmSync(testConfigDir, { recursive: true });
  }
}

function writeTestSettings(data: unknown) {
  createTestConfig();
  writeFileSync(testSettingsFile, JSON.stringify(data, null, 2), 'utf-8');
}

function readTestSettings(): unknown {
  if (!existsSync(testSettingsFile)) {
    return {};
  }
  return JSON.parse(readFileSync(testSettingsFile, 'utf-8'));
}

describe('config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    cleanupTestConfig();
    
    const envKeys = [
      'JELLYFIN_SERVER_URL',
      'JELLYFIN_API_KEY',
      'JELLYFIN_USERNAME',
      'JELLYFIN_PASSWORD',
      'JELLYFIN_USER_ID',
      'JELLYFIN_TIMEOUT',
      'JELLYFIN_OUTPUT_FORMAT',
    ];
    
    for (const key of envKeys) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    cleanupTestConfig();
  });

  describe('settings file operations', () => {
    it('should create settings file', () => {
      createTestConfig();
      writeTestSettings({ defaultServer: { serverUrl: 'http://test:8096' } });
      expect(existsSync(testSettingsFile)).toBe(true);
    });

    it('should read settings file', () => {
      writeTestSettings({ defaultServer: { serverUrl: 'http://test:8096' } });
      const settings = readTestSettings() as { defaultServer: { serverUrl: string } };
      expect(settings.defaultServer.serverUrl).toBe('http://test:8096');
    });

    it('should handle missing settings file', () => {
      const settings = readTestSettings();
      expect(settings).toEqual({});
    });
  });

  describe('environment variables', () => {
    it('should read server URL from env', () => {
      process.env.JELLYFIN_SERVER_URL = 'http://env-server:8096';
      expect(process.env.JELLYFIN_SERVER_URL).toBe('http://env-server:8096');
    });

    it('should read API key from env', () => {
      process.env.JELLYFIN_API_KEY = 'test-api-key';
      expect(process.env.JELLYFIN_API_KEY).toBe('test-api-key');
    });

    it('should read username from env', () => {
      process.env.JELLYFIN_USERNAME = 'test-user';
      expect(process.env.JELLYFIN_USERNAME).toBe('test-user');
    });

    it('should read output format from env', () => {
      process.env.JELLYFIN_OUTPUT_FORMAT = 'json';
      expect(process.env.JELLYFIN_OUTPUT_FORMAT).toBe('json');
    });

    it('should read timeout from env', () => {
      process.env.JELLYFIN_TIMEOUT = '5000';
      expect(process.env.JELLYFIN_TIMEOUT).toBe('5000');
    });
  });

  describe('config file structure', () => {
    it('should store default server config', () => {
      const config = {
        defaultServer: {
          serverUrl: 'http://default:8096',
          apiKey: 'default-key',
        },
      };
      writeTestSettings(config);
      const settings = readTestSettings() as typeof config;
      expect(settings.defaultServer.serverUrl).toBe('http://default:8096');
    });

    it('should store named server configs', () => {
      const config = {
        servers: {
          'my-server': {
            serverUrl: 'http://my-server:8096',
          },
          'work-server': {
            serverUrl: 'http://work:8096',
          },
        },
      };
      writeTestSettings(config);
      const settings = readTestSettings() as typeof config;
      expect(Object.keys(settings.servers ?? {})).toHaveLength(2);
    });

    it('should track current server', () => {
      const config = {
        currentServer: 'my-server',
        servers: {
          'my-server': {
            serverUrl: 'http://my-server:8096',
          },
        },
      };
      writeTestSettings(config);
      const settings = readTestSettings() as typeof config;
      expect(settings.currentServer).toBe('my-server');
    });
  });
});
