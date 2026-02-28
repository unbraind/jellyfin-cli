import YAML from 'yaml';
import type { BaseItemDto, SessionInfo, UserDto, SystemInfo, JellyfinConfig, QueryResult, SearchResult, ActivityLogEntry, ScheduledTaskInfo, LibraryVirtualFolder, LiveTvInfo } from '../types/index.js';

export interface ToonOutput {
  type: string;
  data: unknown;
  meta?: {
    timestamp: string;
    format: 'toon';
    version: string;
  };
}

const VERSION = '1.0.0';

function createToonOutput(type: string, data: unknown): ToonOutput {
  return {
    type,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      format: 'toon',
      version: VERSION,
    },
  };
}

export function formatToon(output: unknown, typeHint?: string): string {
  const type = typeHint ?? detectType(output);
  const toonOutput = createToonOutput(type, output);
  return YAML.stringify(toonOutput, { lineWidth: 0 });
}

function detectType(output: unknown): string {
  if (output === null || output === undefined) {
    return 'empty';
  }
  if (typeof output === 'string') {
    return 'message';
  }
  if (typeof output === 'number' || typeof output === 'boolean') {
    return 'value';
  }
  if (Array.isArray(output)) {
    if (output.length === 0) {
      return 'list';
    }
    const first = output[0];
    if (first && typeof first === 'object') {
      if ('Type' in first || 'type' in first) {
        return 'items';
      }
      if ('Name' in first && 'Id' in first) {
        if ('SessionId' in first || 'PlayState' in first) {
          return 'sessions';
        }
        if ('IsAdministrator' in first) {
          return 'users';
        }
        return 'items';
      }
    }
    return 'list';
  }
  if (typeof output === 'object') {
    const obj = output as Record<string, unknown>;
    if ('ServerName' in obj && 'Version' in obj) {
      return 'system_info';
    }
    if ('Items' in obj && 'TotalRecordCount' in obj) {
      return 'query_result';
    }
    if ('SearchHints' in obj) {
      return 'search_result';
    }
    if ('PlayState' in obj) {
      return 'session';
    }
    if ('Name' in obj && 'Id' in obj) {
      if ('CollectionType' in obj) {
        return 'library';
      }
      if ('Policy' in obj) {
        return 'user';
      }
      if ('RunTimeTicks' in obj || 'MediaType' in obj) {
        return 'item';
      }
    }
    if ('Id' in obj && 'Name' in obj) {
      return 'item';
    }
    return 'object';
  }
  return 'unknown';
}

export function formatSystemInfo(info: SystemInfo): string {
  const simplified = {
    name: info.ServerName,
    version: info.Version,
    id: info.Id,
    local_address: info.LocalAddress,
    operating_system: info.OperatingSystem,
    has_pending_restart: info.HasPendingRestart,
    can_self_restart: info.CanSelfRestart,
    web_socket_port: info.WebSocketPortNumber,
  };
  return formatToon(simplified, 'system_info');
}

export function formatUsers(users: UserDto[]): string {
  const simplified = users.map((u) => ({
    id: u.Id,
    name: u.Name,
    is_admin: u.Policy?.IsAdministrator,
    is_disabled: u.Policy?.IsDisabled,
    is_hidden: u.Policy?.IsHidden,
    last_login: u.LastLoginDate,
    has_password: u.HasPassword,
  }));
  return formatToon(simplified, 'users');
}

export function formatUser(user: UserDto): string {
  const simplified = {
    id: user.Id,
    name: user.Name,
    is_admin: user.Policy?.IsAdministrator,
    is_disabled: user.Policy?.IsDisabled,
    is_hidden: user.Policy?.IsHidden,
    last_login: user.LastLoginDate,
    last_activity: user.LastActivityDate,
    has_password: user.HasPassword,
    configuration: {
      subtitle_language: user.Configuration?.SubtitleLanguagePreference,
      subtitle_mode: user.Configuration?.SubtitleMode,
      play_default_audio: user.Configuration?.PlayDefaultAudioTrack,
      hide_played: user.Configuration?.HidePlayedInLatest,
      auto_play_next: user.Configuration?.EnableNextEpisodeAutoPlay,
    },
    policy: {
      enable_all_folders: user.Policy?.EnableAllFolders,
      enable_remote_access: user.Policy?.EnableRemoteAccess,
      enable_live_tv: user.Policy?.EnableLiveTvAccess,
      enable_playback: user.Policy?.EnableMediaPlayback,
      enable_transcoding: user.Policy?.EnableVideoPlaybackTranscoding,
    },
  };
  return formatToon(simplified, 'user');
}

export function formatItems(items: BaseItemDto[]): string {
  const simplified = items.map((item) => ({
    id: item.Id,
    name: item.Name,
    type: item.Type,
    year: item.ProductionYear,
    rating: item.CommunityRating,
    runtime_ticks: item.RunTimeTicks,
    genres: item.Genres,
    overview: item.Overview?.slice(0, 200),
    played: item.UserData?.Played,
    favorite: item.UserData?.IsFavorite,
    play_count: item.UserData?.PlayCount,
    unplayed_count: item.UserData?.UnplayedItemCount,
  }));
  return formatToon(simplified, 'items');
}

