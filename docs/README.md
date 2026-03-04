# Jellyfin CLI Documentation

## Overview

jellyfin-cli is an agent-optimized CLI tool for interacting with the Jellyfin media server API. It outputs structured data in the Toon format (YAML-based) by default, making it easy for LLMs to parse.

## Documentation Index

| Document | Description |
|----------|-------------|
| [API Reference](api.md) | Complete command documentation with examples |
| [Toon Format](toon-format.md) | Output format specification for LLM parsing |
| [Agent Integration](agent-integration.md) | Guide for integrating with AI agents and LLMs |
| [Security](security.md) | Security best practices |
| [Troubleshooting](troubleshooting.md) | Common issues and solutions |
| [Improvements](IMPROVEMENTS.md) | Enhancement history and features |
| [API Research](api-research.md) | Live API discovery notes and agent-focused roadmap |
| [Release Readiness](release-readiness.md) | Pre-release validation, secret safety, and E2E checklist |

## Installation

```bash
# Install dependencies
bun install

# Build the CLI
bun run build

# Run the CLI
./dist/cli.js --help

# Or install globally
bun install -g .
```

## Quick Start

```bash
# Quick setup with server URL and API key
jf setup --server http://your-server:8096 --api-key YOUR_API_KEY

# Or use username/password authentication
jf setup --server http://your-server:8096 --username your-user --password your-password

# Test connection
jf config test

# Run diagnostics (safe checks only)
jf config doctor

# Inspect live OpenAPI surface for agent planning
jf schema openapi --include-paths --method GET --tag Users --read-only-ops --for-command "users list" --limit 25

# Export tool schemas for function-calling agents
jf schema tools --command items --limit 20

# Validate CLI output payloads against built-in schemas
jf items list --limit 1 | jf schema validate items --from toon

# Estimate uncovered OpenAPI operations for a command domain
jf schema coverage --method GET --read-only-ops --command-prefix items --min-score 3 --limit 25
jf schema coverage --read-only-ops --suggest-commands --limit 20

# Explain actual Jellyfin request mapping (safe redacted metadata on stderr)
jf --explain system info

# Optional: enforce non-destructive command execution
export JELLYFIN_READ_ONLY=1

# Export config as environment variables (masked by default)
jf setup env --shell

# Structured export for agent workflows
jf setup env --format json

# List libraries
jf library list

# Search for content
jf items search "matrix"

# Control playback
jf sessions list
jf sessions play SESSION_ID ITEM_ID
```

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
| `JELLYFIN_OUTPUT_FORMAT` | Output format (`toon`, `json`, `table`, `raw`, `yaml`, `markdown`) |
| `JELLYFIN_EXPLAIN` | Emit redacted request metadata to stderr (`1`/`true`) |

### Configuration File

Settings are stored in `~/.jellyfin-cli/settings.json`.

### Versioning Policy

- Project version must follow: `YYYY.MM.DD-<commitIndex>`
- Example: `2025.12.31-10`
- Date is UTC
- Sync before release/commit:

```bash
bun run version:sync
bun run check:version
```

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

### Multi-Server Configuration

```bash
# Add multiple servers
jf config set --server http://prod-server:8096 --api-key KEY --name production
jf config set --server http://staging-server:8096 --api-key KEY --name staging

# Switch between servers
jf config use production
jf config use staging

# List all servers
jf config list
```

## Output Formats

The CLI supports multiple output formats:

| Format | Description | Best For |
|--------|-------------|----------|
| `toon` | YAML-based format (default) | LLM/AI agents, scripts |
| `json` | Standard JSON output | Programmatic processing |
| `table` | Human-readable table | Interactive use |
| `raw` | Raw API response | Debugging |
| `yaml` | Standard YAML output | YAML-native tooling |
| `markdown` | Markdown tables/text | Human-readable reports |

```bash
# Use different formats
jf users list --format json
jf library list --format table
jf system info --format raw
jf users list --format yaml
jf items list --format markdown
```

## Read-Only Live E2E Testing

Use the existing live E2E suite in `tests/e2e/cli.test.ts` for full command smoke validation against a real server.

```bash
JELLYFIN_SERVER_URL=http://<host>:8096 \
JELLYFIN_API_KEY=<api-key> \
JELLYFIN_USER_ID=<user-id> \
bun test tests/e2e/cli.test.ts
```

