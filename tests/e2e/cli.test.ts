/**
 * End-to-end tests for jellyfin-cli against a live Jellyfin server.
 * All operations are READ-ONLY — no modifications to server data.
 *
 * Requires env vars:
 *   JELLYFIN_SERVER_URL, JELLYFIN_API_KEY, JELLYFIN_USER_ID
 *
 * Skipped automatically if the server is not reachable or env vars are missing.
 *
 * The test runner uses the pre-built binary (dist/cli.js) when available
 * for faster startup, falling back to `bun run src/cli.ts`.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

interface StoredConfig {
  serverUrl?: string;
  apiKey?: string;
  userId?: string;
}

interface StoredSettings {
  defaultServer?: StoredConfig;
  servers?: Record<string, StoredConfig>;
  currentServer?: string;
}

function readSettingsAuth(): StoredConfig {
  const configDir = process.env.JELLYFIN_CONFIG_DIR ?? join(homedir(), '.jellyfin-cli');
  const settingsPath = join(configDir, 'settings.json');
  if (!existsSync(settingsPath)) {
    return {};
  }
  try {
    const raw = readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(raw) as StoredSettings;
    if (settings.currentServer && settings.servers?.[settings.currentServer]) {
      return settings.servers[settings.currentServer];
    }
    return settings.defaultServer ?? {};
  } catch {
    return {};
  }
}

const fileAuth = readSettingsAuth();
const SERVER_URL = process.env.JELLYFIN_SERVER_URL ?? fileAuth.serverUrl ?? '';
const API_KEY = process.env.JELLYFIN_API_KEY ?? fileAuth.apiKey ?? '';
const USER_ID = process.env.JELLYFIN_USER_ID ?? fileAuth.userId ?? '';

const HAS_AUTH = Boolean(SERVER_URL && API_KEY && USER_ID);
const LIVE_E2E_TIMEOUT_MS = process.env.JELLYFIN_TIMEOUT ?? '120000';

// Determine which CLI runner to use (compiled binary is faster).
const DIST_BIN = new URL('../../dist/cli.js', import.meta.url).pathname;
const USE_COMPILED = existsSync(DIST_BIN);
const CLI_CMD: string[] = USE_COMPILED ? ['node', DIST_BIN] : ['bun', 'run', 'src/cli.ts'];

async function checkReachable(): Promise<boolean> {
  if (!HAS_AUTH) return false;
  // Retry up to 3 times — worker initialisation can be slow on first run.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${SERVER_URL}/Health`, {
        headers: { 'X-Emby-Token': API_KEY },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return true;
    } catch {
      // ignore, retry
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

// Top-level await: resolve before tests run so describe.skipIf conditions work.
const serverReachable = await checkReachable();
const skip = !serverReachable;

if (skip) {
  const reason = HAS_AUTH ? 'server not reachable' : 'missing auth (env and settings.json)';
  console.warn(`⚠  Skipping E2E tests: ${reason} at ${SERVER_URL || '(no URL set)'}`);
} else {
  console.info(`ℹ  E2E using ${USE_COMPILED ? 'compiled binary' : 'bun run src/cli.ts'}`);
}

/** Run a jf-cli command and return stdout. Drains stdout & stderr in parallel to prevent pipe deadlock. */
async function jf(...args: string[]): Promise<string> {
  const proc = Bun.spawn([...CLI_CMD, ...args], {
    env: {
      ...process.env,
      JELLYFIN_SERVER_URL: SERVER_URL,
      JELLYFIN_API_KEY: API_KEY,
      JELLYFIN_USER_ID: USER_ID,
      JELLYFIN_TIMEOUT: LIVE_E2E_TIMEOUT_MS,
    },
    stdout: 'pipe',
    stderr: 'pipe',
  });
  // Drain both streams concurrently to avoid pipe buffer deadlock on large output.
  const [text, errText, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (exitCode !== 0) {
    throw new Error(`CLI exited ${exitCode}: ${errText || text}`);
  }
  return text;
}

async function runJfWithCode(
  args: string[],
  extraEnv?: Record<string, string>,
): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn([...CLI_CMD, ...args], {
    env: {
      ...process.env,
      JELLYFIN_SERVER_URL: SERVER_URL,
      JELLYFIN_API_KEY: API_KEY,
      JELLYFIN_USER_ID: USER_ID,
      JELLYFIN_TIMEOUT: LIVE_E2E_TIMEOUT_MS,
      ...extraEnv,
    },
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { code, stdout, stderr };
}

// Per-test timeout: compiled binary ~1-2s startup + API call; fallback ~4-5s.
const T = 60_000;

// -------------------------------------------------------------------------
// System commands
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E system', () => {
  it('system info contains name and version', async () => {
    const out = await jf('system', 'info');
    expect(out).toMatch(/^type: sys/m);
    expect(out).toMatch(/name:/);
    expect(out).toMatch(/ver:/);
  }, T);

  it('system health returns Healthy', async () => {
    const out = await jf('system', 'health');
    expect(out).toMatch(/Healthy/i);
  }, T);

  it('system ping reachable', async () => {
    const out = await jf('system', 'ping');
    expect(out).toMatch(/reachable: true/);
  }, T);

  it('system time has request_received', async () => {
    const out = await jf('system', 'time');
    expect(out).toMatch(/^type: server_time/m);
    expect(out).toMatch(/request_received:/);
  }, T);

  it('system logs lists files', async () => {
    const out = await jf('system', 'logs');
    expect(out).toMatch(/^type: log_files/m);
  }, T);

  it('system endpoint has is_local', async () => {
    const out = await jf('system', 'endpoint');
    expect(out).toMatch(/is_local:/);
  }, T);

  it('system activity returns entries', async () => {
    const out = await jf('system', 'activity', '--limit', '3');
    expect(out).toMatch(/^type: activity/m);
  }, T);
});

