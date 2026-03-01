import { describe, it, expect } from 'vitest';
import {
  formatToon,
  formatSystemInfo,
  formatUsers,
  formatUser,
  formatItems,
  formatItem,
  formatSessions,
  formatSession,
  formatQueryResult,
  formatSearchResult,
  formatLibraries,
  formatTasks,
  formatActivityLog,
  formatMessage,
  formatError,
  formatConfig,
} from '../../src/formatters/toon.js';
import type { SystemInfo, UserDto, BaseItemDto, SessionInfo, QueryResult, SearchResult, LibraryVirtualFolder, ScheduledTaskInfo, ActivityLogEntry, JellyfinConfig } from '../../src/types/index.js';

describe('toon formatters', () => {
  describe('formatToon', () => {
    it('should format empty output', () => {
      const result = formatToon(null);
      expect(result).toContain('type: empty');
    });

    it('should format string output', () => {
      const result = formatToon('Hello World');
      expect(result).toContain('type: msg');
      expect(result).toContain('Hello World');
    });

    it('should format number output', () => {
      const result = formatToon(42);
      expect(result).toContain('type: val');
      expect(result).toContain('42');
    });

    it('should format array output', () => {
      const result = formatToon([1, 2, 3]);
      expect(result).toContain('type: list');
    });

    it('should use type hint', () => {
      const result = formatToon({ test: 'data' }, 'custom_type');
      expect(result).toContain('type: custom_type');
    });
  });

  describe('formatSystemInfo', () => {
    it('should format system info', () => {
      const info: SystemInfo = {
        ServerName: 'Test Server',
        Version: '10.8.0',
        Id: 'server-1',
        LocalAddress: 'http://localhost:8096',
        OperatingSystem: 'Linux',
        HasPendingRestart: false,
        CanSelfRestart: true,
        WebSocketPortNumber: 8096,
      };
      const result = formatSystemInfo(info);
      expect(result).toContain('type: sys');
      expect(result).toContain('Test Server');
      expect(result).toContain('10.8.0');
    });
  });

  describe('formatUsers', () => {
    it('should format user list', () => {
      const users: UserDto[] = [
        { Id: 'user-1', Name: 'User1', Policy: { IsAdministrator: true } },
        { Id: 'user-2', Name: 'User2', Policy: { IsAdministrator: false } },
      ];
      const result = formatUsers(users);
      expect(result).toContain('type: users');
      expect(result).toContain('User1');
      expect(result).toContain('User2');
    });
  });

  describe('formatUser', () => {
    it('should format single user', () => {
      const user: UserDto = {
        Id: 'user-1',
        Name: 'Test User',
        Policy: { IsAdministrator: true },
        Configuration: { SubtitleLanguagePreference: 'en' },
      };
      const result = formatUser(user);
      expect(result).toContain('type: user');
      expect(result).toContain('Test User');
    });
  });

  describe('formatItems', () => {
    it('should format item list', () => {
      const items: BaseItemDto[] = [
        { Id: 'item-1', Name: 'Movie 1', Type: 'Movie', ProductionYear: 2020 },
        { Id: 'item-2', Name: 'Show 1', Type: 'Series', ProductionYear: 2021 },
      ];
      const result = formatItems(items);
      expect(result).toContain('type: items');
      expect(result).toContain('Movie 1');
      expect(result).toContain('Show 1');
    });
  });

  describe('formatItem', () => {
    it('should format single item', () => {
      const item: BaseItemDto = {
        Id: 'item-1',
        Name: 'Test Movie',
        Type: 'Movie',
        ProductionYear: 2020,
        Overview: 'A test movie',
        Genres: ['Action', 'Drama'],
        RunTimeTicks: 72000000000,
      };
      const result = formatItem(item);
      expect(result).toContain('type: item');
      expect(result).toContain('Test Movie');
      expect(result).toContain('Action');
    });
  });

  describe('formatSessions', () => {
    it('should format session list', () => {
      const sessions: SessionInfo[] = [
        { Id: 'session-1', UserName: 'User1', Client: 'Jellyfin Web' },
        { Id: 'session-2', UserName: 'User2', Client: 'Jellyfin Android' },
      ];
      const result = formatSessions(sessions);
      expect(result).toContain('type: sessions');
      expect(result).toContain('User1');
      expect(result).toContain('Jellyfin Web');
    });
  });

  describe('formatSession', () => {
    it('should format single session', () => {
      const session: SessionInfo = {
        Id: 'session-1',
        UserName: 'Test User',
        Client: 'Jellyfin Web',
        DeviceName: 'Chrome',
        PlayState: { IsPaused: false, IsMuted: false },
      };
      const result = formatSession(session);
      expect(result).toContain('type: session');
      expect(result).toContain('Test User');
      expect(result).toContain('Chrome');
    });
  });

  describe('formatQueryResult', () => {
    it('should format query result', () => {
      const result: QueryResult<BaseItemDto> = {
        Items: [{ Id: 'item-1', Name: 'Test' }],
        TotalRecordCount: 1,
        StartIndex: 0,
      };
      const formatted = formatQueryResult(result);
      expect(formatted).toContain('type: items');
      expect(formatted).toContain('total: 1');
    });
  });

  describe('formatSearchResult', () => {
    it('should format search result', () => {
      const result: SearchResult = {
        SearchHints: [{ Id: 'hint-1', Name: 'Test Result' }],
        TotalRecordCount: 1,
      };
      const formatted = formatSearchResult(result);
      expect(formatted).toContain('type: search');
      expect(formatted).toContain('Test Result');
    });
  });

  describe('formatLibraries', () => {
    it('should format library list', () => {
      const libraries: LibraryVirtualFolder[] = [
        { Name: 'Movies', ItemId: 'lib-1', CollectionType: 'movies' },
        { Name: 'Shows', ItemId: 'lib-2', CollectionType: 'tvshows' },
      ];
      const result = formatLibraries(libraries);
      expect(result).toContain('type: libs');
      expect(result).toContain('Movies');
      expect(result).toContain('Shows');
    });
  });

  describe('formatTasks', () => {
    it('should format task list', () => {
      const tasks: ScheduledTaskInfo[] = [
        { Id: 'task-1', Name: 'Scan Library', State: 'Idle', Key: 'RefreshLibrary' },
        { Id: 'task-2', Name: 'Clean Cache', State: 'Running', Key: 'DeleteCacheFiles' },
      ];
      const result = formatTasks(tasks);
      expect(result).toContain('type: tasks');
      expect(result).toContain('Scan Library');
    });
  });

  describe('formatActivityLog', () => {
    it('should format activity log', () => {
      const entries: ActivityLogEntry[] = [
        { Id: 1, Name: 'User Login', Type: 'UserLoggedIn', Date: '2024-01-01T00:00:00Z' },
      ];
      const result = formatActivityLog(entries);
      expect(result).toContain('type: activity');
      expect(result).toContain('User Login');
    });
  });

  describe('formatMessage', () => {
    it('should format success message', () => {
      const result = formatMessage('Operation successful');
      expect(result).toContain('type: ok');
      expect(result).toContain('msg:');
      expect(result).toContain('Operation successful');
    });
  });

  describe('formatError', () => {
    it('should format error message', () => {
      const result = formatError('Something went wrong', 500);
      expect(result).toContain('type: err');
      expect(result).toContain('err:');
      expect(result).toContain('Something went wrong');
      expect(result).toContain('code: 500');
    });
  });

  describe('formatConfig', () => {
    it('should format config safely', () => {
      const config: JellyfinConfig = {
        serverUrl: 'http://localhost:8096',
        apiKey: 'secret-key-12345',
        username: 'user',
        password: 'mySecretPassword123',
        userId: 'user-1',
        timeout: 30000,
        outputFormat: 'toon',
      };
      const result = formatConfig(config);
      expect(result).toContain('type: config');
      expect(result).toContain('http://localhost:8096');
      expect(result).toContain('key: true');
      expect(result).toContain('pw: true');
      expect(result).not.toContain('secret-key-12345');
      expect(result).not.toContain('mySecretPassword123');
    });
  });
});
