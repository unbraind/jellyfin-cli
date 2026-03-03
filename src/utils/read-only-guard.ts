import type { Command } from 'commander';

const MUTATING_VERBS = new Set([
  'add',
  'apply',
  'authenticate',
  'cancel',
  'clear',
  'create',
  'delete',
  'disable',
  'disconnect',
  'download',
  'enable',
  'favorite',
  'install',
  'join',
  'leave',
  'like',
  'merge',
  'message',
  'move',
  'mute',
  'next',
  'pause',
  'play',
  'played',
  'previous',
  'queue',
  'redeem',
  'refresh',
  'remove',
  'rename',
  'report',
  'restart',
  'seek',
  'send',
  'set',
  'shutdown',
  'start',
  'stop',
  'trigger',
  'unfavorite',
  'uninstall',
  'unlike',
  'unmark',
  'unmute',
  'unpause',
  'unplayed',
  'unrate',
  'update',
  'upload',
  'volume',
]);

const READ_ONLY_ALLOWED = new Set([
  'apikeys list',
  'artists get',
  'artists list',
  'artists album-artists',
  'auth providers',
  'auth password-reset-providers',
  'auth quickconnect-enabled',
  'backup list',
  'backup manifest',
  'branding css',
  'branding get',
  'branding splashscreen-url',
  'channels features',
  'channels get',
  'channels items',
  'channels latest-items',
  'channels list',
  'collections list',
  'config delete',
  'config doctor',
  'config get',
  'config list',
  'config path',
  'config reset',
  'config test',
  'config use',
  'discover recommendations',
  'discover trailers',
  'devices get',
  'devices list',
  'environment drives',
  'environment network-shares',
  'favorites list',
  'fonts list',
  'genres get',
  'genres list',
  'images list',
  'images url',
  'images user',
  'items ancestors',
  'items chapters',
  'items filters',
  'items filters2',
  'items get',
  'items image-url',
  'items intros',
  'items latest',
  'items list',
  'items metadata-editor',
  'items parts',
  'items playback-info',
  'items resume',
  'items root',
  'items search',
  'items similar',
  'items special-features',
  'items stream-url',
  'items subtitle-url',
  'items trailers',
  'library available-options',
  'library list',
  'library genres',
  'library get-genre',
  'library get-person',
  'library get-studio',
  'library persons',
  'library physical-paths',
  'library studios',
  'library virtual-folders',
  'live-streams list',
  'livetv channels',
  'livetv info',
  'livetv programs',
  'livetv recording-folders',
  'livetv recording-groups',
  'livetv recordings',
  'livetv recommended',
  'livetv series-timers',
  'livetv timers',
  'livetv tuner-types',
  'localization countries',
  'localization cultures',
  'localization options',
  'localization ratings',
  'media external-ids',
  'media lyrics',
  'media remote-images',
  'media remote-lyrics',
  'media search-remote-lyrics',
  'media segments',
  'media theme-songs',
  'media theme-videos',
  'music-genres get',
  'music-genres list',
  'notifications list',
  'notifications types',
  'packages info',
  'packages installing',
  'packages list',
  'packages repositories',
  'persons get',
  'persons list',
  'playlists get',
  'playlists instant-mix',
  'playlists list',
  'playlists users',
  'plugins config',
  'plugins get',
  'plugins list',
  'plugins-ext infusesync status',
  'plugins-ext meilisearch status',
  'plugins-ext telegram test',
  'plugins-ext tmdb config',
  'quickconnect connect',
  'quickconnect status',
  'reports activities',
  'schema item',
  'schema list',
  'sessions get',
  'sessions list',
  'setup env',
  'setup status',
  'stats activity',
  'stats counts',
  'stats played',
  'studios get',
  'studios list',
  'subtitles providers',
  'subtitles search',
  'suggestions list',
  'syncplay get',
  'syncplay list',
  'system activity',
  'system bitrate-test',
  'system endpoint',
  'system health',
  'system info',
  'system logs',
  'system metadata-options',
  'system ping',
  'system storage',
  'system time',
  'tasks get',
  'tasks list',
  'tasks triggers',
  'trailers list',
  'trailers similar',
  'trickplay hls-url',
  'trickplay tile-url',
  'tvshows episodes',
  'tvshows next-up',
  'tvshows seasons',
  'tvshows upcoming',
  'usage-stats movies',
  'usage-stats play-activity',
  'usage-stats users',
  'userdata get',
  'userdata played-items',
  'users by-name',
  'users config',
  'users get',
  'users list',
  'users me',
  'users policy',
  'users public',
  'users view-grouping',
  'users views',
  'videos get-additional',
  'videos local-trailers',
  'videos merge-versions',
  'videos remove-alternate-sources',
  'years get',
  'years list',
]);

function normalizedPath(command: Command): string {
  return command
    .name()
    .split(' ')
    .join('-')
    .trim()
    .toLowerCase();
}

export function getCommandPath(command: Command): string {
  const parts: string[] = [];
  let cursor: Command | null = command;
  while (cursor) {
    const name = normalizedPath(cursor);
    if (name && name !== 'jellyfin-cli' && name !== 'jf' && name !== 'jf-cli') {
      parts.push(name);
    }
    const parent: Command | undefined = cursor.parent as Command | undefined;
    cursor = parent ?? null;
  }

  return parts.reverse().join(' ').trim();
}

export function isReadOnlyModeEnabled(option: unknown, envValue: string | undefined): boolean {
  if (typeof option === 'boolean' && option) {
    return true;
  }

  if (!envValue) {
    return false;
  }

  const normalized = envValue.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function firstSegment(path: string): string {
  return path.split(' ')[0] ?? '';
}

export function isCommandBlockedInReadOnly(path: string): boolean {
  if (!path) {
    return false;
  }

  if (READ_ONLY_ALLOWED.has(path)) {
    return false;
  }

  const parts = path.split(' ');
  const topLevel = firstSegment(path);

  if (topLevel === 'setup' && parts.length === 1) {
    return true;
  }

  return parts.some((part) => MUTATING_VERBS.has(part));
}

export function buildReadOnlyError(path: string): string {
  return [
    'type: error',
    'data:',
    '  error: Command blocked by read-only mode',
    `  command: ${path}`,
    '  hint: Disable --read-only or set JELLYFIN_READ_ONLY=0 to allow mutating operations.',
    '  success: false',
  ].join('\n');
}
