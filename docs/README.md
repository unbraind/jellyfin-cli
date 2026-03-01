# Jellyfin CLI Documentation

## Overview

jellyfin-cli is an agent-optimized CLI tool for interacting with the Jellyfin media server API. It outputs structured data in the Toon format (YAML-based) by default, making it easy for LLMs to parse.

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

The CLI supports multiple output formats:

- **toon** (default): YAML-based format optimized for LLMs
- **json**: Standard JSON output
- **table**: Human-readable table format
- **raw**: Raw output without formatting

## Commands

### Setup & Configuration

- `jf setup` - Interactive setup wizard
- `jf setup status` - Check setup status
- `jf setup env` - Show environment variables
- `jf config set` - Set configuration values
- `jf config get` - Display current configuration
- `jf config path` - Show configuration file path
- `jf config list` - List all configured servers
- `jf config use <name>` - Switch to a named server configuration
- `jf config delete <name> --force` - Delete a server configuration
- `jf config reset --force` - Reset all configuration
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
- `jf users create <username>` - Create a new user
- `jf users update-password <userId>` - Update user password
- `jf users delete <userId> --force` - Delete a user

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
- `jf items filters` - Get available query filters

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
- `jf collections create <name>` - Create a new collection
- `jf collections add <collectionId> <itemIds...>` - Add items to collection
- `jf collections remove <collectionId> <itemIds...>` - Remove items from collection

### Tasks

- `jf tasks list` - List all scheduled tasks
- `jf tasks get <taskId>` - Get task by ID
- `jf tasks run <taskId>` - Start a task
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
- `jf livetv programs` - List programs
- `jf livetv recordings` - List recordings
- `jf livetv timers` - List timers
- `jf livetv timer <timerId>` - Get timer by ID
- `jf livetv create-timer` - Create a timer
- `jf livetv delete-timer <timerId>` - Delete a timer
- `jf livetv series-timers` - List series timers
- `jf livetv series-timer <id>` - Get series timer by ID
- `jf livetv delete-series-timer <id>` - Delete a series timer

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

This CLI is designed for AI agent integration:

1. **Structured Output**: Default `toon` format provides consistent YAML output
2. **Type Information**: Every output includes a `type` field
3. **Metadata**: Includes timestamp, format version
4. **Error Handling**: Errors in consistent format
5. **No Interactive Prompts**: All inputs via command-line arguments

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

## License

MIT
