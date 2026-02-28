# jellyfin-cli

An agent-optimized CLI tool for interacting with the Jellyfin API.

> **Package Manager**: This project uses [Bun](https://bun.sh) as its package manager and build tool.

## Installation

```bash
# Install Bun if you haven't already
curl -fsSL https://bun.sh/install | bash

# Install the CLI globally
bun install -g jellyfin-cli

# Or clone and build from source
git clone https://github.com/unbraind/jellyfin-cli.git
cd jellyfin-cli
bun install
bun run build
```

## Quick Start

```bash
# Quick setup with server URL and API key
jf setup --server http://your-server:8096 --api-key YOUR_API_KEY

# Or use username/password authentication
jf setup --server http://your-server:8096 --username your-user --password your-password

# Test connection
jf config test

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
- **Multiple Output Formats**: JSON, table, and raw formats available
- **Secure**: Credentials stored in user config directory, never committed
- **Type-Safe**: Full TypeScript implementation
- **Bun-Powered**: Fast package management and builds with Bun
- **Setup Wizard**: Interactive configuration wizard
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
| `JELLYFIN_OUTPUT_FORMAT` | Output format (toon, json, table, raw) |

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
- `jf setup status` - Check setup status
- `jf setup env` - Show environment variables
- `jf config set` - Set configuration values
- `jf config get` - Display current configuration
- `jf config path` - Show configuration file path
- `jf config list` - List all configured servers
- `jf config test` - Test connection to server

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

### Tasks

- `jf tasks list` - List all scheduled tasks
- `jf tasks get <taskId>` - Get task by ID
- `jf tasks run <taskId>` - Start a task
- `jf tasks stop <taskId>` - Stop a running task

### Playlists

- `jf playlists create <name>` - Create a playlist
- `jf playlists add <playlistId> <itemIds...>` - Add items
- `jf playlists remove <playlistId> <entryIds...>` - Remove items
- `jf playlists items <playlistId>` - List playlist items

### Live TV

- `jf livetv info` - Get Live TV info
- `jf livetv channels` - List channels
- `jf livetv programs` - List programs
- `jf livetv recordings` - List recordings
- `jf livetv timers` - List timers
- `jf livetv timer <timerId>` - Get timer by ID

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

## Agent/LLM Optimization

This CLI is designed to be easily used by AI agents and LLMs:

1. **Structured Output**: The default `toon` format provides consistent, parseable YAML output
2. **Type Information**: Every output includes a `type` field indicating the data structure
3. **Metadata**: Output includes timestamp, format version, and other metadata
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