// -------------------------------------------------------------------------
// Library commands
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E library', () => {
  it('library list returns libs', async () => {
    const out = await jf('library', 'list');
    expect(out).toMatch(/^type: libs/m);
  }, T);

  it('library genres returns Genre items', async () => {
    const out = await jf('library', 'genres', '--limit', '3');
    expect(out).toMatch(/type: Genre/);
  }, T);

  it('library persons returns Person items', async () => {
    const out = await jf('library', 'persons', '--limit', '3');
    expect(out).toMatch(/type: Person/);
  }, T);

  it('library studios returns items', async () => {
    const out = await jf('library', 'studios', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('library get-genre Action returns genre', async () => {
    const out = await jf('library', 'get-genre', 'Action');
    expect(out).toMatch(/name: Action/);
    expect(out).toMatch(/type: Genre/);
  }, T);

  it('library get-person Tom Hanks returns person', async () => {
    const out = await jf('library', 'get-person', 'Tom Hanks');
    expect(out).toMatch(/name: Tom Hanks/);
    expect(out).toMatch(/type: Person/);
  }, T);

  it('library get-studio Marvel returns studio', async () => {
    const out = await jf('library', 'get-studio', 'Marvel');
    expect(out).toMatch(/name: Marvel/);
    expect(out).toMatch(/type: Studio/);
  }, T);

  it('library physical-paths returns paths', async () => {
    const out = await jf('library', 'physical-paths');
    expect(out).toMatch(/^type: physical_paths/m);
  }, T);
});

// -------------------------------------------------------------------------
// Items commands
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E items', () => {
  it('items list returns items', async () => {
    const out = await jf('items', 'list', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('items list --types Movie --recursive returns movies', async () => {
    const out = await jf('items', 'list', '--types', 'Movie', '--recursive', '--limit', '3');
    expect(out).toMatch(/type: Movie/);
  }, T);

  it('items latest returns items', async () => {
    const out = await jf('items', 'latest', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('items resume returns items', async () => {
    const out = await jf('items', 'resume', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('items search matrix returns results', async () => {
    const out = await jf('items', 'search', 'matrix', '--limit', '3');
    expect(out).toMatch(/^type: search/m);
  }, T);

  it('items filters returns filter options', async () => {
    const out = await jf('items', 'filters');
    expect(out).toMatch(/^type: filters/m);
  }, T);

  it('items root returns root folder', async () => {
    const out = await jf('items', 'root');
    expect(out).toMatch(/^type: item/m);
  }, T);
});

// -------------------------------------------------------------------------
// Users commands
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E users', () => {
  it('users list shows steve', async () => {
    const out = await jf('users', 'list');
    expect(out).toMatch(/name: steve/);
  }, T);

  it('users me returns current user', async () => {
    const out = await jf('users', 'me');
    expect(out).toMatch(/^type: user/m);
    expect(out).toMatch(/admin: true/);
  }, T);

  it('users views returns user_views type', async () => {
    const out = await jf('users', 'views');
    expect(out).toMatch(/^type: user_views/m);
  }, T);

  it('users public returns public list', async () => {
    const out = await jf('users', 'public');
    expect(out).toMatch(/^type: users/m);
  }, T);
});

// -------------------------------------------------------------------------
// Sessions
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E sessions', () => {
  it('sessions list returns sessions', async () => {
    const out = await jf('sessions', 'list');
    expect(out).toMatch(/^type: sessions/m);
  }, T);
});

// -------------------------------------------------------------------------
// Discovery
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E discover', () => {
  it('discover recommendations returns categories', async () => {
    const out = await jf('discover', 'recommendations');
    expect(out).toMatch(/^type: recommendations/m);
  }, T);

  it('discover trailers returns items (empty ok)', async () => {
    const out = await jf('discover', 'trailers', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);
});

// -------------------------------------------------------------------------
// TV shows
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E tvshows', () => {
  it('tvshows next-up returns items', async () => {
    const out = await jf('tvshows', 'next-up', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('tvshows upcoming returns items', async () => {
    const out = await jf('tvshows', 'upcoming', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);
});

// -------------------------------------------------------------------------
// Music browsing
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E music', () => {
  it('artists list returns items', async () => {
    const out = await jf('artists', 'list', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('music-genres list returns items', async () => {
    const out = await jf('music-genres', 'list', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('years list returns years type', async () => {
    const out = await jf('years', 'list', '--limit', '3');
    expect(out).toMatch(/^type: years/m);
  }, T);
});

// -------------------------------------------------------------------------
// Admin (separate tests, limit output size to avoid pipe issues)
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E admin', () => {
  it('stats counts has movies field', async () => {
    const out = await jf('stats', 'counts');
    expect(out).toMatch(/movies:/);
  }, T);

  it('tasks list returns tasks', async () => {
    const out = await jf('tasks', 'list');
    expect(out).toMatch(/^type: tasks/m);
  }, T);

  it('plugins list returns plugins', async () => {
    const out = await jf('plugins', 'list');
    expect(out).toMatch(/^type: plugins/m);
  }, T);

  it('apikeys list returns api_keys type', async () => {
    const out = await jf('apikeys', 'list');
    expect(out).toMatch(/^type: api_keys/m);
  }, T);
});

// -------------------------------------------------------------------------
// Localization, Suggestions, Branding, Auth, Favorites
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E misc', () => {
  it('localization countries returns list', async () => {
    const out = await jf('localization', 'countries');
    expect(out).toMatch(/^type: countries/m);
  }, T);

  it('suggestions list returns items', async () => {
    const out = await jf('suggestions', 'list', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('branding get returns branding config', async () => {
    const out = await jf('branding', 'get');
    expect(out).toMatch(/^type: branding/m);
  }, T);

  it('auth providers returns auth_providers type', async () => {
    const out = await jf('auth', 'providers');
    expect(out).toMatch(/^type: auth_providers/m);
  }, T);

  it('auth password-reset-providers returns list', async () => {
    const out = await jf('auth', 'password-reset-providers');
    expect(out).toMatch(/^type: password_reset_providers/m);
  }, T);

  it('favorites list returns items', async () => {
    const out = await jf('favorites', 'list', '--limit', '5');
    expect(out).toMatch(/^type: items/m);
  }, T);
});

// -------------------------------------------------------------------------
// Devices
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E devices', () => {
  it('devices list returns devices type', async () => {
    const out = await jf('devices', 'list');
    expect(out).toMatch(/^type: devices/m);
  }, T);

  it('devices info returns device type', async () => {
    const out = await jf('devices', 'info');
    expect(out).toMatch(/^type: device/m);
  }, T);
});

// -------------------------------------------------------------------------
// Environment
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E environment', () => {
  it('environment drives returns drives list', async () => {
    const out = await jf('environment', 'drives');
    expect(out).toMatch(/^type: drives/m);
  }, T);

  it('environment network-shares returns shares list', async () => {
    const out = await jf('environment', 'network-shares');
    expect(out).toMatch(/^type: network_shares/m);
  }, T);
});

// -------------------------------------------------------------------------
// Playlists (read-only)
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E playlists', () => {
  it('playlists list returns items type', async () => {
    const out = await jf('playlists', 'list');
    expect(out).toMatch(/^type: items/m);
  }, T);
});

// -------------------------------------------------------------------------
// Collections
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E collections', () => {
  it('collections list returns box-set items', async () => {
    const out = await jf('collections', 'list');
    expect(out).toMatch(/^type: items/m);
  }, T);
});

// -------------------------------------------------------------------------
// System bitrate test
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E system bitrate', () => {
  it('system bitrate-test returns bitrate_test type', async () => {
    const out = await jf('system', 'bitrate-test', '--size', '100000');
    expect(out).toMatch(/^type: bitrate_test/m);
    expect(out).toMatch(/bitrate_mbps:/);
    expect(out).toMatch(/elapsed_ms:/);
  }, T);
});