Or run directly from `~/.jellyfin-cli/settings.json` (no env vars needed) after `jf setup`.

Notes:
- Tests are designed to be read-only for safety.
- E2E runs `bun run src/cli.ts` by default to avoid stale `dist/` mismatches.
- Set `JELLYFIN_E2E_USE_DIST=1` to force `dist/cli.js`.
- Write endpoints are validated via `--help` checks or skipped patterns.
- If the server is unavailable, the suite auto-skips.

## Command Categories

### Setup & Configuration

| Command | Description |
|---------|-------------|
| `jf setup` | Interactive setup wizard |
| `jf setup status` | Check setup status |
| `jf setup env` | Show environment variables |
| `jf setup startup` | Inspect startup wizard state (read-only) |
| `jf config set` | Set configuration values |
| `jf config get` | Display current configuration |
| `jf config path` | Show configuration file path |
| `jf config list` | List all configured servers |
| `jf config use <name>` | Switch to a named server |
| `jf config delete <name>` | Delete a server configuration |
| `jf config reset` | Reset all configuration |
| `jf config test` | Test connection to server |
| `jf config doctor` | Structured diagnostics for config, auth, and OpenAPI availability |
| `jf schema openapi` | Fetch/summarize/filter live OpenAPI operations and infer endpoint matches for CLI intents |
| `jf schema tools` | Export command tool schemas with typed input schema and read-only safety flags |
| `jf schema coverage` | Estimate OpenAPI coverage by CLI intents, sample unmatched operations, and optionally suggest command names |
| `jf schema validate` | Validate Toon/JSON/YAML payloads against CLI schemas for CI and agent safety |

### System Administration

| Command | Description |
|---------|-------------|
| `jf system info` | Get system information |
| `jf system health` | Check server health |
| `jf system time` | Get server UTC time |
| `jf system config` | Get server configuration |
| `jf system config-section <key>` | Get named config section |
| `jf system restart` | Restart the server |
| `jf system shutdown` | Shutdown the server |
| `jf system activity` | Get activity log |
| `jf backup list` | List backups |
| `jf backup create` | Create a backup |
| `jf backup restore <path>` | Restore from backup |
| `jf tasks list` | List scheduled tasks |
| `jf tasks run <taskId>` | Run a task |
| `jf environment drives` | List available drives |
| `jf environment logs` | List log files |
| `jf environment log <name>` | Get log file content |
| `jf apikeys list` | List API keys |
| `jf apikeys create <app>` | Create a new API key |
| `jf apikeys delete <key>` | Delete an API key |

### User Management

| Command | Description |
|---------|-------------|
| `jf users list` | List all users |
| `jf users public` | List public users (no auth needed) |
| `jf users get <userId>` | Get user by ID |
| `jf users me` | Get current user info |
| `jf users views` | Get user's library views |
| `jf users display-prefs <id>` | Get display preferences |
| `jf users create <username>` | Create a new user |
| `jf users update-password <userId>` | Update user password |
| `jf users policy <userId>` | Get user policy |
| `jf users update-policy <userId>` | Update user permissions |
| `jf users config <userId>` | Get user configuration |
| `jf users update-config <userId>` | Update user preferences |
| `jf users forgot-password <username>` | Initiate forgot password flow |
| `jf users redeem-pin <pin>` | Redeem a forgot-password PIN |
| `jf auth providers` | List auth providers |
| `jf auth password-reset-providers` | List password reset providers |
| `jf auth keys` | List API keys via auth namespace (read-only alias) |

### Content Management

