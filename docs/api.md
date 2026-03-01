# API Reference

This document provides detailed information about the Jellyfin CLI commands and their options.

## Related Documentation

| Document | Description |
|----------|-------------|
| [README.md](README.md) | Documentation index and quick start |
| [toon-format.md](toon-format.md) | Output format specification |
| [agent-integration.md](agent-integration.md) | LLM/agent integration guide |
| [security.md](security.md) | Security best practices |
| [troubleshooting.md](troubleshooting.md) | Common issues and solutions |

## Global Options

| Option | Description |
|--------|-------------|
| `-f, --format <format>` | Output format (toon, json, table, raw) |
| `-s, --server <name>` | Server name from config |
| `-v, --version` | Show version number |
| | `-h, --help` | Show help |

## Output Types

Every command outputs structured data with a `type` field. Use `jf schema <type>` to get the JSON schema for any output type.

Common output types:
- `message` - Success/error messages
- `error` - Error responses
- `items` - List of media items
- `item` - Single item details
- `users` - List of users
- `user` - Single user details
- `sessions` - Active sessions
- `libraries` - Media libraries
- `tasks` - Scheduled tasks

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
| `-o, --output-format <format>` | Default output format (toon, json, table, raw) |
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

### config use

Switch to a named server configuration.

```bash
jf config use <name>
```

### config delete

Delete a server configuration.

```bash
jf config delete <name> --force
```

### config reset

Reset all configuration (clear settings file).

```bash
jf config reset --force
```

### config test

Test connection to Jellyfin server.

```bash
jf config test [--name <name>]
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



## system

System administration commands.

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

### system time

Get the server's current UTC time (useful for time synchronization).

```bash
jf system time [-f format]
```

Output type: `server_time`

### system config

Get the complete server configuration.

```bash
jf system config [-f format]
```

Output type: `server_config`

### system config-section

Get a named server configuration section.

```bash
jf system config-section <key> [-f format]
```

Output type: `config_section`

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

### users by-name

Get user by username.

```bash
jf users by-name <username> [-f format]
```

Output type: `user`

### users views

Get the library views for the current (or specified) user.

```bash
jf users views [--user <userId>] [-f format]
```

Output type: `user_views`

### users display-prefs

Get display preferences by preference ID.

```bash
jf users display-prefs <prefsId> [--user <userId>] [-f format]
```

Common preference IDs: `usersettings`, `movies`, `tvshows`

Output type: `display_prefs`

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

Output type: `items`

### items chapters

Get chapters for an item.

```bash
jf items chapters <itemId>
```

Output type: `chapters`

### items special-features

Get special features for an item.

```bash
jf items special-features <itemId>
```

Output type: `items`

### items trailers

Get local trailers for an item.

```bash
jf items trailers <itemId>
```

Output type: `items`

### items ancestors

Get parent items (ancestors) for an item.

```bash
jf items ancestors <itemId>
```

Output type: `items`

### items parts

Get additional parts for a video.

```bash
jf items parts <itemId>
```

Output type: `items`

### items playback-info

Get playback information for an item.

```bash
jf items playback-info <itemId>
```

Output type: `playback_info`

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

Output type: `stream_url`

### items audio-url

Get audio stream URL.

```bash
jf items audio-url <itemId> [options]
```

| Option | Description |
|--------|-------------|
| `--media-source <id>` | Media source ID |
| `--audio-stream <index>` | Audio stream index |
| `--max-bitrate <bps>` | Max streaming bitrate |

Output type: `audio_url`

### items image-url

Get image URL for an item.

```bash
jf items image-url <itemId> [options]
```

| Option | Description |
|--------|-------------|
| `--max-width <pixels>` | Max width |
| `--max-height <pixels>` | Max height |

Output type: `image_url`

### items subtitle-url

Get subtitle URL.

```bash
jf items subtitle-url <itemId> <mediaSourceId> <streamIndex> [--format-type <format>]
```

| Option | Description |
|--------|-------------|
| `--format-type <format>` | Subtitle format (srt, vtt, ass) |

Output type: `subtitle_url`

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

Output type: `message`

### items delete

Delete an item.

```bash
jf items delete <itemId> --force
```

Output type: `message`

### items update

Update item metadata.

```bash
jf items update <itemId> [options]
```

| Option | Description |
|--------|-------------|
| `--name <name>` | Item name |
| `--overview <text>` | Item overview/description |
| `--genres <genres>` | Genres (comma-separated) |
| `--tags <tags>` | Tags (comma-separated) |
| `--studios <studios>` | Studios (comma-separated) |
| `--year <year>` | Production year |
| `--rating <rating>` | Official rating (e.g., PG, R) |
| `--community-rating <rating>` | Community rating (0-10) |
| `--premiere-date <date>` | Premiere date (YYYY-MM-DD) |
| `--sort-name <name>` | Sort name |
| `--trailer-url <url>` | Trailer URL |

Output type: `message`

### items filters

Get available query filters for a library.

```bash
jf items filters [options]
```

| Option | Description |
|--------|-------------|
| `--parent <id>` | Parent ID (library) |
| `--types <types>` | Item types (comma-separated) |

Output type: `filters`

### items identify

Search remote metadata providers for matches for an item. Read-only — does not modify any data.

```bash
jf items identify <itemId> [options]
```

| Option | Description |
|--------|-------------|
| `--type <type>` | Item type override (Movie, Series, Episode, etc.) |
| `--name <name>` | Name override for search |
| `--year <year>` | Production year override |
| `--provider <name>` | Specific metadata provider |

Output type: `identify_results`

### items apply-match

Apply a remote metadata search result to an item.

```bash
jf items apply-match <itemId> [options]
```

| Option | Description |
|--------|-------------|
| `--provider <name>` | Metadata provider name |
| `--replace-images` | Replace all images with provider images |
| `--provider-ids <json>` | Provider IDs as JSON (e.g. '{"Tmdb":"12345"}') |

Output type: `message`

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

### sessions volume

Set volume level.

```bash
jf sessions volume <sessionId> <level>
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

