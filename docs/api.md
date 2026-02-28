# API Reference

This document provides detailed information about the Jellyfin CLI commands and their options.

## Global Options

| Option | Description |
|--------|-------------|
| `-f, --format <format>` | Output format (toon, json, table, raw) |
| `-s, --server <name>` | Server name from config |
| `-v, --version` | Show version number |
| `-h, --help` | Show help |

## setup

Interactive setup wizard for configuring the CLI.

### setup

Configure the CLI with server URL and credentials.

```bash
jf setup [options]
```

| Option | Description |
|--------|-------------|
| `--server <url>` | Jellyfin server URL |
| `--api-key <key>` | API key |
| `--username <username>` | Username |
| `--password <password>` | Password |
| `--name <name>` | Server name for this config |
| `--default` | Set as default server |

### setup status

Check current setup status.

```bash
jf setup status
```

Output type: `setup_status`

### setup env

Show environment variable names for configuration.

```bash
jf setup env
```

## config

Manage CLI configuration.

### config set

Set configuration values.

```bash
jf config set [options]
```

| Option | Description |
|--------|-------------|
| `-s, --server <url>` | Jellyfin server URL |
| `-k, --api-key <key>` | API key |
| `-u, --username <username>` | Username |
| `-p, --password <password>` | Password |
| `--user-id <id>` | User ID |
| `-f, --format <format>` | Default output format |
| `--timeout <ms>` | Request timeout |
| `--name <name>` | Server name |
| `--default` | Set as default server |

### config get

Display current configuration.

```bash
jf config get [--name <name>]
```

### config path

Show configuration file path.

```bash
jf config path
```

### config list

List all configured servers.

```bash
jf config list
```

### config test

Test connection to Jellyfin server.

```bash
jf config test [--name <name>]
```

## system

System commands.

### system info

Get system information.

```bash
jf system info [-f format]
```

Output type: `system_info`

### system health

Check server health.

```bash
jf system health [-f format]
```

### system restart

Restart the Jellyfin server.

```bash
jf system restart --force [-f format]
```

### system shutdown

Shutdown the Jellyfin server.

```bash
jf system shutdown --force [-f format]
```

### system activity

Get activity log.

```bash
jf system activity [options]
```

| Option | Description |
|--------|-------------|
| `--limit <number>` | Number of entries (default: 50) |
| `--start <number>` | Start index (default: 0) |
| `--min-date <date>` | Minimum date (ISO format) |
| `--has-user` | Only show entries with user ID |

Output type: `activity_log`

## users

User management commands.

### users list

List all users.

```bash
jf users list [-f format]
```

Output type: `users`

### users get

Get user by ID.

```bash
jf users get <userId> [-f format]
```

Output type: `user`

### users me

Get current user info.

```bash
jf users me [-f format]
```

Output type: `user`

## items

Item commands.

### items list

List items.

```bash
jf items list [options]
```

| Option | Description |
|--------|-------------|
| `--parent <id>` | Parent ID |
| `--types <types>` | Item types (comma-separated) |
| `--genres <genres>` | Genres (comma-separated) |
| `--years <years>` | Years (comma-separated) |
| `--search <term>` | Search term |
| `--limit <number>` | Limit (default: 50) |
| `--offset <number>` | Offset (default: 0) |
| `--sort <field>` | Sort field |
| `--order <direction>` | Sort order |
| `--recursive` | Recursive search |
| `--favorites` | Show only favorites |
| `--played` | Show only played items |
| `--unplayed` | Show only unplayed items |

Output type: `items`

### items get

Get item by ID.

```bash
jf items get <itemId> [-f format]
```

Output type: `item`

### items latest

Get latest items.

```bash
jf items latest [--parent <id>] [--limit <number>]
```

Output type: `items`

### items resume

Get resume items.

```bash
jf items resume [--parent <id>] [--limit <number>]
```

Output type: `items`

### items search

Search for items.

```bash
jf items search <term> [options]
```

| Option | Description |
|--------|-------------|
| `--limit <number>` | Limit (default: 20) |
| `--types <types>` | Item types (comma-separated) |

Output type: `search_result`

### items similar

Get similar items.

```bash
jf items similar <itemId> [--limit <number>]
```

Output type: `items`

### items intros

Get intro videos for an item.

