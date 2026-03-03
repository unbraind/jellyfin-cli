import { describe, it, expect } from 'vitest';
import { formatItems, formatItem, formatQueryResult, formatSearchResult, formatLibraries, formatActivityLog, formatLiveTvInfo } from '../../src/formatters/items.js';
import { formatSessions, formatSession, formatTask, formatTaskTriggers } from '../../src/formatters/sessions.js';
import { formatSystemInfo, formatUsers, formatUser, formatConfig, formatServers } from '../../src/formatters/system.js';

describe('formatItems', () => {
  it('should format items with all fields', () => {
    const items = [{
      Id: 'item-1',
      Name: 'Test Movie',
      Type: 'Movie',
      ProductionYear: 2022,
      CommunityRating: 7.5,
      RunTimeTicks: 5400000000,
      Genres: ['Action', 'Drama'],
      UserData: { Played: true, IsFavorite: false, PlayCount: 2, UnplayedItemCount: 0 },
    }];
    const result = formatItems(items);
    expect(result).toContain('item-1');
    expect(result).toContain('Test Movie');
    expect(result).toContain('2022');
    expect(result).toContain('Action');
  });

  it('should format items with minimal fields', () => {
    const items = [{ Id: 'item-min', Name: 'Minimal' }];
    const result = formatItems(items);
    expect(result).toContain('item-min');
    expect(result).toContain('Minimal');
  });

  it('should format items with no genres (empty array)', () => {
    const items = [{ Id: 'item-1', Name: 'No Genres', Genres: [] }];
    const result = formatItems(items);
    expect(result).toContain('No Genres');
    // Empty genres array should not be included
    expect(result).not.toContain('genres:');
  });
});

describe('formatItem', () => {
  it('should format a full item with all fields', () => {
    const item = {
      Id: 'item-1',
      Name: 'Full Item',
      Type: 'Movie',
      Path: '/media/movie.mkv',
      ProductionYear: 2021,
      OfficialRating: 'PG-13',
      CommunityRating: 8.1,
      CriticRating: 90,
      RunTimeTicks: 7200000000,
      Status: 'Ended',
      PremiereDate: '2021-01-01T00:00:00Z',
      EndDate: '2021-12-31T00:00:00Z',
      Genres: ['Drama'],
      Studios: [{ Name: 'Studio A' }],
      People: [{ Name: 'Actor A', Role: 'Lead', Type: 'Actor' }],
      Overview: 'A great movie',
      Taglines: ['The best movie ever'],
      MediaSources: [{
        Id: 'src-1', Name: 'Movie.mkv', Container: 'mkv',
        Path: '/media/movie.mkv', Bitrate: 20000000, Size: 5000000000,
      }],
      MediaStreams: [{
        Index: 0, Type: 'Video', Codec: 'hevc', Language: 'eng',
        Title: 'Main', Width: 1920, Height: 1080,
        Channels: undefined, IsDefault: true, IsForced: false,
      }],
      UserData: {
        Played: true, IsFavorite: true, PlayCount: 3,
        LastPlayedDate: '2024-01-01T00:00:00Z', PlaybackPositionTicks: 0,
      },
      ChildCount: 0,
      RecursiveItemCount: 1,
    };
    const result = formatItem(item);
    expect(result).toContain('type: item');
    expect(result).toContain('Full Item');
    expect(result).toContain('A great movie');
    expect(result).toContain('Studio A');
    expect(result).toContain('Actor A');
  });

  it('should format item without optional fields', () => {
    const item = { Id: 'item-bare', Name: 'Bare Item' };
    const result = formatItem(item);
    expect(result).toContain('type: item');
    expect(result).toContain('Bare Item');
  });

  it('should truncate people list to 10 items', () => {
    const people = Array.from({ length: 15 }, (_, i) => ({ Name: `Person ${i}`, Type: 'Actor' }));
    const item = { Id: 'item-1', Name: 'Many People', People: people };
    const result = formatItem(item);
    // Should include person 9 but not person 14
    expect(result).toContain('Person 0');
    expect(result).toContain('Person 9');
    expect(result).not.toContain('Person 10');
  });
});