| Command | Description |
|---------|-------------|
| `jf library list` | List all libraries |
| `jf library refresh` | Refresh all libraries |
| `jf library genres` | List all genres |
| `jf library studios` | List all studios |
| `jf library persons` | List all persons |
| `jf library virtual-folders` | List virtual folders with paths |
| `jf library add-folder` | Add a new virtual folder |
| `jf library remove-folder <name>` | Remove a virtual folder |
| `jf library rename-folder <name> <new>` | Rename a virtual folder |
| `jf library add-path <folder> <path>` | Add media path to folder |
| `jf library remove-path <folder> <path>` | Remove media path |
| `jf library media-folders` | List top-level media folders |
| `jf library physical-paths` | List physical server paths |
| `jf items list` | List items with filters |
| `jf items search <term>` | Search for items |
| `jf items get <itemId>` | Get item details |
| `jf items root` | Get root virtual folder |
| `jf items critic-reviews <itemId>` | Get critic reviews |
| `jf items download-url <itemId>` | Get download URL |
| `jf items set-content-type <itemId>` | Set content type |
| `jf items identify <itemId>` | Search for metadata matches |
| `jf items apply-match <itemId>` | Apply metadata search result |
| `jf items update <itemId>` | Update item metadata |
| `jf items delete <itemId>` | Delete an item |
| `jf items refresh <itemId>` | Refresh item metadata |
| `jf userdata get <itemId>` | Get user data for item |
| `jf collections list` | List box sets / collections |
| `jf collections get <id>` | Get collection details |
| `jf collections items <id>` | List items in collection |
| `jf favorites list` | List favorite items |
| `jf suggestions get` | Get content suggestions |

### TV Shows

| Command | Description |
|---------|-------------|
| `jf tvshows episodes <seriesId>` | List episodes for a series |
| `jf tvshows seasons <seriesId>` | List seasons for a series |
| `jf tvshows next-up` | Get next up episodes |
| `jf tvshows upcoming` | Get upcoming episodes |

### Music & Artists

| Command | Description |
|---------|-------------|
| `jf artists list` | List music artists |
| `jf artists album-artists` | List album artists |
| `jf artists get <name>` | Get artist by name |
| `jf music-genres list` | List music genres |
| `jf music-genres get <name>` | Get a specific music genre |

### Media & Images

| Command | Description |
|---------|-------------|
| `jf images list <itemId>` | List images for an item |
| `jf images url <itemId> <type>` | Get image URL |
| `jf images user <userId>` | Get user profile image URL |
| `jf media segments <itemId>` | Get media segments |
| `jf media remote-images <itemId>` | List available remote images |
| `jf media hls-url <itemId>` | Get HLS master playlist URL |
| `jf media theme-songs <itemId>` | Get theme songs |
| `jf media theme-videos <itemId>` | Get theme videos |
| `jf media external-ids <itemId>` | Get external IDs |
| `jf media lyrics <itemId>` | Get audio lyrics |
| `jf trickplay hls-url <itemId> <w>` | Get trickplay HLS URL |
| `jf trickplay tile-url <itemId> <w> <i>` | Get trickplay tile URL |

### Videos

| Command | Description |
|---------|-------------|
| `jf videos parts <itemId>` | List video parts/versions |
| `jf videos merge-versions <ids...>` | Merge video versions |
| `jf videos merge-episodes <ids...>` | Merge episode versions |
| `jf videos merge-movies <ids...>` | Merge movie versions |
| `jf videos split-episodes <ids...>` | Split episode versions |
| `jf videos split-movies <ids...>` | Split movie versions |
| `jf videos delete-alternates <id>` | Delete alternate sources |
| `jf videos cancel-transcoding` | Cancel active video encodings |

### Playback Control

| Command | Description |
|---------|-------------|
| `jf sessions list` | List active sessions |
| `jf sessions play <sessionId> <itemIds>` | Play items |
| `jf sessions pause <sessionId>` | Pause playback |
| `jf sessions stop <sessionId>` | Stop playback |
| `jf sessions seek <sessionId> <ticks>` | Seek to position |
| `jf sessions volume <sessionId> <level>` | Set volume |
| `jf sessions user-add` | Add user to session |
| `jf sessions user-remove` | Remove user from session |
| `jf syncplay list` | List SyncPlay groups |
| `jf syncplay create` | Create a SyncPlay group |
| `jf syncplay seek` | Seek in SyncPlay group |
| `jf syncplay next/previous` | Skip tracks in SyncPlay |
| `jf syncplay set-repeat <mode>` | Set SyncPlay repeat mode |
| `jf syncplay set-shuffle <mode>` | Set SyncPlay shuffle mode |
| `jf syncplay queue` | Add to SyncPlay queue |
| `jf syncplay set-queue` | Replace SyncPlay queue |
| `jf syncplay remove <ids...>` | Remove items from SyncPlay playlist |
| `jf syncplay move-item <id> <index>` | Move playlist item to new position |
| `jf syncplay set-item <id>` | Jump to specific playlist item |
| `jf syncplay ping <ms>` | Report client latency |
| `jf syncplay buffering` | Report buffering state |
| `jf syncplay ready` | Report ready state |
| `jf syncplay set-ignore-wait <bool>` | Set ignore-wait flag |

