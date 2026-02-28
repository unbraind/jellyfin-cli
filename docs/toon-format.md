# Toon Output Format

The Toon format is the default output format for jellyfin-cli, designed for optimal parsing by LLMs and AI agents.

## Overview

Toon is a YAML-based structured output format that provides:

- **Type Information**: Every output includes a `type` field
- **Consistent Structure**: Predictable data organization
- **Metadata**: Timestamp, format version, and other context
- **Human Readable**: YAML format is easy to read and debug

## Structure

```yaml
type: <output_type>
data:
  <structured_data>
meta:
  timestamp: <ISO_8601_timestamp>
  format: toon
  version: <semver>
```

## Output Types

### message

Success/error messages.

```yaml
type: message
data:
  message: "Operation completed successfully"
  success: true
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### error

Error responses.

```yaml
type: error
data:
  error: "Item not found"
  code: 404
  details:
    itemId: "abc123"
  success: false
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### system_info

Server system information.

```yaml
type: system_info
data:
  name: "My Jellyfin Server"
  version: "10.8.13"
  id: "abc123..."
  local_address: "http://192.168.1.100:8096"
  operating_system: "Linux"
  has_pending_restart: false
  can_self_restart: true
  web_socket_port: 8096
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### users

List of users.

```yaml
type: users
data:
  - id: "user-1"
    name: "admin"
    is_admin: true
    is_disabled: false
    is_hidden: false
    last_login: "2024-01-01T00:00:00.000Z"
    has_password: true
  - id: "user-2"
    name: "viewer"
    is_admin: false
    is_disabled: false
    is_hidden: false
    last_login: null
    has_password: false
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### user

Single user details.

```yaml
type: user
data:
  id: "user-1"
  name: "admin"
  is_admin: true
  is_disabled: false
  is_hidden: false
  last_login: "2024-01-01T00:00:00.000Z"
  last_activity: "2024-01-01T00:00:00.000Z"
  has_password: true
  configuration:
    subtitle_language: "en"
    subtitle_mode: "Default"
    play_default_audio: true
    hide_played: false
    auto_play_next: true
  policy:
    enable_all_folders: true
    enable_remote_access: true
    enable_live_tv: true
    enable_playback: true
    enable_transcoding: true
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### items

List of media items.

```yaml
type: items
data:
  - id: "item-1"
    name: "The Matrix"
    type: "Movie"
    year: 1999
    rating: 8.7
    runtime_ticks: 82800000000
    genres:
      - "Action"
      - "Sci-Fi"
    overview: "A computer hacker learns..."
    played: true
    favorite: false
    play_count: 3
    unplayed_count: null
  - id: "item-2"
    name: "Breaking Bad"
    type: "Series"
    year: 2008
    rating: 9.5
    runtime_ticks: null
    genres:
      - "Crime"
      - "Drama"
    overview: "A high school chemistry teacher..."
    played: false
    favorite: true
    play_count: 0
    unplayed_count: 62
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### item

Single item details.

```yaml
type: item
data:
  id: "item-1"
  name: "The Matrix"
  type: "Movie"
  path: "/media/movies/The Matrix (1999)/The Matrix.mkv"
  year: 1999
  official_rating: "R"
  community_rating: 8.7
  critic_rating: 7.8
  runtime_ticks: 82800000000
  status: null
  premiere_date: "1999-03-31T00:00:00.000Z"
  end_date: null
  genres:
    - "Action"
    - "Sci-Fi"
    - "Thriller"
  studios:
    - "Warner Bros."
    - "Village Roadshow Pictures"
  people:
    - name: "Keanu Reeves"
      role: "Neo"
      type: "Actor"
    - name: "Laurence Fishburne"
      role: "Morpheus"
      type: "Actor"
    - name: "Lana Wachowski"
      role: null
      type: "Director"
  overview: "A computer hacker learns from mysterious rebels..."
  taglines:
    - "The Matrix has you..."
  media_sources:
    - id: "source-1"
      name: "The Matrix"
      container: "mkv"
      path: "/media/movies/The Matrix (1999)/The Matrix.mkv"
      bitrate: 15000000
      size: 15000000000
  media_streams:
    - index: 0
      type: "Video"
      codec: "h264"
      language: null
      title: null
      is_default: true
      is_forced: false
      width: 1920
      height: 1080
      channels: null
    - index: 1
      type: "Audio"
      codec: "ac3"
      language: "eng"
      title: "English 5.1"
      is_default: true
      is_forced: false
      width: null
      height: null
      channels: 6
    - index: 2
      type: "Subtitle"
      codec: "srt"
      language: "eng"
      title: "English"
      is_default: false
      is_forced: false
      width: null
      height: null
      channels: null
  user_data:
    played: true
    favorite: false
    play_count: 3
    last_played: "2024-01-01T00:00:00.000Z"
    position_ticks: 0
  child_count: null
  recursive_item_count: null
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### sessions

List of active sessions.

```yaml
type: sessions
data:
  - id: "session-1"
    user_id: "user-1"
    user_name: "admin"
    client: "Jellyfin Web"
    device_name: "Chrome"
    device_id: "chrome-123"
    application_version: "10.8.13"
    last_activity: "2024-01-01T00:00:00.000Z"
    is_active: true
    supports_remote_control: true
    now_playing:
      id: "item-1"
      name: "The Matrix"
      type: "Movie"
    play_state:
      is_paused: false
      is_muted: false
      position_ticks: 36000000000
      repeat_mode: "RepeatNone"
      shuffle: false
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### session

