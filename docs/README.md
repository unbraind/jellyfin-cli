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

```bash
# Use different formats
jf users list --format json
jf library list --format table
jf system info --format raw
```

## Command Categories

### Setup & Configuration

| Command | Description |
|---------|-------------|
| `jf setup` | Interactive setup wizard |
| `jf setup status` | Check setup status |
| `jf setup env` | Show environment variables |
| `jf config set` | Set configuration values |
| `jf config get` | Display current configuration |
| `jf config path` | Show configuration file path |
| `jf config list` | List all configured servers |
| `jf config use <name>` | Switch to a named server |
| `jf config delete <name>` | Delete a server configuration |
| `jf config reset` | Reset all configuration |
| `jf config test` | Test connection to server |

### System Administration

| Command | Description |
|---------|-------------|
| `jf system info` | Get system information |
| `jf system health` | Check server health |
| `jf system restart` | Restart the server |
| `jf system shutdown` | Shutdown the server |
| `jf system activity` | Get activity log |
| `jf backup list` | List backups |
| `jf backup create` | Create a backup |
| `jf backup restore <path>` | Restore from backup |
| `jf tasks list` | List scheduled tasks |
| `jf tasks run <taskId>` | Run a task |

### User Management

| Command | Description |
|---------|-------------|
| `jf users list` | List all users |
| `jf users get <userId>` | Get user by ID |
| `jf users me` | Get current user info |
| `jf users create <username>` | Create a new user |
| `jf users update-password <userId>` | Update user password |
| `jf users policy <userId>` | Get user policy |
| `jf users update-policy <userId>` | Update user permissions |
| `jf users config <userId>` | Get user configuration |
| `jf users update-config <userId>` | Update user preferences |

### Content Management

| Command | Description |
|---------|-------------|
| `jf library list` | List all libraries |
| `jf library refresh` | Refresh all libraries |
| `jf items list` | List items with filters |
| `jf items search <term>` | Search for items |
| `jf items get <itemId>` | Get item details |
| `jf items update <itemId>` | Update item metadata |
| `jf items delete <itemId>` | Delete an item |
| `jf items refresh <itemId>` | Refresh item metadata |

### Playback Control

| Command | Description |
|---------|-------------|
| `jf sessions list` | List active sessions |
| `jf sessions play <sessionId> <itemIds>` | Play items |
| `jf sessions pause <sessionId>` | Pause playback |
| `jf sessions stop <sessionId>` | Stop playback |
| `jf sessions seek <sessionId> <ticks>` | Seek to position |
| `jf sessions volume <sessionId> <level>` | Set volume |

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