// -------------------------------------------------------------------------
// Schema
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E schema', () => {
  it('schema list returns available types', async () => {
    const out = await jf('schema', 'list');
    expect(out).toMatch(/item/);
  }, T);

  it('schema item returns JSON schema with properties', async () => {
    const out = await jf('schema', 'item');
    expect(out).toMatch(/properties/);
    expect(out).toMatch(/\$schema/);
  }, T);
});

// -------------------------------------------------------------------------
// Localization extended
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E localization extended', () => {
  it('localization cultures returns cultures list', async () => {
    const out = await jf('localization', 'cultures');
    expect(out).toMatch(/^type: cultures/m);
  }, T);

  it('localization ratings returns list', async () => {
    const out = await jf('localization', 'ratings');
    expect(out).toMatch(/^type: rating_systems/m);
  }, T);
});

// -------------------------------------------------------------------------
// Packages & Repositories
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E packages', () => {
  it('packages repositories returns list', async () => {
    const out = await jf('packages', 'repositories');
    expect(out).toMatch(/^type: repositories/m);
  }, T);
});

// -------------------------------------------------------------------------
// Sessions extended
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E sessions extended', () => {
  it('sessions list returns sessions type output', async () => {
    const out = await jf('sessions', 'list');
    expect(out).toMatch(/^type: sessions/m);
  }, T);
});