### library virtual-folders

List all virtual folders (library sources) with their configured media paths.

```bash
jf library virtual-folders [-f format]
```

Output type: `virtual_folders`

### library add-folder

Add a new virtual folder (library source).

```bash
jf library add-folder [options]
```

| Option | Description |
|--------|-------------|
| `--name <name>` | Folder name (required) |
| `--type <type>` | Collection type (movies, tvshows, music, books, mixed) |
| `--paths <paths>` | Comma-separated media paths |
| `--refresh` | Refresh library after adding |

Output type: `message`

### library remove-folder

Remove a virtual folder.

```bash
jf library remove-folder <name> --force [--refresh] [-f format]
```

Output type: `message`

### library rename-folder

Rename a virtual folder.

```bash
jf library rename-folder <name> <newName> [--refresh] [-f format]
```

Output type: `message`

### library add-path

Add a media path to a virtual folder.

```bash
jf library add-path <folderName> <path> [--network-path <path>] [--refresh] [-f format]
```

Output type: `message`

### library remove-path

Remove a media path from a virtual folder.

```bash
jf library remove-path <folderName> <path> [--refresh] [-f format]
```

Output type: `message`

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

## favorites

Favorites commands.

### favorites list

List favorite items.

```bash
jf favorites list [options]
```

| Option | Description |
|--------|-------------|
| `--types <types>` | Item types (comma-separated) |
| `--limit <number>` | Limit (default: 50) |
| `--offset <number>` | Offset (default: 0) |

Output type: `items`

### favorites add

Add item to favorites.

```bash
jf favorites add <itemId> [--user <userId>]
```

### favorites remove

Remove item from favorites.

```bash
jf favorites remove <itemId> [--user <userId>]
```

## collections

Collection commands.

### collections list

List all collections (box sets).

```bash
jf collections list [--limit <number>]
```

Output type: `items`

### collections get

Get collection details.

```bash
jf collections get <collectionId>
```

Output type: `item`

### collections items

List items in a collection.

```bash
jf collections items <collectionId> [--limit <number>]
```

Output type: `items`

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

## syncplay

SyncPlay commands for synchronized playback.

### syncplay list

List SyncPlay groups.

```bash
jf syncplay list
```

Output type: `syncplay_groups`

### syncplay join

