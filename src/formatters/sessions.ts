import type { SessionInfo, ScheduledTaskInfo } from '../types/index.js';
import { formatToon } from './base.js';

export function formatSessions(sessions: SessionInfo[]): string {
  const simplified = sessions.map((s) => ({
    id: s.Id,
    user_id: s.UserId,
    user_name: s.UserName,
    client: s.Client,
    device_name: s.DeviceName,
    device_id: s.DeviceId,
    application_version: s.ApplicationVersion,
    last_activity: s.LastActivityDate,
    is_active: s.IsActive,
    supports_remote_control: s.SupportsRemoteControl,
    now_playing: s.NowPlayingItem ? {
      id: s.NowPlayingItem.Id,
      name: s.NowPlayingItem.Name,
      type: s.NowPlayingItem.Type,
    } : null,
    play_state: s.PlayState ? {
      is_paused: s.PlayState.IsPaused,
      is_muted: s.PlayState.IsMuted,
      position_ticks: s.PlayState.PositionTicks,
      repeat_mode: s.PlayState.RepeatMode,
      shuffle: s.PlayState.PlaybackOrder === 'Shuffle',
    } : null,
  }));
  return formatToon(simplified, 'sessions');
}

export function formatSession(session: SessionInfo): string {
  const simplified = {
    id: session.Id,
    user_id: session.UserId,
    user_name: session.UserName,
    client: session.Client,
    device_name: session.DeviceName,
    device_id: session.DeviceId,
    application_version: session.ApplicationVersion,
    last_activity: session.LastActivityDate,
    last_playback_check_in: session.LastPlaybackCheckIn,
    is_active: session.IsActive,
    supports_remote_control: session.SupportsRemoteControl,
    supports_media_control: session.SupportsMediaControl,
    remote_endpoint: session.RemoteEndPoint,
    playable_media_types: session.PlayableMediaTypes,
    capabilities: session.Capabilities ? {
      playable_media_types: session.Capabilities.PlayableMediaTypes,
      supported_commands: session.Capabilities.SupportedCommands,
      supports_media_control: session.Capabilities.SupportsMediaControl,
    } : null,
    now_playing: session.NowPlayingItem ? {
      id: session.NowPlayingItem.Id,
      name: session.NowPlayingItem.Name,
      type: session.NowPlayingItem.Type,
      run_time_ticks: session.NowPlayingItem.RunTimeTicks,
    } : null,
    play_state: session.PlayState ? {
      is_paused: session.PlayState.IsPaused,
      is_muted: session.PlayState.IsMuted,
      position_ticks: session.PlayState.PositionTicks,
      can_seek: session.PlayState.CanSeek,
      volume_level: session.PlayState.VolumeLevel,
      audio_stream_index: session.PlayState.AudioStreamIndex,
      subtitle_stream_index: session.PlayState.SubtitleStreamIndex,
      repeat_mode: session.PlayState.RepeatMode,
      playback_order: session.PlayState.PlaybackOrder,
    } : null,
    now_playing_queue: session.NowPlayingQueue,
  };
  return formatToon(simplified, 'session');
}

export function formatTasks(tasks: ScheduledTaskInfo[]): string {
  const simplified = tasks.map((t) => ({
    id: t.Id,
    name: t.Name,
    key: t.Key,
    state: t.State,
    category: t.Category,
    description: t.Description,
    is_hidden: t.IsHidden,
    last_execution: t.LastExecutionResult ? {
      start_time: t.LastExecutionResult.StartTimeUtc,
      end_time: t.LastExecutionResult.EndTimeUtc,
      status: t.LastExecutionResult.Status,
      error: t.LastExecutionResult.ErrorMessage,
    } : null,
    triggers: t.Triggers?.map((tr) => ({
      type: tr.Type,
      interval_ticks: tr.IntervalTicks,
      time_of_day_ticks: tr.TimeOfDayTicks,
      day_of_week: tr.DayOfWeek,
    })),
  }));
  return formatToon(simplified, 'tasks');
}

export function formatTask(task: ScheduledTaskInfo): string {
  const simplified = {
    id: task.Id,
    name: task.Name,
    key: task.Key,
    state: task.State,
    category: task.Category,
    description: task.Description,
    is_hidden: task.IsHidden,
    last_execution: task.LastExecutionResult ? {
      start_time: task.LastExecutionResult.StartTimeUtc,
      end_time: task.LastExecutionResult.EndTimeUtc,
      status: task.LastExecutionResult.Status,
      error: task.LastExecutionResult.ErrorMessage,
      long_error: task.LastExecutionResult.LongErrorMessage,
    } : null,
    triggers: task.Triggers?.map((tr) => ({
      type: tr.Type,
      interval_ticks: tr.IntervalTicks,
      time_of_day_ticks: tr.TimeOfDayTicks,
      day_of_week: tr.DayOfWeek,
    })),
  };
  return formatToon(simplified, 'task');
}

export function formatTaskTriggers(triggers: { Id?: string; Type?: string; IntervalTicks?: number; TimeOfDayTicks?: number; DayOfWeek?: string[] }[]): string {
  const simplified = triggers.map((t) => ({
    id: t.Id,
    type: t.Type,
    interval_ticks: t.IntervalTicks,
    time_of_day_ticks: t.TimeOfDayTicks,
    day_of_week: t.DayOfWeek,
  }));
  return formatToon(simplified, 'task_triggers');
}
