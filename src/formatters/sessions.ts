import type { SessionInfo, ScheduledTaskInfo } from '../types/index.js';
import { formatToon } from './base.js';

/**
 * Produces the validated format sessions result used by CLI automation.
 * @param sessions - The sessions value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatSessions(sessions: SessionInfo[]): string {
  return formatToon(sessions.map(s => ({
    id: s.Id,
    uid: s.UserId,
    user: s.UserName,
    client: s.Client,
    device: s.DeviceName,
    rc: s.SupportsRemoteControl,
    active: s.IsActive,
    is_playing: s.NowPlayingItem !== undefined && s.NowPlayingItem !== null,
    now: s.NowPlayingItem ? {
      id: s.NowPlayingItem.Id,
      name: s.NowPlayingItem.Name,
      type: s.NowPlayingItem.Type,
      series: s.NowPlayingItem.SeriesName,
      season: s.NowPlayingItem.ParentIndexNumber,
      episode: s.NowPlayingItem.IndexNumber,
    } : undefined,
    rt: s.NowPlayingItem?.RunTimeTicks,
    state: s.PlayState ? {
      paused: s.PlayState.IsPaused,
      muted: s.PlayState.IsMuted,
    } : undefined,
    pos: s.PlayState?.PositionTicks,
    vol: s.PlayState?.VolumeLevel,
    method: s.PlayState?.PlayMethod,
    repeat: s.PlayState?.RepeatMode,
    shuffle: s.PlayState?.PlaybackOrder === 'Shuffle' ? true : undefined,
  })), 'sessions');
}

/**
 * Produces the validated format session result used by CLI automation.
 * @param session - The session value required by this operation.
 * @returns - The normalized string representation.
 */
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
    is_playing: session.NowPlayingItem !== undefined && session.NowPlayingItem !== null,
    now: session.NowPlayingItem ? {
      id: session.NowPlayingItem.Id,
      name: session.NowPlayingItem.Name,
      type: session.NowPlayingItem.Type,
      series: session.NowPlayingItem.SeriesName,
      season: session.NowPlayingItem.ParentIndexNumber,
      episode: session.NowPlayingItem.IndexNumber,
    } : undefined,
    rt: session.NowPlayingItem?.RunTimeTicks,
    state: session.PlayState ? {
      paused: session.PlayState.IsPaused,
      muted: session.PlayState.IsMuted,
    } : undefined,
    pos: session.PlayState?.PositionTicks,
    vol: session.PlayState?.VolumeLevel,
    method: session.PlayState?.PlayMethod,
    repeat: session.PlayState?.RepeatMode,
  }, 'session');
}

/**
 * Produces the validated format tasks result used by CLI automation.
 * @param tasks - The tasks value required by this operation.
 * @returns - The normalized string representation.
 */
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

/**
 * Produces the validated format task result used by CLI automation.
 * @param task - The task value required by this operation.
 * @returns - The normalized string representation.
 */
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

/**
 * Produces the validated format task triggers result used by CLI automation.
 * @param triggers - The triggers value required by this operation.
 * @returns - The typed format task triggers result.
 */
export function formatTaskTriggers(triggers: { Id?: string; Type?: string; IntervalTicks?: number; TimeOfDayTicks?: number; DayOfWeek?: string[] }[]): string {
  return formatToon(triggers.map(t => ({
    id: t.Id,
    type: t.Type,
    interval: t.IntervalTicks,
    time: t.TimeOfDayTicks,
    days: t.DayOfWeek?.length ? t.DayOfWeek : undefined,
  })), 'triggers');
}
