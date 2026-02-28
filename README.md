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

## Features

- **Full Jellyfin API Coverage**: All major API endpoints supported
- **Agent-Optimized**: Designed for LLM/AI agent integration with structured output
- **Toon Format**: Default YAML output format for easy parsing
- **Multiple Output Formats**: JSON, table, and raw formats available
- **Secure**: Credentials stored in user config directory, never committed
- **Type-Safe**: Full TypeScript implementation
- **Bun-Powered**: Fast package management and builds with Bun

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
jf config set --server URL --api-key KEY
jf config get
jf config list
jf config test
```

## Output Formats

- **toon** (default): YAML format optimized for LLM consumption
- **json**: Standard JSON output
- **table**: Human-readable table format
- **raw**: Raw output without formatting

## Commands

| Command | Description |
|---------|-------------|
| `jf config` | Manage CLI configuration |
| `jf system` | System commands (info, health, restart, shutdown) |
| `jf users` | User management |
| `jf items` | Item operations (list, search, get, refresh) |
| `jf sessions` | Session and playback control |
| `jf library` | Library management |
| `jf userdata` | User data (favorites, played status) |
| `jf tasks` | Scheduled task management |
| `jf playlists` | Playlist operations |
| `jf livetv` | Live TV commands |
| `jf discover` | Recommendations and discovery |

## Documentation

- [API Reference](docs/api.md)
- [Toon Output Format](docs/toon-format.md)
- [Full Documentation](docs/README.md)

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
```

## License

MIT
