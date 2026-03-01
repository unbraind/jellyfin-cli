import { describe, it, expect } from 'vitest';
import { formatSessions, formatSession, formatTasks, formatTask } from '../../src/formatters/sessions.js';

describe('formatSessions', () => {
  it('should format empty sessions array', () => {
    const result = formatSessions([]);
    expect(result).toContain('type: sessions');
  });

  it('should format sessions with now playing', () => {
    const sessions = [{
      Id: 'session-1',
      UserId: 'user-1',
      UserName: 'TestUser',
      Client: 'Jellyfin Web',
      DeviceName: 'Chrome',
      DeviceId: 'device-1',
      ApplicationVersion: '10.8.0',
      LastActivityDate: '2024-01-01T00:00:00Z',
      SupportsRemoteControl: true,
      NowPlayingItem: { Id: 'item-1', Name: 'Test Movie', Type: 'Movie' },
      PlayState: { IsPaused: false, IsMuted: false, PositionTicks: 1000000 },
    }];
    const result = formatSessions(sessions);
    expect(result).toContain('session-1');
    expect(result).toContain('TestUser');
    expect(result).toContain('Test Movie');
  });

  it('should format sessions without now playing', () => {
    const sessions = [{
      Id: 'session-2',
      UserId: 'user-2',
      UserName: 'AnotherUser',
      Client: 'Jellyfin Android',
      DeviceName: 'Phone',
      DeviceId: 'device-2',
      ApplicationVersion: '10.8.0',
      LastActivityDate: '2024-01-01T00:00:00Z',
      SupportsRemoteControl: true,
      PlayState: { IsPaused: false, IsMuted: false },
    }];
    const result = formatSessions(sessions);
    expect(result).toContain('session-2');
    expect(result).toContain('AnotherUser');
  });
});

describe('formatSession', () => {
  it('should format single session', () => {
    const session = {
      Id: 'session-1',
      UserId: 'user-1',
      UserName: 'TestUser',
      Client: 'Jellyfin Web',
      DeviceName: 'Chrome',
      DeviceId: 'device-1',
      ApplicationVersion: '10.8.0',
      LastActivityDate: '2024-01-01T00:00:00Z',
      SupportsRemoteControl: true,
      PlayState: { IsPaused: true, IsMuted: true, PositionTicks: 5000000, RepeatMode: 'RepeatAll' },
    };
    const result = formatSession(session);
    expect(result).toContain('type: session');
    expect(result).toContain('session-1');
    expect(result).toContain('TestUser');
  });
});

describe('formatTasks', () => {
  it('should format empty tasks array', () => {
    const result = formatTasks([]);
    expect(result).toContain('type: tasks');
  });

  it('should format tasks with last execution', () => {
    const tasks = [{
      Id: 'task-1',
      Name: 'Scan Media Library',
      State: 'Idle',
      Key: 'ScanMediaLibrary',
      Category: 'Library',
      Description: 'Scans media library',
      IsHidden: false,
      LastExecutionResult: {
        StartTimeUtc: '2024-01-01T00:00:00Z',
        EndTimeUtc: '2024-01-01T00:01:00Z',
        Status: 'Completed',
      },
      Triggers: [{ Type: 'IntervalTrigger', IntervalTicks: 864000000000 }],
    }];
    const result = formatTasks(tasks);
    expect(result).toContain('task-1');
    expect(result).toContain('Scan Media Library');
    expect(result).toContain('Idle');
  });

  it('should format tasks without last execution', () => {
    const tasks = [{
      Id: 'task-2',
      Name: 'Clean Cache',
      State: 'Running',
      Key: 'CleanCache',
      Category: 'Maintenance',
      IsHidden: false,
      Triggers: [],
    }];
    const result = formatTasks(tasks);
    expect(result).toContain('task-2');
    expect(result).toContain('Clean Cache');
    expect(result).toContain('Running');
  });
});

describe('formatTask', () => {
  it('should format single task', () => {
    const task = {
      Id: 'task-1',
      Name: 'Scan Media Library',
      State: 'Idle',
      Key: 'ScanMediaLibrary',
      Category: 'Library',
      Description: 'Scans media library',
      IsHidden: false,
      CurrentProgressPercentage: 50,
      Triggers: [{ Type: 'IntervalTrigger', IntervalTicks: 864000000000 }],
    };
    const result = formatTask(task);
    expect(result).toContain('type: task');
    expect(result).toContain('task-1');
    expect(result).toContain('Scan Media Library');
  });
});
