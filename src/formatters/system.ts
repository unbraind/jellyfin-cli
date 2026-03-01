import type { SystemInfo, UserDto, JellyfinConfig } from '../types/index.js';
import { formatToon } from './base.js';

function sanitizeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace(/^https?:\/\/https?:\/\//, 'http://').replace(/^http:\/\/https?:\/\//, 'https://');
}

export function formatSystemInfo(info: SystemInfo): string {
  const obj: Record<string, unknown> = { name: info.ServerName };
  if (info.Version) obj.ver = info.Version;
  if (info.Id) obj.id = info.Id;
  if (info.LocalAddress) obj.url = sanitizeUrl(info.LocalAddress);
  if (info.HasPendingRestart) obj.restart = true;
  if (info.CanSelfRestart) obj.canRestart = true;
  return formatToon(obj, 'sys');
}

export function formatUsers(users: UserDto[]): string {
  const simplified = users.map(u => {
    const obj: Record<string, unknown> = { id: u.Id, name: u.Name };
    if (u.Policy?.IsAdministrator) obj.admin = true;
    if (u.Policy?.IsDisabled) obj.disabled = true;
    if (u.Policy?.IsHidden) obj.hidden = true;
    if (u.HasPassword) obj.pw = true;
    if (u.LastLoginDate) obj.login = u.LastLoginDate;
    return obj;
  });
  return formatToon(simplified, 'users');
}

export function formatUser(user: UserDto): string {
  const obj: Record<string, unknown> = { id: user.Id, name: user.Name };
  if (user.Policy?.IsAdministrator) obj.admin = true;
  if (user.Policy?.IsDisabled) obj.disabled = true;
  if (user.Policy?.IsHidden) obj.hidden = true;
  if (user.HasPassword) obj.pw = true;
  if (user.LastLoginDate) obj.login = user.LastLoginDate;
  if (user.LastActivityDate) obj.active = user.LastActivityDate;
  if (user.Configuration) {
    const cfg: Record<string, unknown> = {};
    if (user.Configuration.SubtitleLanguagePreference) cfg.subLang = user.Configuration.SubtitleLanguagePreference;
    if (user.Configuration.SubtitleMode) cfg.subMode = user.Configuration.SubtitleMode;
    if (user.Configuration.EnableNextEpisodeAutoPlay) cfg.autoplay = true;
    if (Object.keys(cfg).length > 0) obj.cfg = cfg;
  }
  if (user.Policy) {
    const pol: Record<string, unknown> = {};
    if (user.Policy.EnableAllFolders) pol.allFolders = true;
    if (user.Policy.EnableRemoteAccess !== undefined) pol.remote = user.Policy.EnableRemoteAccess;
    if (user.Policy.EnableLiveTvAccess) pol.livetv = true;
    if (user.Policy.EnableMediaPlayback !== undefined) pol.play = user.Policy.EnableMediaPlayback;
    if (user.Policy.EnableVideoPlaybackTranscoding !== undefined) pol.transcode = user.Policy.EnableVideoPlaybackTranscoding;
    if (Object.keys(pol).length > 0) obj.policy = pol;
  }
  return formatToon(obj, 'user');
}

export function formatConfig(config: JellyfinConfig): string {
  const obj: Record<string, unknown> = { url: config.serverUrl };
  if (config.username) obj.user = config.username;
  if (config.userId) obj.uid = config.userId;
  if (config.apiKey) obj.key = true;
  if (config.password) obj.pw = true;
  if (config.outputFormat && config.outputFormat !== 'toon') obj.fmt = config.outputFormat;
  if (config.timeout && config.timeout !== 30000) obj.timeout = config.timeout;
  return formatToon(obj, 'config');
}

export function formatServers(servers: { name: string; config: JellyfinConfig; isDefault: boolean }[]): string {
  const simplified = servers.map(s => {
    const obj: Record<string, unknown> = { name: s.name, url: s.config.serverUrl };
    if (s.isDefault) obj.default = true;
    if (s.config.username) obj.user = s.config.username;
    return obj;
  });
  return formatToon(simplified, 'servers');
}