describe('formatQueryResult', () => {
  it('should format query result with items', () => {
    const result = { TotalRecordCount: 10, StartIndex: 0, Items: [{ Id: 'i1', Name: 'Item 1' }, { Id: 'i2', Name: 'Item 2' }] };
    const output = formatQueryResult(result);
    expect(output).toContain('total');
    expect(output).toContain('10');
  });

  it('should format query result with custom item formatter', () => {
    const result = { TotalRecordCount: 2, StartIndex: 0, Items: [{ Id: 'a', val: 1 }, { Id: 'b', val: 2 }] };
    const output = formatQueryResult(result, (item) => ({ custom: (item as Record<string, unknown>).val }));
    expect(output).toContain('custom');
  });

  it('should format empty query result', () => {
    const result = { TotalRecordCount: 0, StartIndex: 0, Items: [] };
    const output = formatQueryResult(result);
    expect(output).toContain('total');
    expect(output).toContain('0');
  });

  it('should handle query result with null items', () => {
    const result = { TotalRecordCount: 0 };
    const output = formatQueryResult(result as never);
    expect(output).toContain('type: items');
  });
});

describe('formatSearchResult', () => {
  it('should format search result with hints', () => {
    const result = {
      TotalRecordCount: 2,
      SearchHints: [
        {
          Id: 'h1', Name: 'Movie A', Type: 'Movie', ProductionYear: 2020,
          RunTimeTicks: 5000000000, MediaType: 'Video',
          Series: undefined, Album: undefined, IndexNumber: undefined, ParentIndexNumber: undefined,
        },
        {
          Id: 'h2', Name: 'Episode B', Type: 'Episode',
          Series: 'Great Show', Album: undefined,
          IndexNumber: 5, ParentIndexNumber: 2,
        },
      ],
    };
    const output = formatSearchResult(result);
    expect(output).toContain('type: search');
    expect(output).toContain('Movie A');
    expect(output).toContain('Episode B');
    expect(output).toContain('Great Show');
    expect(output).toContain('2');
  });

  it('should format empty search result', () => {
    const result = { TotalRecordCount: 0, SearchHints: [] };
    const output = formatSearchResult(result);
    expect(output).toContain('type: search');
    expect(output).toContain('0');
  });
});

describe('formatLibraries', () => {
  it('should format libraries with paths', () => {
    const libs = [{
      Name: 'Movies', ItemId: 'lib-1', CollectionType: 'movies',
      Locations: ['/data/movies'], RefreshStatus: 'Idle',
    }];
    const output = formatLibraries(libs);
    expect(output).toContain('type: libs');
    expect(output).toContain('Movies');
    expect(output).toContain('/data/movies');
  });

  it('should format libraries without paths', () => {
    const libs = [{ Name: 'Music', CollectionType: 'music', Locations: [] }];
    const output = formatLibraries(libs);
    expect(output).toContain('Music');
    expect(output).not.toContain('paths:');
  });
});

describe('formatActivityLog', () => {
  it('should format activity log entries', () => {
    const entries = [{
      Type: 'AuthenticationSucceeded',
      Name: 'Login',
      UserId: 'user-1',
      Date: '2024-01-01T00:00:00Z',
      ItemId: undefined,
      Severity: 'Info',
    }];
    const output = formatActivityLog(entries);
    expect(output).toContain('type: activity');
    expect(output).toContain('AuthenticationSucceeded');
    expect(output).toContain('user-1');
  });
});

