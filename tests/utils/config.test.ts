import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, rmSync, mkdirSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const testConfigDir = join(tmpdir(), 'jellyfin-cli-test-' + Date.now());
const testSettingsFile = join(testConfigDir, 'settings.json');

import { getConfig, saveConfig, listServers, deleteServer, setCurrentServer, getSettingsPath, isGithubStarred, markGithubStarred } from '../../src/utils/config.js';

function createTestConfig() {
  if (!existsSync(testConfigDir)) {
    mkdirSync(testConfigDir, { recursive: true });
  }
}

function cleanupTestConfig() {
  if (existsSync(testConfigDir)) {
    rmSync(testConfigDir, { recursive: true, force: true });
  }
}

describe('config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.JELLYFIN_CONFIG_DIR = testConfigDir;
    cleanupTestConfig();
    
    const envKeys = [
      'JELLYFIN_SERVER_URL',
      'JF_SERVER_URL',
      'JELLYFIN_API_KEY',
      'JF_API_KEY',
      'JELLYFIN_USERNAME',
      'JF_USER',
      'JELLYFIN_PASSWORD',
      'JF_PASSWORD',
      'JELLYFIN_USER_ID',
      'JF_USER_ID',
      'JELLYFIN_TIMEOUT',
      'JF_TIMEOUT',
      'JELLYFIN_OUTPUT_FORMAT',
      'JF_FORMAT',
    ];
    
    for (const key of envKeys) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    cleanupTestConfig();
    vi.clearAllMocks();
  });

  describe('settings file operations', () => {
    it('should create settings file', () => {
      saveConfig({ serverUrl: 'http://test:8096' });
      expect(existsSync(testSettingsFile)).toBe(true);
    });

    it('should write settings file with owner-only permissions when supported', () => {
      saveConfig({ serverUrl: 'http://test:8096', apiKey: 'test-api-key' });
      if (process.platform === 'win32') {
        expect(existsSync(testSettingsFile)).toBe(true);
        return;
      }

      const mode = statSync(testSettingsFile).mode & 0o777;
      expect(mode).toBe(0o600);
    });

    it('should read settings file', () => {
      saveConfig({ serverUrl: 'http://test:8096' });
      const config = getConfig();
      expect(config.serverUrl).toBe('http://test:8096');
    });

    it('should handle missing settings file', () => {
      const config = getConfig();
      expect(config.serverUrl).toBe('');
    });
  });

  describe('environment variables', () => {
    it('should read server URL from env', () => {
      process.env.JELLYFIN_SERVER_URL = 'http://env-server:8096';
      expect(getConfig().serverUrl).toBe('http://env-server:8096');
    });

    it('should read API key from env', () => {
      process.env.JELLYFIN_API_KEY = 'test-api-key';
      expect(getConfig().apiKey).toBe('test-api-key');
    });

    it('should read username and password from env', () => {
      process.env.JELLYFIN_USERNAME = 'test-user';
      process.env.JELLYFIN_PASSWORD = 'pwd';
      expect(getConfig().username).toBe('test-user');
      expect(getConfig().password).toBe('pwd');
    });

    it('should read USER_ID from env', () => {
      process.env.JELLYFIN_USER_ID = 'user-1';
      expect(getConfig().userId).toBe('user-1');
    });

    it('should read output format from env', () => {
      process.env.JELLYFIN_OUTPUT_FORMAT = 'json';
      expect(getConfig().outputFormat).toBe('json');
    });

    it('should read yaml output format from env', () => {
      process.env.JELLYFIN_OUTPUT_FORMAT = 'yaml';
      expect(getConfig().outputFormat).toBe('yaml');
    });

    it('should read markdown output format from env', () => {
      process.env.JELLYFIN_OUTPUT_FORMAT = 'markdown';
      expect(getConfig().outputFormat).toBe('markdown');
    });

    it('should handle invalid output format from env', () => {
      process.env.JELLYFIN_OUTPUT_FORMAT = 'invalid';
      expect(getConfig().outputFormat).toBe('toon'); // default fallback
    });

    it('should read timeout from env', () => {
      process.env.JELLYFIN_TIMEOUT = '5000';
      expect(getConfig().timeout).toBe(5000);
    });

    it('should ignore invalid timeout from env', () => {
      process.env.JELLYFIN_TIMEOUT = 'invalid';
      expect(getConfig().timeout).toBe(30000); // default fallback
    });

    it('should read short JF_* alias env values', () => {
      process.env.JF_SERVER_URL = 'http://short-env:8096';
      process.env.JF_API_KEY = 'short-api-key';
      process.env.JF_USER = 'short-user';
      process.env.JF_PASSWORD = 'short-password';
      process.env.JF_USER_ID = 'short-user-id';
      process.env.JF_TIMEOUT = '9876';
      process.env.JF_FORMAT = 'yaml';

      const config = getConfig();
      expect(config.serverUrl).toBe('http://short-env:8096');
      expect(config.apiKey).toBe('short-api-key');
      expect(config.username).toBe('short-user');
      expect(config.password).toBe('short-password');
      expect(config.userId).toBe('short-user-id');
      expect(config.timeout).toBe(9876);
      expect(config.outputFormat).toBe('yaml');
    });

    it('should prefer JELLYFIN_* over JF_* when both are set', () => {
      process.env.JF_SERVER_URL = 'http://short-env:8096';
      process.env.JELLYFIN_SERVER_URL = 'http://long-env:8096';
      process.env.JF_API_KEY = 'short-api-key';
      process.env.JELLYFIN_API_KEY = 'long-api-key';
      process.env.JF_TIMEOUT = '2222';
      process.env.JELLYFIN_TIMEOUT = '3333';

      const config = getConfig();
      expect(config.serverUrl).toBe('http://long-env:8096');
      expect(config.apiKey).toBe('long-api-key');
      expect(config.timeout).toBe(3333);
    });
  });

  describe('config file structure', () => {
    it('should store default server config', () => {
      saveConfig({ serverUrl: 'http://default:8096', apiKey: 'default-key' });
      const config = getConfig();
      expect(config.serverUrl).toBe('http://default:8096');
    });

    it('should store named server configs', () => {
      saveConfig({ serverUrl: 'http://my-server:8096' }, 'my-server');
      saveConfig({ serverUrl: 'http://work:8096' }, 'work-server');
      const servers = listServers();
      expect(servers.length).toBe(2);
      expect(servers.find(s => s.name === 'my-server')?.config.serverUrl).toBe('http://my-server:8096');
    });

    it('should return default config if named server not found', () => {
      saveConfig({ serverUrl: 'http://def:8096' });
      const config = getConfig('unknown');
      expect(config.serverUrl).toBe('http://def:8096');
    });

    it('should get config for specific server', () => {
      saveConfig({ serverUrl: 'http://my-server:8096' }, 'my-server');
      const config = getConfig('my-server');
      expect(config.serverUrl).toBe('http://my-server:8096');
    });

    it('should track current server', () => {
      saveConfig({ serverUrl: 'http://my-server:8096' }, 'my-server', true);
      const config = getConfig();
      expect(config.serverUrl).toBe('http://my-server:8096');
    });
    
    it('should set current server', () => {
      saveConfig({ serverUrl: 'http://my-server:8096' }, 'my-server');
      setCurrentServer('my-server');
      const config = getConfig();
      expect(config.serverUrl).toBe('http://my-server:8096');
    });

    it('should set default current server', () => {
      saveConfig({ serverUrl: 'http://my-server:8096' }, 'my-server', true);
      saveConfig({ serverUrl: 'http://def:8096' });
      setCurrentServer('default');
      const config = getConfig();
      expect(config.serverUrl).toBe('http://def:8096');
    });
    
    it('should handle setting invalid current server', () => {
      const res = setCurrentServer('invalid');
      expect(res).toBe(false);
    });

    it('should handle list servers with default', () => {
      saveConfig({ serverUrl: 'http://def:8096' });
      const servers = listServers();
      expect(servers.length).toBe(1);
      expect(servers[0].isDefault).toBe(true);
    });

    it('should delete named server', () => {
      saveConfig({ serverUrl: 'http://s1:8096' }, 's1');
      saveConfig({ serverUrl: 'http://s2:8096' }, 's2');
      deleteServer('s1');
      const servers = listServers();
      expect(servers.length).toBe(1);
      expect(servers[0].name).toBe('s2');
    });

    it('should delete current named server and reset currentServer', () => {
      saveConfig({ serverUrl: 'http://s1:8096' }, 's1', true);
      deleteServer('s1');
      const content = JSON.parse(readFileSync(testSettingsFile, 'utf-8'));
      expect(content.currentServer).toBeUndefined();
    });

    it('should delete default server', () => {
      saveConfig({ serverUrl: 'http://def:8096' });
      deleteServer('default');
      const servers = listServers();
      expect(servers.length).toBe(0);
    });

    it('should return false when deleting invalid server', () => {
      const res = deleteServer('invalid');
      expect(res).toBe(false);
    });

    it('should get settings path', () => {
      expect(getSettingsPath()).toBe(testSettingsFile);
    });

    it('should check and set github starred', () => {
      markGithubStarred();
      expect(isGithubStarred()).toBe(true);
    });

    it('should handle malformed settings file', () => {
      createTestConfig();
      writeFileSync(testSettingsFile, '{ invalid json', 'utf-8');
      const config = getConfig();
      expect(config.serverUrl).toBe('');
    });
  });
});