Single session details.

```yaml
type: session
data:
  id: "session-1"
  user_id: "user-1"
  user_name: "admin"
  client: "Jellyfin Web"
  device_name: "Chrome"
  device_id: "chrome-123"
  application_version: "10.8.13"
  last_activity: "2024-01-01T00:00:00.000Z"
  last_playback_check_in: "2024-01-01T00:00:00.000Z"
  is_active: true
  supports_remote_control: true
  supports_media_control: true
  remote_endpoint: "192.168.1.50"
  playable_media_types:
    - "Audio"
    - "Video"
  capabilities:
    playable_media_types:
      - "Audio"
      - "Video"
    supported_commands:
      - "VolumeUp"
      - "VolumeDown"
      - "Mute"
      - "Unpause"
    supports_media_control: true
  now_playing:
    id: "item-1"
    name: "The Matrix"
    type: "Movie"
    run_time_ticks: 82800000000
  play_state:
    is_paused: false
    is_muted: false
    position_ticks: 36000000000
    can_seek: true
    volume_level: 80
    audio_stream_index: 1
    subtitle_stream_index: 2
    repeat_mode: "RepeatNone"
    playback_order: "Default"
  now_playing_queue: []
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### libraries

List of media libraries.

```yaml
type: libraries
data:
  - name: "Movies"
    id: "lib-1"
    collection_type: "movies"
    locations:
      - "/media/movies"
    refresh_status: "Idle"
  - name: "TV Shows"
    id: "lib-2"
    collection_type: "tvshows"
    locations:
      - "/media/tvshows"
    refresh_status: "Idle"
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### tasks

List of scheduled tasks.

```yaml
type: tasks
data:
  - id: "task-1"
    name: "Scan Media Library"
    key: "RefreshLibrary"
    state: "Idle"
    category: "Library"
    description: "Scans your media library for new files"
    is_hidden: false
    last_execution:
      start_time: "2024-01-01T00:00:00.000Z"
      end_time: "2024-01-01T00:05:00.000Z"
      status: "Completed"
      error: null
    triggers:
      - type: "IntervalTrigger"
        interval_ticks: 864000000000
        time_of_day_ticks: null
        day_of_week: null
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### search_result

Search results.

```yaml
type: search_result
data:
  total_count: 5
  hints:
    - id: "item-1"
      name: "The Matrix"
      type: "Movie"
      year: 1999
      runtime_ticks: 82800000000
      media_type: "Video"
      series: null
      album: null
      artists: null
      index: null
      parent_index: null
    - id: "item-2"
      name: "The Matrix Reloaded"
      type: "Movie"
      year: 2003
      runtime_ticks: 83400000000
      media_type: "Video"
      series: null
      album: null
      artists: null
      index: null
      parent_index: null
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### config

Configuration display.

```yaml
type: config
data:
  server_url: "http://192.168.1.100:8096"
  username: "admin"
  user_id: "user-1"
  timeout: 30000
  output_format: "toon"
  has_api_key: true
  has_password: true
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

## Parsing Example

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

## Error Handling

All errors follow a consistent format:

```yaml
type: error
data:
  error: "Description of the error"
  code: 404
  details: {}
  success: false
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

Always check the `type` field to determine how to process the output.
