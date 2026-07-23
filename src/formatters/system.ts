import type { SystemInfo, UserDto, JellyfinConfig } from '../types/index.js';
import { formatToon } from './base.js';

// Fix double-protocol issue (e.g. "http://http://..." from misconfigured servers)
function sanitizeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace(/^(https?:\/\/)+/, (_, p: string) => p);
}

/**
 * Produces the validated format system info result used by CLI automation.
 * @param info - The info value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatSystemInfo(info: SystemInfo): string {
  return formatToon({
    name: info.ServerName,
    version: info.Version,
    id: info.Id,
    local_address: sanitizeUrl(info.LocalAddress),
    operating_system: info.OperatingSystem,
    has_pending_restart: info.HasPendingRestart,
    can_self_restart: info.CanSelfRestart,
  }, 'system_info');
}

/**
 * Produces the validated format users result used by CLI automation.
 * @param users - The users value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatUsers(users: UserDto[]): string {
  return formatToon(users.map(u => ({
    id: u.Id,
    name: u.Name,
    is_admin: u.Policy?.IsAdministrator,
    is_disabled: u.Policy?.IsDisabled,
    is_hidden: u.Policy?.IsHidden,
    has_password: u.HasPassword,
    last_login: u.LastLoginDate,
  })), 'users');
}

/**
 * Produces the validated format user result used by CLI automation.
 * @param user - The user value required by this operation.
 * @returns - The normalized string representation.
 */
export function formatUser(user: UserDto): string {
  return formatToon({
    id: user.Id,
    name: user.Name,
    server_id: user.ServerId,
    is_admin: user.Policy?.IsAdministrator,
    is_disabled: user.Policy?.IsDisabled,
    is_hidden: user.Policy?.IsHidden,
    has_password: user.HasPassword,
    last_login: user.LastLoginDate,
    last_activity: user.LastActivityDate,
    configuration: user.Configuration ? {
      subtitle_language: user.Configuration.SubtitleLanguagePreference,
      subtitle_mode: user.Configuration.SubtitleMode,
      autoplay_next_episode: user.Configuration.EnableNextEpisodeAutoPlay,
    } : undefined,
    policy: user.Policy ? {
      all_folders: user.Policy.EnableAllFolders,
      remote_access: user.Policy.EnableRemoteAccess,
      live_tv_access: user.Policy.EnableLiveTvAccess,
      media_playback: user.Policy.EnableMediaPlayback,
      video_transcoding: user.Policy.EnableVideoPlaybackTranscoding,
    } : undefined,
  }, 'user');
}

/**
 * Produces the validated format config result used by CLI automation.
 * @param config - The resolved Jellyfin client configuration.
 * @returns - The normalized string representation.
 */
export function formatConfig(config: JellyfinConfig): string {
  return formatToon({
    server_url: config.serverUrl ?? null,
    username: config.username ?? null,
    user_id: config.userId ?? null,
    output_format: config.outputFormat ?? 'toon',
    timeout: config.timeout ?? 30000,
  }, 'config');
}

/**
 * Produces the validated format servers result used by CLI automation.
 * @param servers - The servers value required by this operation.
 * @returns - The typed format servers result.
 */
export function formatServers(servers: { name: string; config: JellyfinConfig; isDefault: boolean }[]): string {
  return formatToon(servers.map(s => ({
    name: s.name,
    server_url: s.config.serverUrl,
    username: s.config.username,
    is_default: s.isDefault,
  })), 'servers');
}