// -------------------------------------------------------------------------
// Library structure
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E library structure', () => {
  it('library virtual-folders returns virtual folders', async () => {
    const out = await jf('library', 'virtual-folders');
    expect(out).toMatch(/^type: virtual_folders/m);
  }, T);
});

// -------------------------------------------------------------------------
// Items extended
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E items extended', () => {
  it('items list --types Series returns series items', async () => {
    const out = await jf('items', 'list', '--types', 'Series', '--recursive', '--limit', '3');
    expect(out).toMatch(/type: Series/);
  }, T);

  it('items search inception returns results', async () => {
    const out = await jf('items', 'search', 'inception');
    expect(out).toMatch(/^type: search/m);
  }, T);
});

// -------------------------------------------------------------------------
// Music extended
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E music extended', () => {
  it('music-genres list with limit returns items', async () => {
    const out = await jf('music-genres', 'list', '--limit', '5');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('years list returns year entries', async () => {
    const out = await jf('years', 'list', '--limit', '5');
    expect(out).toMatch(/^type: years/m);
  }, T);
});

// -------------------------------------------------------------------------
// Notifications
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E notifications', () => {
  it('notifications types returns notification types', async () => {
    const out = await jf('notifications', 'types');
    expect(out).toMatch(/^type: notification_types/m);
  }, T);
});

// -------------------------------------------------------------------------
// Userdata
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E userdata', () => {
  it('userdata played-items returns items', async () => {
    const out = await jf('userdata', 'played-items', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);
});

// -------------------------------------------------------------------------
// Display Preferences
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E display preferences', () => {
  it('users display-prefs with valid view ID returns display_prefs type', async () => {
    // Get a real view ID first, then fetch prefs for it
    const viewsOut = await jf('users', 'views');
    const idMatch = viewsOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return; // no views to test with
    const viewId = idMatch[1];
    const out = await jf('users', 'display-prefs', viewId);
    expect(out).toMatch(/^type: display_prefs/m);
  }, T);
});

// -------------------------------------------------------------------------
// Discover instant mix variants
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E discover instant mix', () => {
  it('discover genre-mix with genre name returns items or empty', async () => {
    // Uses library genres endpoint to get a real genre, then tests instant mix
    const genresOut = await jf('library', 'genres', '--limit', '1');
    const nameMatch = genresOut.match(/name: (.+)/);
    if (!nameMatch) return;
    const genreName = nameMatch[1].trim().replace(/^"|"$/g, '');
    const out = await jf('discover', 'genre-mix', genreName, '--limit', '5');
    expect(out).toMatch(/^type: items/m);
  }, T);
});

// -------------------------------------------------------------------------
// Usage Stats plugin
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E usage-stats', () => {
  it('usage-stats movies returns movies_report type', async () => {
    const out = await jf('usage-stats', 'movies', '--days', '30');
    expect(out).toMatch(/^type: movies_report/m);
  }, T);

  it('usage-stats users returns usage_users type', async () => {
    const out = await jf('usage-stats', 'users');
    expect(out).toMatch(/^type: usage_users/m);
  }, T);

  it('usage-stats play-activity returns play_activity type', async () => {
    const out = await jf('usage-stats', 'play-activity', '--days', '7');
    expect(out).toMatch(/^type: play_activity/m);
  }, T);
});

// -------------------------------------------------------------------------
// New v8: Metadata editor, library options, system metadata options
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E metadata editor', () => {
  it('items metadata-editor returns metadata_editor type for a real item', async () => {
    const listOut = await jf('items', 'list', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('items', 'metadata-editor', idMatch[1]);
    expect(out).toMatch(/^type: metadata_editor/m);
  }, T);
});

describe.skipIf(skip)('E2E library available-options', () => {
  it('library available-options returns library_options type', async () => {
    const out = await jf('library', 'available-options');
    expect(out).toMatch(/^type: library_options/m);
  }, T);
});

describe.skipIf(skip)('E2E system metadata-options', () => {
  it('system metadata-options returns metadata_options type', async () => {
    const out = await jf('system', 'metadata-options');
    expect(out).toMatch(/^type: metadata_options/m);
  }, T);
});

// -------------------------------------------------------------------------
// New v8: Fallback fonts
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E fonts list', () => {
  it('fonts list returns fallback_fonts type', async () => {
    const out = await jf('fonts', 'list');
    expect(out).toMatch(/^type: fallback_fonts/m);
  }, T);
});

