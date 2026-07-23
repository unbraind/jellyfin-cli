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
    user_id: s.UserId,
    user_name: s.UserName,
    client: s.Client,
    device_name: s.DeviceName,
    supports_remote_control: s.SupportsRemoteControl,
    active: s.IsActive,
    is_playing: s.NowPlayingItem !== undefined && s.NowPlayingItem !== null,
    now_playing: s.NowPlayingItem ? {
      id: s.NowPlayingItem.Id,
      name: s.NowPlayingItem.Name,
      type: s.NowPlayingItem.Type,
      series: s.NowPlayingItem.SeriesName,
      season: s.NowPlayingItem.ParentIndexNumber,
      episode: s.NowPlayingItem.IndexNumber,
    } : undefined,
    runtime_ticks: s.NowPlayingItem?.RunTimeTicks,
    play_state: s.PlayState ? {
      paused: s.PlayState.IsPaused,
      muted: s.PlayState.IsMuted,
    } : undefined,
    position_ticks: s.PlayState?.PositionTicks,
    volume_level: s.PlayState?.VolumeLevel,
    play_method: s.PlayState?.PlayMethod,
    repeat_mode: s.PlayState?.RepeatMode,
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
    user_id: session.UserId,
    user_name: session.UserName,
    client: session.Client,
    device_name: session.DeviceName,
    application_version: session.ApplicationVersion,
    last_activity: session.LastActivityDate,
    supports_remote_control: session.SupportsRemoteControl,
    is_playing: session.NowPlayingItem !== undefined && session.NowPlayingItem !== null,
    now_playing: session.NowPlayingItem ? {
      id: session.NowPlayingItem.Id,
      name: session.NowPlayingItem.Name,
      type: session.NowPlayingItem.Type,
      series: session.NowPlayingItem.SeriesName,
      season: session.NowPlayingItem.ParentIndexNumber,
      episode: session.NowPlayingItem.IndexNumber,
    } : undefined,
    runtime_ticks: session.NowPlayingItem?.RunTimeTicks,
    play_state: session.PlayState ? {
      paused: session.PlayState.IsPaused,
      muted: session.PlayState.IsMuted,
    } : undefined,
    position_ticks: session.PlayState?.PositionTicks,
    volume_level: session.PlayState?.VolumeLevel,
    play_method: session.PlayState?.PlayMethod,
    repeat_mode: session.PlayState?.RepeatMode,
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
    category: t.Category,
    last_execution: t.LastExecutionResult ? {
      start_time_utc: t.LastExecutionResult.StartTimeUtc,
      end_time_utc: t.LastExecutionResult.EndTimeUtc,
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
    category: task.Category,
    progress: task.Progress,
    last_execution: task.LastExecutionResult ? {
      start_time_utc: task.LastExecutionResult.StartTimeUtc,
      end_time_utc: task.LastExecutionResult.EndTimeUtc,
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
