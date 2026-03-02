/**
 * End-to-end tests for jellyfin-cli against a live Jellyfin server.
 * All operations are READ-ONLY — no modifications to server data.
 *
 * Requires env vars:
 *   JELLYFIN_SERVER_URL, JELLYFIN_API_KEY, JELLYFIN_USER_ID
 *
 * Skipped automatically if the server is not reachable or env vars are missing.
 */

import { describe, it, expect } from 'vitest';

const SERVER_URL = process.env.JELLYFIN_SERVER_URL ?? '';
const API_KEY = process.env.JELLYFIN_API_KEY ?? '';
const USER_ID = process.env.JELLYFIN_USER_ID ?? '';

const HAS_ENV = Boolean(SERVER_URL && API_KEY && USER_ID);

async function checkReachable(): Promise<boolean> {
  if (!HAS_ENV) return false;
  try {
    const res = await fetch(`${SERVER_URL}/Health`, {
      headers: { 'X-Emby-Token': API_KEY },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Top-level await: resolve before tests run so describe.skipIf conditions work.
const serverReachable = await checkReachable();
const skip = !serverReachable;

if (skip) {
  console.warn(`⚠  Skipping E2E tests: server not reachable at ${SERVER_URL || '(no URL set)'}`);
}

/** Run a jf-cli command and return stdout. Drains stdout & stderr in parallel to prevent pipe deadlock. */
async function jf(...args: string[]): Promise<string> {
  const proc = Bun.spawn(['bun', 'run', 'src/cli.ts', ...args], {
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

// Per-test timeout: each test spawns a bun subprocess (2-4s startup + API call).
const T = 30_000;

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
// New v8: Videos alternate sources
// -------------------------------------------------------------------------

describe.skipIf(skip)('E2E videos alternate-sources', () => {
  it('videos alternate-sources returns items type for a video', async () => {
    const listOut = await jf('items', 'list', '--types', 'Movie', '--limit', '1', '--recursive');
    const idMatch = listOut.match(/id: ([a-f0-9]{32})/);
    if (!idMatch) return;
    const out = await jf('videos', 'alternate-sources', idMatch[1]);
    expect(out).toMatch(/^type: items/m);
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