Join a SyncPlay group.

```bash
jf syncplay join <groupId>
```

### syncplay leave

Leave current SyncPlay group.

```bash
jf syncplay leave
```

### syncplay pause

Pause SyncPlay group playback.

```bash
jf syncplay pause
```

### syncplay unpause

Resume SyncPlay group playback.

```bash
jf syncplay unpause
```

### syncplay stop

Stop SyncPlay group playback.

```bash
jf syncplay stop
```

## quickconnect

Quick Connect authentication commands.

### quickconnect status

Check if Quick Connect is enabled.

```bash
jf quickconnect status
```

Output type: `quickconnect_status`

### quickconnect init

Initialize Quick Connect.

```bash
jf quickconnect init
```

Output type: `quickconnect_init`

### quickconnect check

Check Quick Connect status.

```bash
jf quickconnect check <secret>
```

Output type: `quickconnect_status`

### quickconnect authorize

Authorize Quick Connect request.

```bash
jf quickconnect authorize <code> [--user <userId>]
```

## backup

Backup management commands.

### backup list

List available backups.

```bash
jf backup list
```

Output type: `backups`

### backup create

Create a backup.

```bash
jf backup create
```

### backup restore

Restore from a backup.

```bash
jf backup restore <backupPath>
```

### backup delete

Delete a backup.

```bash
jf backup delete <backupPath> --force
```

## subtitles

Subtitle management commands.

### subtitles search

Search for remote subtitles.

```bash
jf subtitles search <itemId> <language> [--perfect]
```

Output type: `subtitles`

### subtitles download

Download a remote subtitle.

```bash
jf subtitles download <itemId> <subtitleId>
```

### subtitles delete

Delete a subtitle track.

```bash
jf subtitles delete <itemId> <index> --force
```

### subtitles providers

List subtitle providers.

```bash
jf subtitles providers
```

Output type: `subtitle_providers`

## media

Media commands for segments, lyrics, and more.

### media segments

Get media segments for an item.

```bash
jf media segments <itemId>
```

Output type: `media_segments`

### media lyrics

Get lyrics for an audio item.

```bash
jf media lyrics <itemId>
```

Output type: `lyrics`

### media theme-songs

Get theme songs for an item.

```bash
jf media theme-songs <itemId> [--inherit]
```

Output type: `theme_songs`

### media theme-videos

Get theme videos for an item.

```bash
jf media theme-videos <itemId> [--inherit]
```

Output type: `theme_videos`

### media external-ids

Get external ID info for an item.

```bash
jf media external-ids <itemId>
```

Output type: `external_ids`

### media remote-images

Get available remote images for an item.

```bash
jf media remote-images <itemId> [--type <type>] [--limit <number>]
```

Output type: `remote_images`

### media download-image

Download a remote image to an item.

```bash
jf media download-image <itemId> [--type <type>] [--url <url>]
```

### media hls-url

Get HLS master playlist URL.

```bash
jf media hls-url <itemId> [--media-source <id>] [--audio-stream <index>] [--subtitle-stream <index>] [--max-bitrate <bps>]
```

Output type: `hls_url`

## localization

Localization commands.

### localization options

Get localization options.

```bash
jf localization options
```

Output type: `localization_options`

### localization countries

Get available countries.

```bash
jf localization countries
```

Output type: `countries`

### localization cultures

Get available cultures/languages.

```bash
jf localization cultures
```

Output type: `cultures`

### localization ratings

Get parental rating systems.

```bash
jf localization ratings
```

Output type: `rating_systems`

## environment

Environment and system info commands.

### environment drives

Get available drives.

```bash
jf environment drives
```

Output type: `drives`

### environment logs

Get list of log files.

```bash
jf environment logs
```

Output type: `log_files`

### environment log

Get log file content.

```bash
jf environment log <name> [--lines <number>]
```

Output type: `log_content`

### environment storage

Get system storage info.

```bash
jf environment storage
```

Output type: `storage_info`

## tvshows

TV Shows commands.

### tvshows episodes

Get episodes for a TV series.

```bash
jf tvshows episodes <seriesId> [options]
```