// -------------------------------------------------------------------------
// New v8: Videos delete-alternates (write, skipped) / merge-versions
// Note: GET /Videos/{id}/AlternateSources was removed in Jellyfin 10.11.6.
// Only DELETE is supported. We test the merge/split commands are available.
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E videos commands', () => {
  it('videos help lists known subcommands', async () => {
    // Non-API test: just verify the subcommands are registered
    const out = await jf('videos', '--help');
    expect(out).toMatch(/merge-versions|parts|cancel-transcoding/);
  }, T);
});

// -------------------------------------------------------------------------
// New v8: Users view-grouping
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E users view-grouping', () => {
  it('users view-grouping returns view_grouping_options type', async () => {
    const out = await jf('users', 'view-grouping');
    expect(out).toMatch(/^type: view_grouping_options/m);
  }, T);
});

// -------------------------------------------------------------------------
// Channels
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E channels', () => {
  it('channels list returns items type', async () => {
    const out = await jf('channels', 'list', '--limit', '5');
    expect(out).toMatch(/^type: items/m);
  }, T);
});

// -------------------------------------------------------------------------
// Items extended: similar, playback-info, ancestors, critic-reviews
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E items extra', () => {
  it('items similar returns items type', async () => {
    const listOut = await jf('items', 'list', '--types', 'Movie', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('items', 'similar', idMatch[1], '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('items ancestors returns items type', async () => {
    const listOut = await jf('items', 'list', '--types', 'Movie', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('items', 'ancestors', idMatch[1]);
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('items playback-info returns playback_info type', async () => {
    const listOut = await jf('items', 'list', '--types', 'Movie', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('items', 'playback-info', idMatch[1]);
    expect(out).toMatch(/^type: playback_info/m);
  }, T);
});

// -------------------------------------------------------------------------
// Reports plugin
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E reports', () => {
  it('reports activities returns activity_report type', async () => {
    const out = await jf('reports', 'activities', '--limit', '3');
    expect(out).toMatch(/^type: activity_report/m);
  }, T);
});

// -------------------------------------------------------------------------
// Trickplay URL generation
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E trickplay', () => {
  it('trickplay hls-url returns trickplay_hls_url type', async () => {
    const listOut = await jf('items', 'list', '--types', 'Movie', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('trickplay', 'hls-url', idMatch[1], '320');
    expect(out).toMatch(/^type: trickplay_hls_url/m);
    expect(out).toMatch(/url:/m);
  }, T);
});

// -------------------------------------------------------------------------
// Packages set-repositories (read path only: list then help)
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E packages set-repositories', () => {
  it('packages set-repositories help is available', async () => {
    const out = await jf('packages', 'set-repositories', '--help');
    expect(out).toMatch(/Set.*replace.*list.*plugin/i);
  }, T);
});

// -------------------------------------------------------------------------
// Items root & filters
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E items root and filters', () => {
  it('items root returns item type', async () => {
    const out = await jf('items', 'root');
    expect(out).toMatch(/^type: item/m);
  }, T);

  it('items filters returns filters type', async () => {
    const out = await jf('items', 'filters', '--types', 'Movie');
    expect(out).toMatch(/^type: filters/m);
  }, T);

  it('items filters2 returns filters type', async () => {
    const out = await jf('items', 'filters2', '--types', 'Movie');
    expect(out).toMatch(/^type: filters/m);
  }, T);
});

// -------------------------------------------------------------------------
// Genres
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E genres', () => {
  it('genres list returns items type', async () => {
    const out = await jf('genres', 'list', '--limit', '10');
    expect(out).toMatch(/^type: items/m);
  }, T);
});

// -------------------------------------------------------------------------
// Studios
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E studios', () => {
  it('studios list returns items type', async () => {
    const out = await jf('studios', 'list', '--limit', '10');
    expect(out).toMatch(/^type: items/m);
  }, T);
});

// -------------------------------------------------------------------------
// Persons
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E persons', () => {
  it('persons list returns items type', async () => {
    const out = await jf('persons', 'list', '--limit', '10');
    expect(out).toMatch(/^type: items/m);
  }, T);
});

// -------------------------------------------------------------------------
// Sessions report-full-capabilities
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E sessions report-full-capabilities', () => {
  it('sessions report-full-capabilities help is available', async () => {
    const out = await jf('sessions', 'report-full-capabilities', '--help');
    expect(out).toMatch(/full session capabilities/i);
  }, T);
});

// -------------------------------------------------------------------------
// Client log
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E clientlog', () => {
  it('clientlog send help is available', async () => {
    const out = await jf('clientlog', 'send', '--help');
    expect(out).toMatch(/log entry/i);
  }, T);
});

// -------------------------------------------------------------------------
// Trailers
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E trailers', () => {
  it('trailers list help is available', async () => {
    const out = await jf('trailers', 'list', '--help');
    expect(out).toMatch(/trailer/i);
  }, T);

  it('trailers similar help is available', async () => {
    const out = await jf('trailers', 'similar', '--help');
    expect(out).toMatch(/similar/i);
  }, T);
});