describe('formatLiveTvInfo', () => {
  it('should format live TV info with services', () => {
    const info = {
      IsEnabled: true,
      Services: [{ Name: 'HDHomeRun', Status: 'Ok', Version: '1.0' }],
    };
    const output = formatLiveTvInfo(info);
    expect(output).toContain('type: livetv');
    expect(output).toContain('HDHomeRun');
    expect(output).toContain('Ok');
  });

  it('should format live TV info without services', () => {
    const info = { IsEnabled: false, Services: [] };
    const output = formatLiveTvInfo(info);
    expect(output).toContain('type: livetv');
  });
});

describe('formatSession - additional coverage', () => {
  it('should format session with now playing item and all play state fields', () => {
    const session = {
      Id: 's1',
      UserName: 'Bob',
      Client: 'Kodi',
      DeviceName: 'TV',
      ApplicationVersion: '21.0',
      LastActivityDate: '2024-01-01T00:00:00Z',
      SupportsRemoteControl: true,
      NowPlayingItem: { Id: 'item-1', Name: 'Now Playing', Type: 'Episode', RunTimeTicks: 3600000000 },
      PlayState: {
        IsPaused: false, IsMuted: false, PositionTicks: 600000000,
        VolumeLevel: 80, RepeatMode: 'RepeatOne', PlaybackOrder: 'Default',
      },
    };
    const result = formatSession(session);
    expect(result).toContain('Bob');
    expect(result).toContain('Now Playing');
    expect(result).toContain('80');
  });

  it('should format session with shuffle mode active', () => {
    const sessions = [{
      Id: 's-shuffle',
      PlayState: { PlaybackOrder: 'Shuffle', IsPaused: false, IsMuted: false },
    }];
    const result = formatSessions(sessions);
    expect(result).toContain('s-shuffle');
  });

  it('should format session without play state', () => {
    const session = { Id: 's-idle', UserName: 'Idle User' };
    const result = formatSession(session);
    expect(result).toContain('s-idle');
  });
});

describe('formatTaskTriggers', () => {
  it('should format triggers with all fields', () => {
    const triggers = [
      { Id: 'trig-1', Type: 'DailyTrigger', TimeOfDayTicks: 36000000000, DayOfWeek: ['Monday', 'Wednesday'] },
      { Id: 'trig-2', Type: 'IntervalTrigger', IntervalTicks: 864000000000 },
      { Id: 'trig-3', Type: 'StartupTrigger' },
    ];
    const result = formatTaskTriggers(triggers);
    expect(result).toContain('type: triggers');
    expect(result).toContain('trig-1');
    expect(result).toContain('DailyTrigger');
    expect(result).toContain('trig-2');
    expect(result).toContain('IntervalTrigger');
  });

  it('should format empty triggers', () => {
    const result = formatTaskTriggers([]);
    expect(result).toContain('type: triggers');
  });
});

describe('formatTask - with Progress', () => {
  it('should format task with progress percentage', () => {
    const task = {
      Id: 'task-running',
      Name: 'Running Task',
      State: 'Running',
      Key: 'RunningTask',
      Category: 'Library',
      Progress: 42.5,
      LastExecutionResult: {
        StartTimeUtc: '2024-01-01T00:00:00Z',
        EndTimeUtc: '2024-01-01T01:00:00Z',
        Status: 'Completed',
      },
    };
    const result = formatTask(task);
    expect(result).toContain('Running Task');
    expect(result).toContain('42.5');
  });
});

describe('formatSystemInfo - URL sanitization', () => {
  it('should sanitize double-http URLs', () => {
    const info = {
      ServerName: 'Test Server',
      Version: '10.11.0',
      Id: 'server-id',
      LocalAddress: 'http://http://192.168.1.1:8096',
      OperatingSystem: 'Linux',
      HasPendingRestart: false,
      CanSelfRestart: true,
    };
    const result = formatSystemInfo(info);
    expect(result).toContain('http://192.168.1.1:8096');
    expect(result).not.toContain('http://http://');
  });

  it('should handle null LocalAddress', () => {
    const info = {
      ServerName: 'Test', Version: '10.0', Id: 'id-1',
      LocalAddress: null, HasPendingRestart: false, CanSelfRestart: true,
    };
    const result = formatSystemInfo(info as never);
    expect(result).toContain('type: sys');
  });

  it('should handle valid URL without modification', () => {
    const info = {
      ServerName: 'Test', Version: '10.0', Id: 'id-1',
      LocalAddress: 'https://jellyfin.example.com:8920',
    };
    const result = formatSystemInfo(info as never);
    expect(result).toContain('https://jellyfin.example.com:8920');
  });
});

