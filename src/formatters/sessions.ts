import type { SessionInfo, ScheduledTaskInfo } from '../types/index.js';
import { formatToon } from './base.js';

export function formatSessions(sessions: SessionInfo[]): string {
  return formatToon(sessions.map(s => ({
    id: s.Id,
    uid: s.UserId,
    user: s.UserName,
    client: s.Client,
    device: s.DeviceName,
    rc: s.SupportsRemoteControl,
    now: s.NowPlayingItem ? {
      id: s.NowPlayingItem.Id,
      name: s.NowPlayingItem.Name,
      type: s.NowPlayingItem.Type,
    } : undefined,
    state: s.PlayState ? {
      paused: s.PlayState.IsPaused,
      muted: s.PlayState.IsMuted,
    } : undefined,
    pos: s.PlayState?.PositionTicks,
    repeat: s.PlayState?.RepeatMode,
    shuffle: s.PlayState?.PlaybackOrder === 'Shuffle' ? true : undefined,
  })), 'sessions');
}

export function formatSession(session: SessionInfo): string {
  return formatToon({
    id: session.Id,
    uid: session.UserId,
    user: session.UserName,
    client: session.Client,
    device: session.DeviceName,
    ver: session.ApplicationVersion,
    active: session.LastActivityDate,
    rc: session.SupportsRemoteControl,
    now: session.NowPlayingItem ? {
      id: session.NowPlayingItem.Id,
      name: session.NowPlayingItem.Name,
      type: session.NowPlayingItem.Type,
    } : undefined,
    rt: session.NowPlayingItem?.RunTimeTicks,
    state: session.PlayState ? {
      paused: session.PlayState.IsPaused,
      muted: session.PlayState.IsMuted,
    } : undefined,
    pos: session.PlayState?.PositionTicks,
    vol: session.PlayState?.VolumeLevel,
    repeat: session.PlayState?.RepeatMode,
  }, 'session');
}

export function formatTasks(tasks: ScheduledTaskInfo[]): string {
  return formatToon(tasks.map(t => ({
    id: t.Id,
    name: t.Name,
    key: t.Key,
    state: t.State,
    cat: t.Category,
    last: t.LastExecutionResult ? {
      start: t.LastExecutionResult.StartTimeUtc,
      end: t.LastExecutionResult.EndTimeUtc,
      status: t.LastExecutionResult.Status,
    } : undefined,
    triggers: t.Triggers?.length ? t.Triggers.map(tr => ({
      type: tr.Type,
      interval: tr.IntervalTicks,
      daily: tr.TimeOfDayTicks !== undefined ? true : undefined,
      days: tr.DayOfWeek?.length ? tr.DayOfWeek : undefined,
    })) : undefined,
  })), 'tasks');
}

export function formatTask(task: ScheduledTaskInfo): string {
  return formatToon({
    id: task.Id,
    name: task.Name,
    key: task.Key,
    state: task.State,
    cat: task.Category,
    pct: task.Progress,
    last: task.LastExecutionResult ? {
      start: task.LastExecutionResult.StartTimeUtc,
      end: task.LastExecutionResult.EndTimeUtc,
      status: task.LastExecutionResult.Status,
    } : undefined,
  }, 'task');
}

export function formatTaskTriggers(triggers: { Id?: string; Type?: string; IntervalTicks?: number; TimeOfDayTicks?: number; DayOfWeek?: string[] }[]): string {
  return formatToon(triggers.map(t => ({
    id: t.Id,
    type: t.Type,
    interval: t.IntervalTicks,
    time: t.TimeOfDayTicks,
    days: t.DayOfWeek?.length ? t.DayOfWeek : undefined,
  })), 'triggers');
}
