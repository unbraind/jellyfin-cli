/** Jellyfin 10.11 server messages that can arrive over the authenticated WebSocket. */
export const JELLYFIN_EVENT_TYPES = [
  'ActivityLogEntry',
  'ForceKeepAlive',
  'GeneralCommand',
  'KeepAlive',
  'LibraryChanged',
  'PackageInstallationCancelled',
  'PackageInstallationCompleted',
  'PackageInstallationFailed',
  'PackageInstalling',
  'PackageUninstalled',
  'Play',
  'Playstate',
  'RefreshProgress',
  'RestartRequired',
  'ScheduledTaskEnded',
  'ScheduledTasksInfo',
  'SeriesTimerCancelled',
  'SeriesTimerCreated',
  'ServerRestarting',
  'ServerShuttingDown',
  'Sessions',
  'SyncPlayCommand',
  'SyncPlayGroupUpdate',
  'TimerCancelled',
  'TimerCreated',
  'UserDataChanged',
  'UserDeleted',
  'UserUpdated',
] as const;

/** A message type recognized by the current official Jellyfin WebSocket contract. */
export type JellyfinEventType = (typeof JELLYFIN_EVENT_TYPES)[number];

/** Periodic read subscriptions supported by Jellyfin 10.11. */
export const JELLYFIN_EVENT_SUBSCRIPTIONS = [
  'activity',
  'sessions',
  'tasks',
] as const;

/** A periodic read subscription accepted by `jf events watch`. */
export type JellyfinEventSubscription = (typeof JELLYFIN_EVENT_SUBSCRIPTIONS)[number];

/** An untrusted message decoded from the Jellyfin WebSocket. */
export interface JellyfinSocketMessage {
  MessageType: string;
  Data?: unknown;
}

/** One ordered, timestamped event emitted by the CLI. */
export interface JellyfinEventRecord {
  kind: 'event';
  sequence: number;
  received_at: string;
  message_type: string;
  data: unknown;
}

/** Why a bounded WebSocket watch stopped. */
export type JellyfinEventStopReason =
  | 'count_reached'
  | 'duration_reached'
  | 'socket_closed'
  | 'aborted';

/** Summary returned after a bounded WebSocket watch. */
export interface JellyfinEventWatchResult {
  kind: 'summary';
  stop_reason: JellyfinEventStopReason;
  event_count: number;
  duration_ms: number;
  subscriptions: JellyfinEventSubscription[];
  event_types: string[];
  events: JellyfinEventRecord[];
}

/** Agent-facing metadata for one Jellyfin WebSocket event type. */
export interface JellyfinEventTypeInfo {
  message_type: JellyfinEventType;
  category: 'control' | 'library' | 'playback' | 'plugin' | 'server' | 'session' | 'syncplay' | 'user';
  periodic_subscription: JellyfinEventSubscription | null;
  read_only_safe: true;
}