describe('formatUsers', () => {
  it('should format multiple users', () => {
    const users = [
      {
        Id: 'u1', Name: 'Alice', HasPassword: true,
        Policy: { IsAdministrator: true, IsDisabled: false, IsHidden: false },
      },
      {
        Id: 'u2', Name: 'Bob', HasPassword: false,
        LastLoginDate: '2024-01-01T00:00:00Z',
      },
    ];
    const result = formatUsers(users);
    expect(result).toContain('type: users');
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
  });

  it('should format users without policy', () => {
    const users = [{ Id: 'u-bare', Name: 'BareUser' }];
    const result = formatUsers(users);
    expect(result).toContain('BareUser');
  });
});

describe('formatUser', () => {
  it('should format full user with all fields', () => {
    const user = {
      Id: 'user-1',
      Name: 'Alice',
      ServerId: 'srv-1',
      HasPassword: true,
      LastLoginDate: '2024-01-01T00:00:00Z',
      LastActivityDate: '2024-01-02T00:00:00Z',
      Configuration: {
        SubtitleLanguagePreference: 'en',
        SubtitleMode: 'Default',
        EnableNextEpisodeAutoPlay: true,
      },
      Policy: {
        IsAdministrator: true,
        IsDisabled: false,
        IsHidden: false,
        EnableAllFolders: true,
        EnableRemoteAccess: true,
        EnableLiveTvAccess: false,
        EnableMediaPlayback: true,
        EnableVideoPlaybackTranscoding: true,
      },
    };
    const result = formatUser(user);
    expect(result).toContain('type: user');
    expect(result).toContain('Alice');
    expect(result).toContain('en');
  });

  it('should format user without configuration or policy', () => {
    const user = { Id: 'u-min', Name: 'MinUser' };
    const result = formatUser(user);
    expect(result).toContain('MinUser');
  });
});

describe('formatConfig', () => {
  it('should format config with all fields', () => {
    const config = {
      serverUrl: 'http://localhost:8096',
      username: 'steve',
      userId: 'user-id',
      apiKey: 'secret-key',
      password: 'pass',
      outputFormat: 'json' as const,
      timeout: 60000,
    };
    const result = formatConfig(config);
    expect(result).toContain('type: config');
    expect(result).toContain('http://localhost:8096');
    expect(result).toContain('steve');
    // apiKey and password should not be shown as plain text
    expect(result).not.toContain('secret-key');
    expect(result).not.toContain('pass');
    expect(result).toContain('json');
    expect(result).toContain('60000');
  });

  it('should format minimal config (default format/timeout omitted)', () => {
    const config = {
      serverUrl: 'http://localhost:8096',
      outputFormat: 'toon' as const,
      timeout: 30000,
    };
    const result = formatConfig(config);
    expect(result).toContain('type: config');
    // toon is default, should not show
    expect(result).not.toContain('fmt:');
    // 30000 is default, should not show
    expect(result).not.toContain('30000');
  });
});

describe('formatServers', () => {
  it('should format server list with default indicator', () => {
    const servers = [
      { name: 'home', config: { serverUrl: 'http://192.168.1.1:8096', username: 'admin' }, isDefault: true },
      { name: 'remote', config: { serverUrl: 'https://jellyfin.example.com', username: 'user' }, isDefault: false },
    ];
    const result = formatServers(servers as never);
    expect(result).toContain('type: servers');
    expect(result).toContain('home');
    expect(result).toContain('remote');
    expect(result).toContain('http://192.168.1.1:8096');
  });
});