export function formatItem(item: BaseItemDto): string {
  const simplified = {
    id: item.Id,
    name: item.Name,
    type: item.Type,
    path: item.Path,
    year: item.ProductionYear,
    official_rating: item.OfficialRating,
    community_rating: item.CommunityRating,
    critic_rating: item.CriticRating,
    runtime_ticks: item.RunTimeTicks,
    status: item.Status,
    premiere_date: item.PremiereDate,
    end_date: item.EndDate,
    genres: item.Genres,
    studios: item.Studios?.map((s) => s.Name),
    people: item.People?.slice(0, 10).map((p) => ({ name: p.Name, role: p.Role, type: p.Type })),
    overview: item.Overview,
    taglines: item.Taglines,
    media_sources: item.MediaSources?.map((s) => ({
      id: s.Id,
      name: s.Name,
      container: s.Container,
      path: s.Path,
      bitrate: s.Bitrate,
      size: s.Size,
    })),
    media_streams: item.MediaStreams?.map((s) => ({
      index: s.Index,
      type: s.Type,
      codec: s.Codec,
      language: s.Language,
      title: s.Title,
      is_default: s.IsDefault,
      is_forced: s.IsForced,
      width: s.Width,
      height: s.Height,
      channels: s.Channels,
    })),
    user_data: item.UserData ? {
      played: item.UserData.Played,
      favorite: item.UserData.IsFavorite,
      play_count: item.UserData.PlayCount,
      last_played: item.UserData.LastPlayedDate,
      position_ticks: item.UserData.PlaybackPositionTicks,
    } : undefined,
    child_count: item.ChildCount,
    recursive_item_count: item.RecursiveItemCount,
  };
  return formatToon(simplified, 'item');
}

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

export function formatQueryResult<T>(result: QueryResult<T>, itemFormatter?: (item: T) => unknown): string {
  const data = {
    total_count: result.TotalRecordCount,
    start_index: result.StartIndex,
    items: itemFormatter && result.Items ? result.Items.map(itemFormatter) : result.Items,
  };
  return formatToon(data, 'query_result');
}

export function formatSearchResult(result: SearchResult): string {
  const simplified = {
    total_count: result.TotalRecordCount,
    hints: result.SearchHints?.map((h) => ({
      id: h.Id,
      name: h.Name,
      type: h.Type,
      year: h.ProductionYear,
      runtime_ticks: h.RunTimeTicks,
      media_type: h.MediaType,
      series: h.Series,
      album: h.Album,
      artists: h.Artists,
      index: h.IndexNumber,
      parent_index: h.ParentIndexNumber,
    })),
  };
  return formatToon(simplified, 'search_result');
}

export function formatLibraries(libraries: LibraryVirtualFolder[]): string {
  const simplified = libraries.map((lib) => ({
    name: lib.Name,
    id: lib.ItemId,
    collection_type: lib.CollectionType,
    locations: lib.Locations,
    refresh_status: lib.RefreshStatus,
  }));
  return formatToon(simplified, 'libraries');
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

export function formatActivityLog(log: ActivityLogEntry[]): string {
  const simplified = log.map((entry) => ({
    id: entry.Id,
    name: entry.Name,
    type: entry.Type,
    overview: entry.Overview,
    short_overview: entry.ShortOverview,
    user_id: entry.UserId,
    date: entry.Date,
    item_id: entry.ItemId,
    item_name: entry.ItemName,
    severity: entry.Severity,
  }));
  return formatToon(simplified, 'activity_log');
}

export function formatLiveTvInfo(info: LiveTvInfo): string {
  const simplified = {
    is_enabled: info.IsEnabled,
    enabled_users: info.EnabledUsers,
    services: info.Services?.map((s) => ({
      name: s.Name,
      status: s.Status,
      status_message: s.StatusMessage,
      version: s.Version,
      has_update: s.HasUpdateAvailable,
      is_visible: s.IsVisible,
      tuners: s.Tuners,
    })),
  };
  return formatToon(simplified, 'live_tv_info');
}

export function formatServers(servers: { name: string; config: JellyfinConfig; isDefault: boolean }[]): string {
  const simplified = servers.map((s) => ({
    name: s.name,
    is_default: s.isDefault,
    url: s.config.serverUrl,
    username: s.config.username,
    user_id: s.config.userId,
    output_format: s.config.outputFormat,
  }));
  return formatToon(simplified, 'servers');
}

export function formatMessage(message: string, success = true): string {
  return formatToon({ message, success }, 'message');
}

export function formatError(error: string, code?: number, details?: unknown): string {
  return formatToon({ error, code, details, success: false }, 'error');
}

export function formatConfig(config: JellyfinConfig): string {
  const safe = {
    server_url: config.serverUrl,
    username: config.username,
    user_id: config.userId,
    timeout: config.timeout,
    output_format: config.outputFormat,
    has_api_key: !!config.apiKey,
    has_password: !!config.password,
  };
  return formatToon(safe, 'config');
}