| Option | Description |
|--------|-------------|
| `--season <number>` | Filter by season number |
| `--season-id <id>` | Filter by season ID |
| `--limit <number>` | Limit (default: 50) |
| `--offset <number>` | Offset (default: 0) |
| `--missing` | Include missing episodes |
| `--sort <field>` | Sort field |

Output type: `items`

### tvshows seasons

Get seasons for a TV series.

```bash
jf tvshows seasons <seriesId> [--specials]
```

Output type: `seasons`

### tvshows next-up

Get next up episodes.

```bash
jf tvshows next-up [options]
```

| Option | Description |
|--------|-------------|
| `--series <id>` | Filter by series ID |
| `--parent <id>` | Parent ID |
| `--limit <number>` | Limit (default: 25) |

Output type: `items`

### tvshows upcoming

Get upcoming episodes.

```bash
jf tvshows upcoming [--parent <id>] [--limit <number>]
```

Output type: `items`

## packages

Package management commands.

### packages list

List available packages (plugins).

```bash
jf packages list
```

Output type: `packages`

### packages get

Get package details.

```bash
jf packages get <packageId>
```

Output type: `package`

### packages install

Install a package.

```bash
jf packages install <packageId> [--version <version>] [--repository <url>]
```

### packages cancel

Cancel a package installation.

```bash
jf packages cancel <installationId>
```

### packages installing

List currently installing packages.

```bash
jf packages installing
```

Output type: `installing_packages`

### packages repositories

List plugin repositories.

```bash
jf packages repositories
```

Output type: `repositories`

## images

Image management commands.

### images list

List images for an item.

```bash
jf images list <itemId>
```

Output type: `item_images`

### images url

Get image URL.

```bash
jf images url <itemId> <imageType> [options]
```

| Option | Description |
|--------|-------------|
| `--max-width <pixels>` | Max width |
| `--max-height <pixels>` | Max height |
| `--quality <number>` | Quality (0-100) |
| `--index <number>` | Image index |

Output type: `image_url`

### images delete

Delete an image from an item.

```bash
jf images delete <itemId> <imageType> [--index <number>] --force
```

### images user

Get user profile image URL.

```bash
jf images user <userId> [--max-width <pixels>] [--max-height <pixels>]
```

Output type: `user_image_url`

### images delete-user

Delete user profile image.

```bash
jf images delete-user <userId> --force
```

## suggestions

Content suggestions commands.

### suggestions get

Get content suggestions.

```bash
jf suggestions get [--parent <id>] [--limit <number>]
```

Output type: `items`

## years

Browse content by year.

### years list

List all years.

```bash
jf years list [--parent <id>] [--limit <number>] [--sort <field>] [--order <direction>]
```

Output type: `years`

### years get

Get items for a specific year.

```bash
jf years get <year>
```

Output type: `item`

## music-genres

Music genre commands.

### music-genres list

List all music genres.

```bash
jf music-genres list [--parent <id>] [--limit <number>]
```

Output type: `items`

### music-genres get

Get music genre by name.

```bash
jf music-genres get <name>
```

Output type: `item`

## trickplay

Trickplay (video scrubbing preview) commands.

### trickplay hls-url

Get trickplay HLS playlist URL.

```bash
jf trickplay hls-url <itemId> <width> [--media-source <id>]
```

Output type: `trickplay_hls_url`

### trickplay tile-url

Get trickplay tile image URL.

```bash
jf trickplay tile-url <itemId> <width> <index> [--media-source <id>]
```

Output type: `trickplay_tile_url`

## channels

Channel commands.

### channels list

List all channels.

```bash
jf channels list [--limit <number>] [--supports-latest]
```

Output type: `items`

### channels features

Get channel features (all or for specific channel).

```bash
jf channels features [channelId]
```

Output type: `channel_features`

### channels items

Get items from a channel.

```bash
jf channels items <channelId> [--folder <id>] [--limit <number>] [--offset <number>] [--sort <field>] [--order <direction>]
```

Output type: `items`

### channels latest

Get latest items from a channel.

```bash
jf channels latest <channelId> [--limit <number>]
```

Output type: `items`

## collections

Collection commands.

### collections list

List all collections (box sets).

```bash
jf collections list [--limit <number>]
```

Output type: `items`

### collections get

