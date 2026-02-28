import type { SystemInfo, UserDto, JellyfinConfig } from '../types/index.js';
import { formatToon } from './base.js';

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
