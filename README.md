# jellyfin-cli

An agent-optimized CLI tool for interacting with the Jellyfin API.

> **Package Manager**: Development uses [Bun](https://bun.sh). Published package execution supports both `bunx` and `npx`.

## Installation

```bash
# Install Bun if you haven't already
curl -fsSL https://bun.sh/install | bash

# Install the CLI globally
bun install -g jellyfin-cli

# Run directly with bunx (no install)
bunx jellyfin-cli --help

# Run directly with npx (no install)
npx jellyfin-cli --help

# Or clone and build from source
git clone https://github.com/unbraind/jellyfin-cli.git
cd jellyfin-cli
bun install
bun run build
```

Installed executable names: `jf`, `jellyfin-cli`, and `jf-cli`.

## Quick Start

```bash
# Quick setup with server URL and API key
jf setup --server http://your-server:8096 --api-key YOUR_API_KEY

# Or use username/password authentication
jf setup --server http://your-server:8096 --username your-user --password your-password

# Test connection
jf config test

# Run diagnostics (connectivity/auth/OpenAPI checks)
jf config doctor

# Enforce non-destructive mode for all following commands
JELLYFIN_READ_ONLY=1

# List libraries
jf library list

# Search for content
jf items search "matrix"

# Control playback
jf sessions list
jf sessions play SESSION_ID ITEM_ID
```

## Features

- **Full Jellyfin API Coverage**: All major API endpoints supported
- **Agent-Optimized**: Designed for LLM/AI agent integration with structured output
- **Toon Format**: Default YAML output format for easy parsing
- **Multiple Output Formats**: Toon, JSON, table, raw, YAML, and Markdown
- **Secure**: Credentials stored in user config directory, never committed
- **Type-Safe**: Full TypeScript implementation
- **Bun-Powered**: Fast package management and builds with Bun
- **Setup Wizard**: Interactive configuration wizard
- **Startup Diagnostics**: `jf setup startup` reports startup wizard state in structured output
- **Startup Wizard Configuration**: `jf setup update-configuration` updates `/Startup/Configuration`
- **Diagnostics**: `jf config doctor` for agent-safe health checks
- **Read-Only Guard**: global `--read-only` or `JELLYFIN_READ_ONLY=1` to block mutating commands
- **Explain Mode**: global `--explain` or `JELLYFIN_EXPLAIN=1` prints redacted request metadata to `stderr`
- **Release Guardrails**: built-in file length + secret scanning checks for safe releases
- **Plugin Management**: List, configure, and manage plugins
- **Device Management**: View and manage connected devices
- **Statistics**: View library statistics and item counts
- **Collections**: Manage box sets and collections
- **Favorites**: Quick access to favorite items
- **Streaming URLs**: Get direct URLs for video, audio, and subtitles

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `JELLYFIN_SERVER_URL` | Server URL |
| `JELLYFIN_API_KEY` | API key |
| `JELLYFIN_USERNAME` | Username for authentication |
| `JELLYFIN_PASSWORD` | Password for authentication |
| `JELLYFIN_USER_ID` | User ID |
| `JELLYFIN_TIMEOUT` | Request timeout (ms) |
| `JELLYFIN_OUTPUT_FORMAT` | Output format (toon, json, table, raw, yaml, markdown) |
| `JELLYFIN_READ_ONLY` | `1/true/on/yes` blocks mutating commands globally |
| `JELLYFIN_EXPLAIN` | `1/true/on/yes` emits redacted request metadata to stderr |

Short aliases are also supported:

- `JF_SERVER_URL`
- `JF_API_KEY`
- `JF_USER`
- `JF_PASSWORD`
- `JF_USER_ID`
- `JF_TIMEOUT`
- `JF_FORMAT`

### Configuration File

Settings are stored in `~/.jellyfin-cli/settings.json`.

```bash
# View current configuration
jf config get

# Show config file path
jf config path

# List all configured servers
jf config list

# Set configuration
jf config set --server URL --api-key KEY
```

## Output Formats

The CLI supports multiple output formats optimized for different use cases:

### Toon (Default)

The default format is optimized for LLM/agent consumption using YAML:

```yaml
type: items
data:
  - id: abc123
    name: The Matrix
    type: Movie
    year: 1999
    rating: 8.7
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### JSON

Standard JSON output for programmatic processing:

```bash
jf items list --format json
```

### Table

Human-readable table format:

```bash
jf users list --format table
```

### Raw

Raw output without formatting:

```bash
jf system info --format raw
```

## Commands

### Setup & Configuration

- `jf setup` - Interactive setup wizard
- `jf setup wizard` - Explicit alias for setup wizard workflows
- `jf setup status` - Check setup status
- `jf setup validate` - Validate setup readiness (config/connectivity/auth/OpenAPI/output-format checks)
- `jf setup env` - Show/export environment variables (`--shell`, structured `--format json`, or `--write-file <path>`)
- `jf setup startup` - Inspect Jellyfin startup wizard state (read-only)
- `jf setup configuration` - Alias of `setup startup` for endpoint-aligned diagnostics
- `jf setup update-configuration` - Update startup wizard configuration values
- `jf config set` - Set configuration values
- `jf config get` - Display current configuration
- `jf config path` - Show configuration file path
- `jf config list` - List all configured servers
- `jf config use <name>` - Switch to a named server configuration
- `jf config delete <name> --force` - Delete a server configuration
- `jf config reset --force` - Reset all configuration
- `jf config test` - Test connection to server
- `jf config doctor` - Check config/auth/connectivity/OpenAPI diagnostics
- `jf setup validate --require-all --validate-formats --format json` - Setup wizard readiness gate for CI/agents
- `jf config doctor --require-connected --require-auth --require-openapi --require-valid-formats --validate-formats` - Enforce machine-checkable release gates
- `jf schema openapi` - Summarize live server OpenAPI capabilities for agent discovery
- `jf schema research` - Emit consolidated OpenAPI + full/read-only coverage snapshot for API research
- `jf schema tools` - Export command tool schemas for LLM function-calling, with optional live OpenAPI endpoint matches
- `jf schema coverage` - Estimate API coverage, list unmatched OpenAPI operations, and suggest command names
- `jf schema suggest` - Generate candidate CLI command patterns from OpenAPI intent matches or coverage gaps

## Release Validation

```bash
bun run version:sync
bun run validate:release
```

This syncs/enforces the version policy and runs typecheck, lint, tests, build, dist smoke checks, TypeScript code-length enforcement (<=300 lines excluding comments), tracked-file secret scan, and git-history secret scan.
It also validates npm packaging (`npm pack --dry-run`) and a local `npx` smoke run from the packed tarball.

## CI/CD and Release Operations

GitHub Actions workflows are configured for professional release management:

- `CI` (`.github/workflows/ci.yml`): PR/push quality gates
- `CodeQL` (`.github/workflows/codeql.yml`): static security analysis
- `Secret Scan` (`.github/workflows/secret-scan.yml`): tracked-file + git-history + Gitleaks checks
- `Commit Quality` (`.github/workflows/commit-quality.yml`): PR title + commit subject professionalism checks
- `Release Prepare` (`.github/workflows/release-prepare.yml`): manual release candidate validation + artifact packaging
- `Release Publish (Manual)` (`.github/workflows/release-publish.yml`): guarded npm publish workflow (manual only, optional dry-run)
  - Uses npm Trusted Publishing when configured; falls back to `NPM_TOKEN` secret
- `GitHub Release (Manual)` (`.github/workflows/release-github.yml`): creates annotated tag + GitHub release from `package.json` version

Contributor and governance standards:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

### Version Policy

- Version format is mandatory: `YYYY.MM.DD` or `YYYY.MM.DD-<N>`
- Example (first release of day): `2026.03.04`
- Example (third release on same day): `2026.03.04-3`
- Date uses UTC day
- `N` is the release index for that UTC day
- `-1` is not allowed (use `YYYY.MM.DD` without suffix)
- Use `bun run version:sync` before preparing a release

## Read-Only Mode

Use read-only mode for safe agent workflows against production libraries:

```bash
# one command
jf --read-only items list --limit 5

# entire shell session
export JELLYFIN_READ_ONLY=1
jf library list

# inspect API request mapping for a command
jf --explain system info
```

Mutating operations are blocked with a structured Toon error while read operations continue to work.

### System

- `jf system info` - Get system information
- `jf system health` - Check server health
- `jf system restart` - Restart the server
- `jf system shutdown` - Shutdown the server
- `jf system activity` - Get activity log

### Users

- `jf users list` - List all users
- `jf users get <userId>` - Get user by ID
- `jf users me` - Get current user info
- `jf users by-name <username>` - Get user by username
- `jf users create <username>` - Create a new user
- `jf users update-password <userId>` - Update user password
- `jf users delete <userId> --force` - Delete a user
- `jf users policy <userId>` - Get user policy
- `jf users update-policy <userId>` - Update user policy (admin rights, permissions)
- `jf users config <userId>` - Get user configuration
- `jf users update-config <userId>` - Update user configuration (preferences)

### Items

- `jf items list` - List items
- `jf items get <itemId>` - Get item by ID
- `jf items latest` - Get latest items
- `jf items resume` - Get resume items
- `jf items search <term>` - Search for items
- `jf items similar <itemId>` - Get similar items
- `jf items intros <itemId>` - Get intro videos
- `jf items chapters <itemId>` - Get chapters
- `jf items special-features <itemId>` - Get special features
- `jf items trailers <itemId>` - Get local trailers
- `jf items ancestors <itemId>` - Get parent items
- `jf items parts <itemId>` - Get additional parts
- `jf items playback-info <itemId>` - Get playback info
- `jf items stream-url <itemId>` - Get video stream URL
- `jf items audio-url <itemId>` - Get audio stream URL
- `jf items image-url <itemId>` - Get image URL
- `jf items subtitle-url <itemId> <mediaSourceId> <streamIndex>` - Get subtitle URL
- `jf items refresh <itemId>` - Refresh item metadata
- `jf items update <itemId>` - Update item metadata (name, overview, genres, etc.)
- `jf items delete <itemId>` - Delete an item

### Sessions

- `jf sessions list` - List all active sessions
- `jf sessions get <sessionId>` - Get session by ID
- `jf sessions play <sessionId> <itemIds...>` - Play items
- `jf sessions pause <sessionId>` - Pause playback
- `jf sessions unpause <sessionId>` - Resume playback
- `jf sessions stop <sessionId>` - Stop playback
- `jf sessions next <sessionId>` - Next track
- `jf sessions previous <sessionId>` - Previous track
- `jf sessions seek <sessionId> <ticks>` - Seek to position
- `jf sessions mute <sessionId>` - Mute audio
- `jf sessions unmute <sessionId>` - Unmute audio
- `jf sessions volume <sessionId> <level>` - Set volume level
- `jf sessions message <sessionId>` - Send message

### Library

- `jf library list` - List all libraries
- `jf library refresh` - Refresh all libraries
- `jf library genres` - List all genres
- `jf library studios` - List all studios
- `jf library persons` - List all persons
- `jf library artists` - List all artists
- `jf library album-artists` - List all album artists
- `jf library get-genre <name>` - Get a genre by name
- `jf library get-person <name>` - Get a person by name
- `jf library get-studio <name>` - Get a studio by name

### User Data

- `jf userdata favorite <itemId>` - Mark as favorite
- `jf userdata unfavorite <itemId>` - Remove from favorites
- `jf userdata played <itemId>` - Mark as played
- `jf userdata unplayed <itemId>` - Mark as unplayed
- `jf userdata like <itemId>` - Like an item
- `jf userdata dislike <itemId>` - Dislike an item
- `jf userdata unrate <itemId>` - Remove rating

### Favorites

- `jf favorites list` - List favorite items
- `jf favorites add <itemId>` - Add to favorites
- `jf favorites remove <itemId>` - Remove from favorites

### Collections

- `jf collections list` - List all collections
- `jf collections get <collectionId>` - Get collection details
- `jf collections items <collectionId>` - List items in collection
- `jf collections create <name>` - Create a new collection
- `jf collections add <collectionId> <itemIds...>` - Add items to collection
- `jf collections remove <collectionId> <itemIds...>` - Remove items from collection

### Tasks

- `jf tasks list` - List all scheduled tasks
- `jf tasks get <taskId>` - Get task by ID
- `jf tasks run <taskId>` - Start a task
- `jf tasks running <taskId>` - Alias of `tasks run`
- `jf tasks stop <taskId>` - Stop a running task
- `jf tasks triggers <taskId>` - List task triggers
- `jf tasks add-trigger <taskId>` - Add a task trigger
- `jf tasks delete-trigger <taskId> <triggerId>` - Delete a task trigger

### Playlists

- `jf playlists create <name>` - Create a playlist
- `jf playlists add <playlistId> <itemIds...>` - Add items
- `jf playlists remove <playlistId> <entryIds...>` - Remove items
- `jf playlists items <playlistId>` - List playlist items
- `jf playlists delete <playlistId>` - Delete a playlist

### Live TV

- `jf livetv info` - Get Live TV info
- `jf livetv channels` - List channels
- `jf livetv channel <channelId>` - Get channel by ID
- `jf livetv programs` - List programs
- `jf livetv program <programId>` - Get program by ID
- `jf livetv recordings` - List recordings
- `jf livetv timers` - List timers
- `jf livetv timer <timerId>` - Get timer by ID
- `jf livetv create-timer` - Create a timer
- `jf livetv delete-timer <timerId>` - Delete a timer
- `jf livetv series-timers` - List series timers
- `jf livetv series-timer <id>` - Get series timer by ID
- `jf livetv delete-series-timer <id>` - Delete a series timer
- `jf livetv schedules-direct-countries` - List Schedules Direct countries

### Discover

- `jf discover recommendations` - Get recommendations
- `jf discover mix <itemId>` - Get instant mix

### Plugins

- `jf plugins list` - List all plugins
- `jf plugins get <pluginId>` - Get plugin details
- `jf plugins config <pluginId>` - Get plugin configuration
- `jf plugins uninstall <pluginId>` - Uninstall a plugin

### Devices

- `jf devices list` - List all devices
- `jf devices info` - Get current device info
- `jf devices get <deviceId>` - Get device details
- `jf devices rename <deviceId> <name>` - Rename device
- `jf devices delete <deviceId>` - Delete device

### Branding

- `jf branding get` - Get branding configuration

### Statistics

- `jf stats counts` - Get library item counts

### API Keys

- `jf apikeys list` - List all API keys
- `jf apikeys create <app>` - Create new API key
- `jf apikeys delete <key>` - Delete API key

### Notifications

- `jf notifications types` - List notification types
- `jf notifications list` - List user notifications
- `jf notifications send` - Send admin notification

### SyncPlay

- `jf syncplay list` - List SyncPlay groups
- `jf syncplay groups` - Alias of `syncplay list`
- `jf syncplay create [--name <name>]` - Create a group
- `jf syncplay new [--name <name>]` - Alias of `syncplay create`
- `jf syncplay join <groupId>` - Join a group
- `jf syncplay leave` - Leave group
- `jf syncplay pause` - Pause group playback
- `jf syncplay unpause` - Resume group playback
- `jf syncplay stop` - Stop group playback

### Quick Connect

- `jf quickconnect status` - Check if Quick Connect is enabled
- `jf quickconnect init` - Initialize Quick Connect
- `jf quickconnect check <secret>` - Check connection status
- `jf quickconnect authorize <code>` - Authorize request

### Auth

- `jf auth providers` - List authentication providers
- `jf auth password-reset-providers` - List password reset providers
- `jf auth keys` - List API keys (read-only alias)

### Backup

- `jf backup list` - List backups
- `jf backup create` - Create a backup
- `jf backup restore <path>` - Restore from backup
- `jf backup delete <path>` - Delete backup

### Subtitles

- `jf subtitles search <itemId> <language>` - Search remote subtitles
- `jf subtitles download <itemId> <subtitleId>` - Download subtitle
- `jf subtitles delete <itemId> <index>` - Delete subtitle track
- `jf subtitles providers` - List subtitle providers

### Media

- `jf media segments <itemId>` - Get media segments
- `jf media lyrics <itemId>` - Get lyrics
- `jf media theme-songs <itemId>` - Get theme songs
- `jf media theme-videos <itemId>` - Get theme videos
- `jf media external-ids <itemId>` - Get external IDs
- `jf media external-id-infos <itemId>` - Alias for external IDs
- `jf media remote-images <itemId>` - Get remote images
- `jf media download-image <itemId>` - Download remote image
- `jf media hls-url <itemId>` - Get HLS playlist URL
- `jf media video-stream-url <itemId>` - Get direct video stream URL
- `jf media audio-stream-url <itemId>` - Get direct audio stream/universal URL
- `jf media hls-legacy-url <itemId> <playlistId>` - Get legacy HLS playlist URL
- `jf media hls-audio-segment-url <itemId> <segmentId>` - Get legacy HLS audio segment URL
- `jf media item-file-url <itemId>` - Get direct item file URL
- `jf media kodi-strm-url <type> <id>` - Get Kodi `.strm` URL
- `jf media branding-css-url` - Get static branding CSS URL

### Dashboard

- `jf dashboard pages [--main-menu true|false]` - List dashboard configuration pages
- `jf dashboard page <name>` - Get dashboard configuration page source

### Localization

- `jf localization options` - Get localization options
- `jf localization countries` - Get countries
- `jf localization cultures` - Get cultures/languages
- `jf localization ratings` - Get rating systems

### Environment

- `jf environment drives` - Get available drives
- `jf environment logs` - Get log files
- `jf environment log <name>` - Get log file content
- `jf environment storage` - Get storage info

### TV Shows

- `jf tvshows episodes <seriesId>` - Get episodes for a series
- `jf tvshows seasons <seriesId>` - Get seasons for a series
- `jf tvshows next-up` - Get next up episodes
- `jf tvshows upcoming` - Get upcoming episodes
- `jf tvshows similar <itemId>` - Get similar shows for a series/episode

### Packages

- `jf packages list` - List available packages
- `jf packages get <packageId>` - Get package details
- `jf packages install <packageId>` - Install a package
- `jf packages cancel <installationId>` - Cancel installation
- `jf packages installing` - List installing packages
- `jf packages repositories` - List plugin repositories

### Images

- `jf images list <itemId>` - List item images
- `jf images url <itemId> <type>` - Get image URL
- `jf images artist-url <artistName> <type>` - Get artist image URL by name
- `jf images genre-url <genreName> <type>` - Get genre image URL by name
- `jf images music-genre-url <genreName> <type>` - Get music genre image URL by name
- `jf images person-url <personName> <type>` - Get person image URL by name
- `jf images studio-url <studioName> <type>` - Get studio image URL by name
- `jf images delete <itemId> <type>` - Delete image
- `jf images user <userId>` - Get user profile image URL

### Suggestions

- `jf suggestions get` - Get content suggestions

### Years

- `jf years list` - List all years
- `jf years get <year>` - Get items for a year

### Music Genres

- `jf music-genres list` - List all music genres
- `jf music-genres get <name>` - Get music genre by name

### Trickplay

- `jf trickplay hls-url <itemId> <width>` - Get trickplay HLS playlist URL
- `jf trickplay tile-url <itemId> <width> <index>` - Get trickplay tile image URL

### Channels

- `jf channels list` - List all channels
- `jf channels features [channelId]` - Get channel features
- `jf channels items <channelId>` - Get channel items
- `jf channels latest <channelId>` - Get latest channel items

### Schema (Agent/LLM Optimization)

- `jf schema` - Output JSON schema for all Toon format types
- `jf schema <type>` - Output JSON schema for a specific type
- `jf schema list` - List all available output types
- `jf schema validate [type] [--from auto|json|yaml|toon] [--input <payload>]` - Validate output payloads against CLI schemas (stdin or inline)
- `jf schema openapi [--include-paths --limit 50] [--method GET] [--tag Users] [--path-prefix /Users] [--search text] [--read-only-ops] [--endpoint /api-docs/openapi.json] [--for-command "items list"]` - Fetch/summarize/filter OpenAPI and infer likely endpoints for a CLI intent
- `jf schema research [--method GET] [--tag Users] [--path-prefix /Users] [--endpoint /api-docs/openapi.json] [--command-prefix items] [--min-score 3] [--require-coverage 100] [--include-unmatched] [--limit 20]` - Generate one consolidated OpenAPI + full/read-only coverage snapshot
- `jf schema tools [--command <prefix> --limit <n> --openapi-match --name <server>]` - Export tool schemas with input schema, read-only metadata, and optional live OpenAPI endpoint matches per command
- `jf schema coverage [--method GET] [--tag Users] [--path-prefix /Users] [--read-only-ops] [--endpoint /api-docs/openapi.json] [--command-prefix items] [--min-score 3] [--require-coverage 100] [--suggest-commands] [--limit 50]` - Estimate intent-based OpenAPI coverage for current CLI command set and optionally generate candidate CLI names for unmapped endpoints
- `jf schema suggest [--for-command "users list"] [--method GET] [--tag Users] [--path-prefix /Users] [--search text] [--read-only-ops] [--endpoint /api-docs/openapi.json] [--min-score 3] [--limit 20]` - Generate structured CLI command suggestions from live OpenAPI (intent mode with `--for-command`, or uncovered operation mode without it)

## Agent/LLM Optimization

This CLI is designed to be easily used by AI agents and LLMs:

1. **Structured Output**: The default `toon` format provides consistent, parseable YAML output
2. **Type Information**: Every output includes a `type` field indicating the data structure
3. **Stable Envelope**: Output always includes a top-level `type` and structured `data`
4. **Error Handling**: Errors are returned in a consistent format
5. **No Interactive Prompts**: All inputs are via command-line arguments

### Example Agent Integration

```javascript
// Execute command and parse output
const result = await exec('jf items search "matrix" --format toon');
const data = yaml.parse(result);

if (data.type === 'search_result') {
  for (const hint of data.data.hints) {
    console.log(`${hint.name} (${hint.type})`);
  }
}
```

### Python Example

```python
import yaml
import subprocess

def get_items(search_term):
    result = subprocess.run(
        ['jf', 'items', 'search', search_term, '--format', 'toon'],
        capture_output=True,
        text=True
    )
    
    data = yaml.safe_load(result.stdout)
    
    if data['type'] == 'error':
        raise Exception(data['data']['error'])
    
    if data['type'] == 'search_result':
        return data['data']['hints']
    
    return []
```

## Development

This project uses [Bun](https://bun.sh) for package management, testing, and building.

```bash
# Install dependencies
bun install

# Build
bun run build

# Run in development mode
bun run dev

# Run tests
bun test

# Run tests with coverage
bun run test:coverage

# Type check
bun run typecheck

# Lint
bun run lint
```

## Documentation

- [API Reference](docs/api.md) - Full command documentation
- [Toon Output Format](docs/toon-format.md) - Output format specification

## License

MIT