### Plugins & Packages

| Command | Description |
|---------|-------------|
| `jf plugins list` | List installed plugins |
| `jf plugins enable <id> <version>` | Enable a disabled plugin |
| `jf plugins disable <id> <version>` | Disable a plugin |
| `jf packages list` | List available packages |
| `jf packages get <id>` | Get package details |
| `jf packages repositories` | List plugin repositories |
| `jf packages installing` | List installing packages |

### Live TV & Channels

| Command | Description |
|---------|-------------|
| `jf livetv info` | Get Live TV info |
| `jf livetv channels` | List Live TV channels |
| `jf livetv channel <channelId>` | Get a single Live TV channel by id |
| `jf livetv programs` | List TV programs |
| `jf livetv program <programId>` | Get a single TV program by id |
| `jf livetv recordings` | List recordings |
| `jf livetv timers` | List recording timers |
| `jf livetv series-timers` | List series timers |
| `jf livetv guide-info` | Get guide date range |
| `jf livetv recommended` | Get recommended programs |
| `jf livetv recording-folders` | Get recording folders |
| `jf livetv recording-groups` | Get recording groups |
| `jf livetv recording <id>` | Get single recording |
| `jf livetv delete-recording <id>` | Delete a recording |
| `jf livetv discover-tuners` | Discover tuner devices |
| `jf livetv tuner-types` | List tuner host types |
| `jf livetv schedules-direct-countries` | List Schedules Direct countries |
| `jf channels list` | List channel plugin channels |

### Live TV Administration

| Command | Description |
|---------|-------------|
| `jf livetv-admin series-recordings` | List series recordings |
| `jf livetv-admin timer-defaults` | Get timer default values |
| `jf livetv-admin update-timer <id>` | Update an existing timer |
| `jf livetv-admin create-series-timer` | Create a series timer |
| `jf livetv-admin add-tuner-host` | Add a tuner host device |
| `jf livetv-admin delete-tuner-host <id>` | Delete a tuner host |
| `jf livetv-admin reset-tuner <id>` | Reset a tuner device |
| `jf livetv-admin add-listing-provider` | Add an EPG provider |
| `jf livetv-admin delete-listing-provider <id>` | Delete an EPG provider |
| `jf livetv-admin channel-mapping-options` | Get channel mapping options |
| `jf livetv-admin set-channel-mappings` | Configure channel mappings |

### Discovery & Stats

| Command | Description |
|---------|-------------|
| `jf discover recommendations` | Get personalized recommendations |
| `jf discover mix <itemId>` | Get instant mix for item |
| `jf discover album-mix <albumId>` | Get instant mix based on album |
| `jf discover song-mix <songId>` | Get instant mix based on song |
| `jf discover trailers` | List trailers |
| `jf stats counts` | Get library item counts |
| `jf years list` | List content years |
| `jf years get <year>` | Get items from a year |
| `jf reports activities` | Activity report (plugin) |
| `jf reports items` | Items report (plugin) |
| `jf reports headers` | Report headers (plugin) |

### System & Environment

| Command | Description |
|---------|-------------|
| `jf system endpoint` | Get network endpoint info |
| `jf environment dir-contents <path>` | List directory contents |
| `jf environment network-shares` | List network shares |

### Schema & LLM Integration

| Command | Description |
|---------|-------------|
| `jf schema` | Output all output type schemas |
| `jf schema <type>` | Output schema for specific type |
| `jf schema list` | List available output types |

## Agent/LLM Optimization

This CLI is designed for AI agent integration:

1. **Structured Output**: Default `toon` format provides consistent YAML output
2. **Type Information**: Every output includes a `type` field
3. **Metadata**: Includes timestamp, format version
4. **Error Handling**: Errors in consistent format
5. **No Interactive Prompts**: All inputs via command-line arguments
6. **JSON Schemas**: Available via `jf schema` command

See [Agent Integration Guide](agent-integration.md) for detailed examples.

## Development

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

## Getting Help

- Use `jf <command> --help` for command-specific help
- Check [Troubleshooting](troubleshooting.md) for common issues
- Review [API Reference](api.md) for detailed command documentation

## License

MIT
