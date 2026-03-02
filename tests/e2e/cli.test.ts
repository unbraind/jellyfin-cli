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
import { existsSync } from 'node:fs';

const SERVER_URL = process.env.JELLYFIN_SERVER_URL ?? '';
const API_KEY = process.env.JELLYFIN_API_KEY ?? '';
const USER_ID = process.env.JELLYFIN_USER_ID ?? '';

const HAS_ENV = Boolean(SERVER_URL && API_KEY && USER_ID);

// Determine which CLI runner to use (compiled binary is faster).
const DIST_BIN = new URL('../../dist/cli.js', import.meta.url).pathname;
const USE_COMPILED = existsSync(DIST_BIN);
const CLI_CMD: string[] = USE_COMPILED ? ['node', DIST_BIN] : ['bun', 'run', 'src/cli.ts'];

async function checkReachable(): Promise<boolean> {
  if (!HAS_ENV) return false;
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
  console.warn(`⚠  Skipping E2E tests: server not reachable at ${SERVER_URL || '(no URL set)'}`);
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