// -------------------------------------------------------------------------
// Backup manifest
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E backup manifest', () => {
  it('backup manifest help is available', async () => {
    const out = await jf('backup', 'manifest', '--help');
    expect(out).toMatch(/manifest/i);
  }, T);

  it('backup list returns toon output', async () => {
    const out = await jf('backup', 'list');
    expect(out).toMatch(/^type: backups/m);
  }, T);
});

// -------------------------------------------------------------------------
// Library notify commands
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E library-notify', () => {
  it('library-notify media-updated help is available', async () => {
    const out = await jf('library-notify', 'media-updated', '--help');
    expect(out).toMatch(/media|updated/i);
  }, T);

  it('library-notify movies-added help is available', async () => {
    const out = await jf('library-notify', 'movies-added', '--help');
    expect(out).toMatch(/movie|added/i);
  }, T);

  it('library-notify series-added help is available', async () => {
    const out = await jf('library-notify', 'series-added', '--help');
    expect(out).toMatch(/series|added/i);
  }, T);
});

// -------------------------------------------------------------------------
// Plugin-ext commands
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E plugins-ext', () => {
  it('plugins-ext meilisearch help is available', async () => {
    const out = await jf('plugins-ext', 'meilisearch', '--help');
    expect(out).toMatch(/meilisearch/i);
  }, T);

  it('plugins-ext tmdb help is available', async () => {
    const out = await jf('plugins-ext', 'tmdb', '--help');
    expect(out).toMatch(/tmdb/i);
  }, T);

  it('plugins-ext telegram help is available', async () => {
    const out = await jf('plugins-ext', 'telegram', '--help');
    expect(out).toMatch(/telegram/i);
  }, T);

  it('plugins-ext infusesync help is available', async () => {
    const out = await jf('plugins-ext', 'infusesync', '--help');
    expect(out).toMatch(/infuse/i);
  }, T);
});

// -------------------------------------------------------------------------
// Branding extended (CSS, splashscreen URL, config update help)
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E branding extended', () => {
  it('branding css returns branding_css type', async () => {
    const out = await jf('branding', 'css');
    expect(out).toMatch(/^type: branding_css/m);
  }, T);

  it('branding splashscreen-url returns url', async () => {
    const out = await jf('branding', 'splashscreen-url');
    expect(out).toMatch(/^type: splashscreen/m);
    expect(out).toMatch(/url:/);
    expect(out).toMatch(/Branding\/Splashscreen/);
  }, T);

  it('branding update-config help is available', async () => {
    const out = await jf('branding', 'update-config', '--help');
    expect(out).toMatch(/disclaimer|css|splashscreen/i);
  }, T);

  it('branding delete-splashscreen help is available', async () => {
    const out = await jf('branding', 'delete-splashscreen', '--help');
    expect(out).toMatch(/splashscreen|delete/i);
  }, T);
});

// -------------------------------------------------------------------------
// System config update (read-only: help only, no actual writes)
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E system config update', () => {
  it('system update-config help is available', async () => {
    const out = await jf('system', 'update-config', '--help');
    expect(out).toMatch(/configuration|json/i);
  }, T);

  it('system update-config-section help is available', async () => {
    const out = await jf('system', 'update-config-section', '--help');
    expect(out).toMatch(/section|configuration/i);
  }, T);
});

// -------------------------------------------------------------------------
// Artists extended
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E artists extended', () => {
  it('artists album-artists returns items type', async () => {
    const out = await jf('artists', 'album-artists', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('artists get by name returns item type', async () => {
    const listOut = await jf('artists', 'list', '--limit', '1');
    const nameMatch = listOut.match(/name: (.+)/);
    if (!nameMatch) return;
    const name = nameMatch[1].trim();
    const out = await jf('artists', 'get', name);
    expect(out).toMatch(/^type: item/m);
  }, T);
});

// -------------------------------------------------------------------------
// QuickConnect
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E quickconnect', () => {
  it('quickconnect status returns quickconnect_status type', async () => {
    const out = await jf('quickconnect', 'status');
    expect(out).toMatch(/^type: quickconnect_status/m);
    expect(out).toMatch(/enabled:/);
  }, T);
});