```bash
jf items intros <itemId>
```

### items chapters

Get chapters for an item.

```bash
jf items chapters <itemId>
```

### items special-features

Get special features for an item.

```bash
jf items special-features <itemId>
```

### items trailers

Get local trailers for an item.

```bash
jf items trailers <itemId>
```

### items ancestors

Get parent items (ancestors) for an item.

```bash
jf items ancestors <itemId>
```

### items parts

Get additional parts for a video.

```bash
jf items parts <itemId>
```

### items playback-info

Get playback information for an item.

```bash
jf items playback-info <itemId>
```

### items stream-url

Get stream URL for a video.

```bash
jf items stream-url <itemId> [options]
```

| Option | Description |
|--------|-------------|
| `--media-source <id>` | Media source ID |
| `--audio-stream <index>` | Audio stream index |
| `--subtitle-stream <index>` | Subtitle stream index |
| `--max-bitrate <bps>` | Max streaming bitrate |

### items refresh

Refresh item metadata.

```bash
jf items refresh <itemId> [options]
```

| Option | Description |
|--------|-------------|
| `--recursive` | Refresh recursively |
| `--replace-metadata` | Replace all metadata |
| `--replace-images` | Replace all images |

### items delete

Delete an item.

```bash
jf items delete <itemId> --force
```

## sessions

Session and playback commands.

### sessions list

List all active sessions.

```bash
jf sessions list [-f format]
```

Output type: `sessions`

### sessions get

Get session by ID.

```bash
jf sessions get <sessionId> [-f format]
```

Output type: `session`

### sessions play

Send play command to session.

```bash
jf sessions play <sessionId> <itemIds...> [options]
```

| Option | Description |
|--------|-------------|
| `--next` | Add to play next |
| `--last` | Add to play last |
| `--shuffle` | Shuffle and play |
| `--position <ticks>` | Start position in ticks |

### sessions pause

Pause playback.

```bash
jf sessions pause <sessionId>
```

### sessions unpause

Resume playback.

```bash
jf sessions unpause <sessionId>
```

### sessions stop

Stop playback.

```bash
jf sessions stop <sessionId>
```

### sessions next

Skip to next track.

```bash
jf sessions next <sessionId>
```

### sessions previous

Go to previous track.

```bash
jf sessions previous <sessionId>
```

### sessions seek

Seek to position.

```bash
jf sessions seek <sessionId> <ticks>
```

### sessions mute

Mute audio.

```bash
jf sessions mute <sessionId>
```

### sessions unmute

Unmute audio.

```bash
jf sessions unmute <sessionId>
```

### sessions message

Send message to session.

```bash
jf sessions message <sessionId> --header <text> --text <text> [--timeout <ms>]
```

## library

Library commands.

### library list

List all libraries.

```bash
jf library list [-f format]
```

Output type: `libraries`

### library refresh

Refresh all libraries.

```bash
jf library refresh [options]
```

| Option | Description |
|--------|-------------|
| `--recursive` | Refresh recursively |
| `--replace-metadata` | Replace all metadata |
| `--replace-images` | Replace all images |

### library genres

List all genres.

```bash
jf library genres [--parent <id>]
```

Output type: `items`

### library studios

List all studios.

```bash
jf library studios [--parent <id>]
```

Output type: `items`

### library persons

List all persons.

```bash
jf library persons [--parent <id>] [--limit <number>]
```

Output type: `items`

### library artists

List all artists.

```bash
jf library artists [--parent <id>] [--limit <number>]
```

Output type: `items`

### library album-artists

List all album artists.

```bash
jf library album-artists [--parent <id>] [--limit <number>]
```

Output type: `items`

## userdata

User data commands.

### userdata favorite

Mark item as favorite.

```bash
jf userdata favorite <itemId> [--user <userId>]
```

### userdata unfavorite

Remove item from favorites.

```bash
jf userdata unfavorite <itemId> [--user <userId>]
```

### userdata played

Mark item as played.

```bash
jf userdata played <itemId> [--user <userId>] [--date <date>]
```

### userdata unplayed

Mark item as unplayed.

```bash
jf userdata unplayed <itemId> [--user <userId>]
```

### userdata like

Like an item.

```bash
jf userdata like <itemId> [--user <userId>]
```

### userdata dislike

Dislike an item.

