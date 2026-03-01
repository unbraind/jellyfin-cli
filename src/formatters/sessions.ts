import type { SessionInfo, ScheduledTaskInfo } from '../types/index.js';
import { formatToon } from './base.js';

export function formatSessions(sessions: SessionInfo[]): string {
  const simplified = sessions.map(s => {
    const obj: Record<string, unknown> = { id: s.Id };
    if (s.UserId) obj.uid = s.UserId;
    if (s.UserName) obj.user = s.UserName;
    if (s.Client) obj.client = s.Client;
    if (s.DeviceName) obj.device = s.DeviceName;
    if (s.SupportsRemoteControl) obj.rc = s.SupportsRemoteControl;
    if (s.NowPlayingItem) {
      obj.playing = {
        id: s.NowPlayingItem.Id,
        name: s.NowPlayingItem.Name,
        type: s.NowPlayingItem.Type,
      };
    }
    if (s.PlayState) {
      obj.state = {
        paused: s.PlayState.IsPaused,
        muted: s.PlayState.IsMuted,
      };
      if (s.PlayState.PositionTicks) obj.pos = s.PlayState.PositionTicks;
      if (s.PlayState.RepeatMode) obj.repeat = s.PlayState.RepeatMode;
      if (s.PlayState.PlaybackOrder === 'Shuffle') obj.shuffle = true;
    }
    return obj;
  });
  return formatToon(simplified, 'sessions');
}

export function formatSession(session: SessionInfo): string {
  const obj: Record<string, unknown> = { id: session.Id };
  if (session.UserId) obj.uid = session.UserId;
    if (session.UserName) obj.user = session.UserName;
    if (session.Client) obj.client = session.Client;
    if (session.DeviceName) obj.device = session.DeviceName;
    if (session.ApplicationVersion) obj.ver = session.ApplicationVersion;
    if (session.LastActivityDate) obj.active = session.LastActivityDate;
    if (session.SupportsRemoteControl) obj.rc = session.SupportsRemoteControl;
    if (session.NowPlayingItem) {
      obj.now = {
        id: session.NowPlayingItem.Id,
        name: session.NowPlayingItem.Name,
        type: session.NowPlayingItem.Type,
      };
      if (session.NowPlayingItem.RunTimeTicks) obj.rt = session.NowPlayingItem.RunTimeTicks;
    }
    if (session.PlayState) {
      obj.state = {
        paused: session.PlayState.IsPaused,
        muted: session.PlayState.IsMuted,
      };
      if (session.PlayState.PositionTicks) obj.pos = session.PlayState.PositionTicks;
      if (session.PlayState.VolumeLevel !== undefined) obj.vol = session.PlayState.VolumeLevel;
      if (session.PlayState.RepeatMode) obj.repeat = session.PlayState.RepeatMode;
    }
    return formatToon(obj, 'session');
}
export function formatTasks(tasks: ScheduledTaskInfo[]): string {
  const simplified = tasks.map(t => {
    const obj: Record<string, unknown> = { id: t.Id, name: t.Name };
    if (t.Key) obj.key = t.Key;
    if (t.State) obj.state = t.State;
    if (t.Category) obj.cat = t.Category;
    if (t.LastExecutionResult) {
      obj.last = {
        start: t.LastExecutionResult.StartTimeUtc,
        end: t.LastExecutionResult.EndTimeUtc,
        status: t.LastExecutionResult.Status,
      };
      if (t.Triggers?.length) {
        obj.triggers = t.Triggers.map(tr => ({
          type: tr.Type,
          interval: tr.IntervalTicks,
          daily: tr.TimeOfDayTicks !== undefined,
          days: tr.DayOfWeek,
        }));
      }
    }
    return obj;
  });
  return formatToon(simplified, 'tasks');
}
export function formatTask(task: ScheduledTaskInfo): string {
  const obj: Record<string, unknown> = { id: task.Id, name: task.Name };
    if (task.Key) obj.key = task.Key;
    if (task.State) obj.state = task.State;
    if (task.Category) obj.cat = task.Category;
    if (task.Progress !== undefined) obj.pct = task.Progress;
    if (task.LastExecutionResult) {
      obj.last = {
        start: task.LastExecutionResult.StartTimeUtc,
        end: task.LastExecutionResult.EndTimeUtc,
        status: task.LastExecutionResult.Status,
      };
    }
    return formatToon(obj, 'task');
}
export function formatTaskTriggers(triggers: { Id?: string; Type?: string; IntervalTicks?: number; TimeOfDayTicks?: number; DayOfWeek?: string[] }[]): string {
  const simplified = triggers.map(t => {
    const obj: Record<string, unknown> = { id: t.Id, type: t.Type };
    if (t.IntervalTicks) obj.interval = t.IntervalTicks;
    if (t.TimeOfDayTicks !== undefined) obj.time = t.TimeOfDayTicks;
    if (t.DayOfWeek?.length) obj.days = t.DayOfWeek;
    return obj;
  });
  return formatToon(simplified, 'triggers');
}
