import type { SystemInfo, UserDto, JellyfinConfig } from '../types/index.js';
import { formatToon } from './base.js';

export function formatSystemInfo(info: SystemInfo): string {
  return formatToon({
    name: info.ServerName,
    ver: info.Version,
    id: info.Id,
    url: info.LocalAddress,
    os: info.OperatingSystem,
    restart: info.HasPendingRestart,
    canRestart: info.CanSelfRestart,
  }, 'sys');
}

export function formatUsers(users: UserDto[]): string {
  return formatToon(users.map(u => ({
    id: u.Id,
    name: u.Name,
    admin: u.Policy?.IsAdministrator,
    disabled: u.Policy?.IsDisabled,
    hidden: u.Policy?.IsHidden,
    pw: u.HasPassword,
    login: u.LastLoginDate,
  })), 'users');
}

export function formatUser(user: UserDto): string {
  return formatToon({
    id: user.Id,
    name: user.Name,
    server: user.ServerId,
    admin: user.Policy?.IsAdministrator,
    disabled: user.Policy?.IsDisabled,
    hidden: user.Policy?.IsHidden,
    pw: user.HasPassword,
    login: user.LastLoginDate,
    active: user.LastActivityDate,
    cfg: user.Configuration ? {
      subLang: user.Configuration.SubtitleLanguagePreference,
      subMode: user.Configuration.SubtitleMode,
      autoplay: user.Configuration.EnableNextEpisodeAutoPlay,
    } : undefined,
    policy: user.Policy ? {
      allFolders: user.Policy.EnableAllFolders,
      remote: user.Policy.EnableRemoteAccess,
      livetv: user.Policy.EnableLiveTvAccess,
      play: user.Policy.EnableMediaPlayback,
      transcode: user.Policy.EnableVideoPlaybackTranscoding,
    } : undefined,
  }, 'user');
}

export function formatConfig(config: JellyfinConfig): string {
  return formatToon({
    url: config.serverUrl,
    user: config.username,
    uid: config.userId,
    key: config.apiKey ? true : undefined,
    pw: config.password ? true : undefined,
    fmt: config.outputFormat !== 'toon' ? config.outputFormat : undefined,
    timeout: config.timeout !== 30000 ? config.timeout : undefined,
  }, 'config');
}

export function formatServers(servers: { name: string; config: JellyfinConfig; isDefault: boolean }[]): string {
  return formatToon(servers.map(s => ({
    name: s.name,
    url: s.config.serverUrl,
    user: s.config.username,
    default: s.isDefault ? true : undefined,
  })), 'servers');
}