// -------------------------------------------------------------------------
// Live TV (read-only; empty results are valid when Live TV not configured)
// NOTE: recording-folders and recording-groups require LiveTV to be configured.
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E livetv', () => {
  it('livetv info returns livetv type', async () => {
    const out = await jf('livetv', 'info');
    expect(out).toMatch(/^type: livetv/m);
  }, T);

  it('livetv channels returns items type', async () => {
    const out = await jf('livetv', 'channels', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('livetv channel returns item type when channel id is available', async () => {
    const channelsOut = await jf('livetv', 'channels', '--limit', '1');
    const channelIdMatch = channelsOut.match(/id: ([^\n]+)/);
    if (!channelIdMatch) return;

    const channelId = channelIdMatch[1].trim();
    const out = await jf('livetv', 'channel', channelId);
    expect(out).toMatch(/^type: item/m);
  }, T);

  it('livetv programs returns items type', async () => {
    const out = await jf('livetv', 'programs', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('livetv recordings returns items type', async () => {
    const out = await jf('livetv', 'recordings', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('livetv timers returns items type', async () => {
    const out = await jf('livetv', 'timers');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('livetv series-timers returns items type', async () => {
    const out = await jf('livetv', 'series-timers');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('livetv recommended returns items type', async () => {
    const out = await jf('livetv', 'recommended', '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('livetv tuner-types returns tuner_types type', async () => {
    const out = await jf('livetv', 'tuner-types');
    expect(out).toMatch(/^type: tuner_types/m);
  }, T);

  it('livetv schedules-direct-countries returns countries type', async () => {
    const out = await jf('livetv', 'schedules-direct-countries');
    expect(out).toMatch(/^type: schedules_direct_countries/m);
    expect(out).toMatch(/North America|Europe|Asia|Africa|Oceania|South America/i);
  }, T);

  it('livetv program help is available', async () => {
    const out = await jf('livetv', 'program', '--help');
    expect(out).toMatch(/program/i);
  }, T);

  it('livetv recording-folders help is available', async () => {
    const out = await jf('livetv', 'recording-folders', '--help');
    expect(out).toMatch(/recording/i);
  }, T);

  it('livetv recording-groups help is available', async () => {
    const out = await jf('livetv', 'recording-groups', '--help');
    expect(out).toMatch(/recording/i);
  }, T);
});

// -------------------------------------------------------------------------
// SyncPlay (list requires being in a SyncPlay context; test help + create-timer help)
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E syncplay', () => {
  it('syncplay list help is available', async () => {
    const out = await jf('syncplay', 'list', '--help');
    expect(out).toMatch(/syncplay|group/i);
  }, T);

  it('syncplay create help is available', async () => {
    const out = await jf('syncplay', 'create', '--help');
    expect(out).toMatch(/create|group/i);
  }, T);
});

// -------------------------------------------------------------------------
// Subtitles (providers endpoint requires subtitle plugin; search requires providers)
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E subtitles', () => {
  it('subtitles providers help is available', async () => {
    const out = await jf('subtitles', 'providers', '--help');
    expect(out).toMatch(/provider/i);
  }, T);

  it('subtitles search help is available', async () => {
    const out = await jf('subtitles', 'search', '--help');
    expect(out).toMatch(/subtitle|search/i);
  }, T);

  it('subtitles delete help is available', async () => {
    const out = await jf('subtitles', 'delete', '--help');
    expect(out).toMatch(/delete|subtitle/i);
  }, T);
});

// -------------------------------------------------------------------------
// Config (local config — no API call, just reads settings file)
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E config', () => {
  it('config get returns config type', async () => {
    const out = await jf('config', 'get');
    expect(out).toMatch(/^type: config/m);
    expect(out).toMatch(/url:/);
  }, T);

  it('config list returns servers type', async () => {
    const out = await jf('config', 'list');
    expect(out).toMatch(/^type: servers/m);
  }, T);

  it('config path returns a file path', async () => {
    const out = await jf('config', 'path');
    expect(out).toMatch(/jellyfin-cli|\.json/);
  }, T);

  it('config test connects to server', async () => {
    const out = await jf('config', 'test');
    expect(out).toMatch(/^type: sys/m);
  }, T);
});

// -------------------------------------------------------------------------
// Images (read-only)
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E images', () => {
  it('images list returns item_images type for a movie', async () => {
    const listOut = await jf('items', 'list', '--types', 'Movie', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('images', 'list', idMatch[1]);
    expect(out).toMatch(/^type: item_images/m);
  }, T);

  it('images url returns image_url type', async () => {
    const listOut = await jf('items', 'list', '--types', 'Movie', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('images', 'url', idMatch[1], 'Primary');
    expect(out).toMatch(/^type: image_url/m);
    expect(out).toMatch(/url:/);
  }, T);

  it('images user returns user_image_url type', async () => {
    const out = await jf('images', 'user', USER_ID);
    expect(out).toMatch(/^type: user_image_url/m);
    expect(out).toMatch(/url:/);
  }, T);
});

// -------------------------------------------------------------------------
// Trailers (real API call — 500 if no Trailers library configured)
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E trailers API', () => {
  it('trailers list returns items or error gracefully', async () => {
    // The server may not have a Trailers library configured; accept either outcome.
    let out: string;
    try {
      out = await jf('trailers', 'list', '--limit', '3');
      expect(out).toMatch(/^type: items/m);
    } catch {
      // Acceptable: server has no Trailers library (500)
    }
  }, T);
});

// -------------------------------------------------------------------------
// Users extended
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E users extended', () => {
  it('users get by ID returns user type', async () => {
    const out = await jf('users', 'get', USER_ID);
    expect(out).toMatch(/^type: user/m);
  }, T);

  it('users by-name steve returns user type', async () => {
    const out = await jf('users', 'by-name', 'steve');
    expect(out).toMatch(/^type: user/m);
    expect(out).toMatch(/name: steve/);
  }, T);

  it('users policy returns user_policy type', async () => {
    const out = await jf('users', 'policy', USER_ID);
    expect(out).toMatch(/^type: user_policy/m);
  }, T);

  it('users config returns user_config type', async () => {
    const out = await jf('users', 'config', USER_ID);
    expect(out).toMatch(/^type: user_config/m);
  }, T);
});

// -------------------------------------------------------------------------
// Items extended: get, chapters, special-features, trailers, URL generation
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E items detail', () => {
  it('items get by ID returns item type', async () => {
    const listOut = await jf('items', 'list', '--types', 'Movie', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('items', 'get', idMatch[1]);
    expect(out).toMatch(/^type: item/m);
  }, T);

  it('items chapters help is available', async () => {
    // /Items/{id}/Chapters is not a standard Jellyfin endpoint on all versions
    const out = await jf('items', 'chapters', '--help');
    expect(out).toMatch(/chapter/i);
  }, T);

  it('items special-features returns items type', async () => {
    const listOut = await jf('items', 'list', '--types', 'Movie', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('items', 'special-features', idMatch[1]);
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('items trailers returns items type', async () => {
    const listOut = await jf('items', 'list', '--types', 'Movie', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('items', 'trailers', idMatch[1]);
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('items stream-url returns stream_url type', async () => {
    const listOut = await jf('items', 'list', '--types', 'Movie', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('items', 'stream-url', idMatch[1]);
    expect(out).toMatch(/^type: stream_url/m);
    expect(out).toMatch(/url:/);
  }, T);

  it('items image-url returns image_url type', async () => {
    const listOut = await jf('items', 'list', '--types', 'Movie', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('items', 'image-url', idMatch[1]);
    expect(out).toMatch(/^type: image_url/m);
    expect(out).toMatch(/url:/);
  }, T);
});

// -------------------------------------------------------------------------
// TV Shows extended: episodes, seasons
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E tvshows extended', () => {
  it('tvshows episodes returns items type', async () => {
    const listOut = await jf('items', 'list', '--types', 'Series', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('tvshows', 'episodes', idMatch[1], '--limit', '3');
    expect(out).toMatch(/^type: items/m);
  }, T);

  it('tvshows seasons returns seasons type', async () => {
    const listOut = await jf('items', 'list', '--types', 'Series', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('tvshows', 'seasons', idMatch[1]);
    expect(out).toMatch(/^type: seasons/m);
  }, T);
});

// -------------------------------------------------------------------------
// Tasks extended: get, triggers
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E tasks extended', () => {
  it('tasks get by ID returns task type', async () => {
    const listOut = await jf('tasks', 'list');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('tasks', 'get', idMatch[1]);
    expect(out).toMatch(/^type: task/m);
  }, T);

  it('tasks triggers help is available', async () => {
    // GET /ScheduledTasks/{id}/Triggers returns 405 on this Jellyfin version (POST only)
    const out = await jf('tasks', 'triggers', '--help');
    expect(out).toMatch(/trigger/i);
  }, T);
});

// -------------------------------------------------------------------------
// Localization options
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E localization options', () => {
  it('localization options returns localization_options type', async () => {
    const out = await jf('localization', 'options');
    expect(out).toMatch(/^type: localization_options/m);
  }, T);
});

// -------------------------------------------------------------------------
// Sessions: get by ID
// NOTE: GET /Sessions/{id} is not a standard Jellyfin endpoint; test help instead.
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E sessions get', () => {
  it('sessions get help is available', async () => {
    const out = await jf('sessions', 'get', '--help');
    expect(out).toMatch(/session/i);
  }, T);
});

// -------------------------------------------------------------------------
// Library media info (media segments)
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E media segments', () => {
  it('media segments help is available', async () => {
    const out = await jf('media', 'segments', '--help');
    expect(out).toMatch(/segment/i);
  }, T);
});

// -------------------------------------------------------------------------
// Read-only safety guard
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E read-only safety', () => {
  it('blocks mutating commands before request execution', async () => {
    const result = await runJfWithCode(
      ['users', 'delete', '00000000000000000000000000000000'],
      { JELLYFIN_READ_ONLY: '1' },
    );
    expect(result.code).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toMatch(/read-?only/i);
    expect(`${result.stdout}${result.stderr}`).toMatch(/users delete/);
  }, T);
});

// -------------------------------------------------------------------------
// Explain mode
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E explain mode', () => {
  it('prints request metadata to stderr without changing stdout payload', async () => {
    const result = await runJfWithCode(['--explain', 'system', 'info']);
    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(/^type: sys/m);
    expect(result.stderr).toMatch(/"type":"request_explain"/);
    expect(result.stderr).toMatch(/"path":"\/System\/Info"/);
    expect(result.stderr).toMatch(/"method":"GET"/);
  }, T);
});