```bash
jf userdata dislike <itemId> [--user <userId>]
```

### userdata unrate

Remove rating from item.

```bash
jf userdata unrate <itemId> [--user <userId>]
```

## tasks

Scheduled task commands.

### tasks list

List all scheduled tasks.

```bash
jf tasks list [--hidden]
```

Output type: `tasks`

### tasks get

Get task by ID.

```bash
jf tasks get <taskId>
```

Output type: `task`

### tasks run

Start a scheduled task.

```bash
jf tasks run <taskId>
```

### tasks stop

Stop a running task.

```bash
jf tasks stop <taskId>
```

## playlists

Playlist commands.

### playlists create

Create a new playlist.

```bash
jf playlists create <name> [--items <ids>] [--media-type <type>]
```

### playlists add

Add items to a playlist.

```bash
jf playlists add <playlistId> <itemIds...>
```

### playlists remove

Remove items from a playlist.

```bash
jf playlists remove <playlistId> <entryIds...>
```

### playlists items

List items in a playlist.

```bash
jf playlists items <playlistId> [--limit <number>] [--offset <number>]
```

Output type: `items`

## livetv

Live TV commands.

### livetv info

Get Live TV info.

```bash
jf livetv info [-f format]
```

Output type: `live_tv_info`

### livetv channels

List Live TV channels.

```bash
jf livetv channels [--limit <number>] [--offset <number>]
```

Output type: `items`

### livetv programs

List Live TV programs.

```bash
jf livetv programs [options]
```

| Option | Description |
|--------|-------------|
| `--channel <id>` | Channel ID |
| `--limit <number>` | Limit |
| `--offset <number>` | Offset |
| `--min-date <date>` | Minimum start date |
| `--max-date <date>` | Maximum start date |
| `--aired` | Only show programs that have aired |

Output type: `items`

### livetv recordings

List Live TV recordings.

```bash
jf livetv recordings [--limit <number>] [--offset <number>]
```

Output type: `items`

### livetv timers

List Live TV timers.

```bash
jf livetv timers [--channel <id>]
```

Output type: `items`

### livetv timer

Get Live TV timer by ID.

```bash
jf livetv timer <timerId>
```

Output type: `item`

## discover

Discovery commands.

### discover recommendations

Get recommendations.

```bash
jf discover recommendations [--categories <number>] [--items <number>]
```

Output type: `recommendations`

### discover mix

Get instant mix for an item.

```bash
jf discover mix <itemId> [--limit <number>]
```

Output type: `items`

## plugins

Plugin management commands.

### plugins list

List all installed plugins.

```bash
jf plugins list
```

Output type: `plugins`

### plugins get

Get plugin details.

```bash
jf plugins get <pluginId>
```

Output type: `plugin`

### plugins config

Get plugin configuration.

```bash
jf plugins config <pluginId>
```

Output type: `plugin_config`

### plugins uninstall

Uninstall a plugin.

```bash
jf plugins uninstall <pluginId> --force
```

## devices

Device management commands.

### devices list

List all devices.

```bash
jf devices list
```

Output type: `devices`

### devices get

Get device details.

```bash
jf devices get <deviceId>
```

Output type: `device`

### devices rename

Set custom device name.

```bash
jf devices rename <deviceId> <name>
```

### devices delete

Delete a device.

```bash
jf devices delete <deviceId> --force
```

## branding

Branding commands.

### branding get

Get branding configuration.

```bash
jf branding get
```

Output type: `branding`

## stats

Statistics commands.

### stats counts

Get library item counts.

```bash
jf stats counts
```

Output type: `item_counts`

## apikeys

API key management commands.

### apikeys list

List all API keys.

```bash
jf apikeys list
```

Output type: `api_keys`

### apikeys create

Create a new API key.

```bash
jf apikeys create <app>
```

Output type: `api_key`

### apikeys delete

Delete an API key.

```bash
jf apikeys delete <key> --force
```

## notifications

Notification commands.

### notifications types

List notification types.

```bash
jf notifications types
```

Output type: `notification_types`

### notifications list

List user notifications.

```bash
jf notifications list [--user <userId>]
```

Output type: `notifications`

### notifications send

Send admin notification.

```bash
jf notifications send --name <name> [--description <text>] [--url <url>] [--level <level>]
```
