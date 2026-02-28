# Jellyfin CLI

An agent-optimized CLI tool for interacting with the Jellyfin API.

## Installation

```bash
npm install -g jellyfin-cli
```

## Quick Start

```bash
# Configure connection
jf config set --server http://your-server:8096 --api-key YOUR_API_KEY

# Or use username/password authentication
jf config set --server http://your-server:8096 --username your-user --password your-password

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

Settings are stored in `~/.jellyfin-cli/settings.json`. This file should not be committed to version control.

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

### Configuration

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

### Items

- `jf items list` - List items
- `jf items get <itemId>` - Get item by ID
- `jf items latest` - Get latest items
- `jf items resume` - Get resume items
- `jf items search <term>` - Search for items
- `jf items similar <itemId>` - Get similar items
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

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Test with coverage
npm run test:coverage

# Type check
npm run typecheck

# Lint
npm run lint
```

## License

MIT