Get collection details.

```bash
jf collections get <collectionId>
```

Output type: `item`

### collections items

List items in a collection.

```bash
jf collections items <collectionId> [--limit <number>]
```

Output type: `items`

### collections create

Create a new collection.

```bash
jf collections create <name> [--items <ids>] [--parent <id>]
```

| Option | Description |
|--------|-------------|
| `--items <ids>` | Item IDs to add (comma-separated) |
| `--parent <id>` | Parent folder ID |

Output type: `message`

### collections add

Add items to a collection.

```bash
jf collections add <collectionId> <itemIds...>
```

Output type: `message`

### collections remove

Remove items from a collection.

```bash
jf collections remove <collectionId> <itemIds...>
```

Output type: `message`

## livetv

Live TV commands.

### livetv info

Get Live TV info.

```bash
jf livetv info
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

### livetv create-timer

Create a Live TV timer.

```bash
jf livetv create-timer --channel <id> --name <name> --start <date> --end <date> [--program <id>] [--pre-padding <seconds>] [--post-padding <seconds>]
```

| Option | Description |
|--------|-------------|
| `--channel <id>` | Channel ID (required) |
| `--name <name>` | Timer name (required) |
| `--start <date>` | Start date in ISO format (required) |
| `--end <date>` | End date in ISO format (required) |
| `--program <id>` | Program ID |
| `--pre-padding <seconds>` | Pre-padding seconds (default: 60) |
| `--post-padding <seconds>` | Post-padding seconds (default: 300) |

Output type: `message`

### livetv delete-timer

Delete a Live TV timer.

```bash
jf livetv delete-timer <timerId>
```

Output type: `message`

### livetv series-timers

List Live TV series timers.

```bash
jf livetv series-timers
```

Output type: `items`

### livetv series-timer

Get Live TV series timer by ID.

```bash
jf livetv series-timer <id>
```

Output type: `item`

### livetv delete-series-timer

Delete a Live TV series timer.

```bash
jf livetv delete-series-timer <id>
```

Output type: `message`

## playlists

Playlist commands.

### playlists create

Create a new playlist.

```bash
jf playlists create <name> [--items <ids>] [--media-type <type>]
```

| Option | Description |
|--------|-------------|
| `--items <ids>` | Initial item IDs (comma-separated) |
| `--media-type <type>` | Media type |

Output type: `message`

### playlists add

Add items to a playlist.

```bash
jf playlists add <playlistId> <itemIds...>
```

Output type: `message`

### playlists remove

Remove items from a playlist.

```bash
jf playlists remove <playlistId> <entryIds...>
```

Output type: `message`

### playlists items

List items in a playlist.

```bash
jf playlists items <playlistId> [--limit <number>] [--offset <number>]
```

Output type: `items`

### playlists delete

Delete a playlist.

```bash
jf playlists delete <playlistId>
```

Output type: `message`

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

Output type: `message`

### tasks stop

Stop a running task.

```bash
jf tasks stop <taskId>
```

Output type: `message`

### tasks triggers

List task triggers.

```bash
jf tasks triggers <taskId>
```

Output type: `task_triggers`

### tasks add-trigger

Add a task trigger.

```bash
jf tasks add-trigger <taskId> --type <type> [--interval <ticks>] [--time <ticks>] [--days <days>]
```

| Option | Description |
|--------|-------------|
| `--type <type>` | Trigger type (DailyTrigger, WeeklyTrigger, IntervalTrigger, StartupTrigger) |
| `--interval <ticks>` | Interval in ticks (for IntervalTrigger) |
| `--time <ticks>` | Time of day in ticks (for DailyTrigger/WeeklyTrigger) |
| `--days <days>` | Days of week (comma-separated, for WeeklyTrigger) |

Output type: `message`

### tasks delete-trigger

Delete a task trigger.

```bash
jf tasks delete-trigger <taskId> <triggerId>
```

Output type: `message`

## artists

Commands for browsing music artists.

### artists list

List music artists.

```bash
jf artists list [options]
```

| Option | Description |
|--------|-------------|
| `--parent <id>` | Parent library ID |
| `--limit <number>` | Limit (default: 50) |
| `--sort <field>` | Sort field (e.g. SortName) |
| `--order <direction>` | Sort order (Ascending/Descending) |

Output type: `items`

### artists album-artists

List album artists.

```bash
jf artists album-artists [options]
```

Same options as `artists list`.

Output type: `items`

### artists get

Get an artist by name.

```bash
jf artists get <name> [-f format]
```

Output type: `item`

## videos

Commands for managing video versions.

### videos parts

List all parts/versions of a video item.

```bash
jf videos parts <itemId> [-f format]
```

Output type: `items`

### videos merge-versions

Merge multiple versions of a video into one item (admin, non-destructive metadata merge).

```bash
jf videos merge-versions <itemId1> <itemId2> [...] --force [-f format]
```

| Option | Description |
|--------|-------------|
| `--force` | Required to confirm the merge |

Output type: `message`

### videos delete-alternates

Delete all alternate sources (non-primary versions) for a video item.

```bash
jf videos delete-alternates <itemId> --force [-f format]
```

| Option | Description |
|--------|-------------|
| `--force` | Required to confirm deletion |

Output type: `message`

## system time

Get the server's current UTC time.

```bash
jf system time [-f format]
```

Output type: `server_time`

## system config

Get the server configuration.

```bash
jf system config [-f format]
```

Output type: `server_config`

## system config-section

Get a named configuration section.

```bash
jf system config-section <key> [-f format]
```

Output type: `config_section`

## users views

Get the library views for the current user.

```bash
jf users views [--user <userId>] [-f format]
```

Output type: `user_views`

## users display-prefs

Get display preferences by preference ID (e.g. usersettings).

```bash
jf users display-prefs <prefsId> [--user <userId>] [-f format]
```

Output type: `display_prefs`

## items identify

Search remote metadata providers for matches for an item.

```bash
jf items identify <itemId> [options]
```

| Option | Description |
|--------|-------------|
| `--type <type>` | Item type (Movie, Series, Episode, etc.) |
| `--name <name>` | Override item name for search |
| `--year <year>` | Override production year for search |
| `--provider <name>` | Specific metadata provider |

Output type: `identify_results`

## items apply-match

Apply a remote metadata search result to an item.

```bash
jf items apply-match <itemId> [options]
```

| Option | Description |
|--------|-------------|
| `--provider <name>` | Metadata provider name |
| `--replace-images` | Replace all images |
| `--provider-ids <json>` | Provider IDs as JSON object |

Output type: `message`

## library virtual-folders

List all virtual folders (library sources) with their paths.

```bash
jf library virtual-folders [-f format]
```

Output type: `virtual_folders`

## library add-folder

Add a new virtual folder (library source).

```bash
jf library add-folder [options]
```

| Option | Description |
|--------|-------------|
| `--name <name>` | Folder name (required) |
| `--type <type>` | Collection type (movies, tvshows, music, books, mixed) |
| `--paths <paths>` | Media paths (comma-separated) |
| `--refresh` | Refresh library after adding |

Output type: `message`

## library remove-folder

Remove a virtual folder by name.

```bash
jf library remove-folder <name> --force [--refresh] [-f format]
```

Output type: `message`

## library rename-folder

Rename a virtual folder.

```bash
jf library rename-folder <name> <newName> [--refresh] [-f format]
```

Output type: `message`

## library add-path

Add a media path to an existing virtual folder.

```bash
jf library add-path <folderName> <path> [--network-path <path>] [--refresh] [-f format]
```

Output type: `message`

## library remove-path

Remove a media path from a virtual folder.

```bash
jf library remove-path <folderName> <path> [--refresh] [-f format]
```

Output type: `message`

## schema

JSON Schema commands for LLM/Agent integration.

### schema

Output JSON schema for all Toon format types.

```bash
jf schema [--format <format>]
```

Output type: `schema`

### schema list

List all available output types.

```bash
jf schema list
```

Output type: `output_types`

### schema <type>

Output JSON schema for a specific output type.

```bash
jf schema <type>
```

Available types: `message`, `error`, `system_info`, `users`, `user`, `items`, `item`, `sessions`, `session`, `libraries`, `tasks`, `search_result`, `plugins`, `config`

Output type: `schema`
