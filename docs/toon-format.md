# Toon Output Format

The Toon format is the default output format for jellyfin-cli, designed for optimal parsing by LLMs and AI agents.

## Overview

Toon is a YAML-based structured output format that provides:

- **Type Information**: Every output includes a `type` field
- **Consistent Structure**: Predictable data organization
- **Metadata**: Timestamp, format version, and other context
- **Human Readable**: YAML format is easy to read and debug
- **Machine Parseable**: Easy to parse with any YAML library

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

## Getting Schemas

Use the `jf schema` command to get JSON schemas for all output types:

```bash
# Get all schemas
jf schema

# Get schema for specific type
jf schema user
jf schema items
jf schema sessions

# List all available types
jf schema list

# Output as JSON
jf schema --format json
```

## Output Types Reference

### Core Types

#### message

Success/error messages for operations.

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

#### error

Error responses with details.

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

### System Types

#### system_info

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

#### config

Configuration display (credentials masked).

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

#### activity_log

Server activity log entries.

```yaml
type: activity_log
data:
  - id: 1
    name: "UserLoggedIn"
    type: "AuthenticationSucceeded"
    date: "2024-01-01T00:00:00.000Z"
    user_id: "user-1"
    severity: "Info"
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### User Types

#### users

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

#### user

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

#### user_policy

User permissions and policy.

```yaml
type: user_policy
data:
  is_administrator: true
  is_hidden: false
  is_disabled: false
  enable_remote_access: true
  enable_live_tv_access: true
  enable_live_tv_management: true
  enable_media_playback: true
  enable_video_playback_transcoding: true
  enable_content_deletion: false
  enable_all_folders: true
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

#### user_config

User preferences.

```yaml
type: user_config
data:
  subtitle_language_preference: "en"
  subtitle_mode: "Default"
  play_default_audio_track: true
  hide_played_in_latest: false
  enable_next_episode_auto_play: true
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### Item Types

#### items

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

#### item

Single item details with full metadata.

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

#### search_result

Search results with hints.

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

#### chapters

Chapter list for an item.

```yaml
type: chapters
data:
  - index: 0
    name: "Chapter 1"
    start_position_ticks: 0
    has_image: true
  - index: 1
    name: "Chapter 2"
    start_position_ticks: 36000000000
    has_image: true
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

#### filters

Available query filters.

```yaml
type: filters
data:
  genres:
    - "Action"
    - "Comedy"
    - "Drama"
  studios:
    - "Warner Bros."
    - "Universal"
  tags:
    - "favorite"
    - "4k"
  years:
    - 2023
    - 2022
    - 2021
  official_ratings:
    - "G"
    - "PG"
    - "R"
  persons:
    - name: "Tom Hanks"
      id: "person-1"
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### Session Types

#### sessions

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

#### session

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

### Library Types

#### libraries

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

### Task Types

#### tasks

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

#### task

Single task details.

```yaml
type: task
data:
  id: "task-1"
  name: "Scan Media Library"
  key: "RefreshLibrary"
  state: "Running"
  category: "Library"
  description: "Scans your media library for new files"
  current_progress: 45
  is_hidden: false
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

#### task_triggers

Task schedule triggers.

```yaml
type: task_triggers
data:
  - id: "trigger-1"
    type: "IntervalTrigger"
    interval_ticks: 864000000000
    max_runs: null
  - id: "trigger-2"
    type: "DailyTrigger"
    time_of_day_ticks: 216000000000
    max_runs: null
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### Plugin Types

#### plugins

List of installed plugins.

```yaml
type: plugins
data:
  - id: "plugin-1"
    name: "LDAP Authentication"
    version: "1.0.0"
    status: "Active"
    description: "LDAP authentication provider"
  - id: "plugin-2"
    name: "Playback Reporting"
    version: "2.0.0"
    status: "Active"
    description: "Track playback activity"
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### Media Types

#### playback_info

Playback information for an item.

```yaml
type: playback_info
data:
  play_session_id: "session-abc123"
  media_sources:
    - id: "source-1"
      name: "The Matrix"
      container: "mkv"
      supports_direct_play: true
      supports_direct_stream: true
      supports_transcoding: true
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

#### stream_url

Video stream URL.

```yaml
type: stream_url
data:
  url: "http://server:8096/videos/item-1/stream?..."
  item_id: "item-1"
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

#### audio_url

Audio stream URL.

```yaml
type: audio_url
data:
  url: "http://server:8096/audio/item-1/stream?..."
  item_id: "item-1"
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

#### subtitle_url

Subtitle URL.

```yaml
type: subtitle_url
data:
  url: "http://server:8096/videos/item-1/subtitles/2?..."
  item_id: "item-1"
  stream_index: 2
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

#### image_url

Image URL.

```yaml
type: image_url
data:
  url: "http://server:8096/Items/item-1/Images/Primary?..."
  item_id: "item-1"
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### Other Types

#### recommendations

Content recommendations.

```yaml
type: recommendations
data:
  - baseline_item: "item-1"
    category_id: "cat-1"
    type: "SimilarTo"
    items:
      - id: "item-2"
        name: "The Matrix Reloaded"
      - id: "item-3"
        name: "The Matrix Revolutions"
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

#### item_counts

Library statistics.

```yaml
type: item_counts
data:
  movies: 500
  series: 75
  episodes: 2500
  albums: 200
  songs: 3000
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

#### live_tv_info

Live TV information.

```yaml
type: live_tv_info
data:
  is_enabled: true
  services:
    - name: "HDHomeRun"
      type: "TunerHost"
  guide_info:
    last_update: "2024-01-01T00:00:00.000Z"
    status: "Ok"
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

## Parsing Examples

### Python

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

# Usage
try:
    items = get_items('matrix')
    for item in items:
        print(f"{item['name']} ({item['type']}, {item.get('year', 'N/A')})")
except Exception as e:
    print(f"Error: {e}")
```

### JavaScript/Node.js

```javascript
import yaml from 'yaml';
import { execSync } from 'child_process';

function getItems(searchTerm) {
  const result = execSync(
    `jf items search "${searchTerm}" --format toon`,
    { encoding: 'utf-8' }
  );
  
  const data = yaml.parse(result);
  
  if (data.type === 'error') {
    throw new Error(data.data.error);
  }
  
  if (data.type === 'search_result') {
    return data.data.hints;
  }
  
  return [];
}

// Usage
try {
  const items = getItems('matrix');
  items.forEach(item => {
    console.log(`${item.name} (${item.type}, ${item.year ?? 'N/A'})`);
  });
} catch (e) {
  console.error(`Error: ${e.message}`);
}
```

### TypeScript with Types

```typescript
import yaml from 'yaml';
import { execSync } from 'child_process';

interface ToonOutput<T> {
  type: string;
  data: T;
  meta: {
    timestamp: string;
    format: 'toon';
    version: string;
  };
}

interface SearchHint {
  id: string;
  name: string;
  type: string;
  year?: number;
  runtime_ticks?: number;
}

interface SearchResult {
  total_count: number;
  hints: SearchHint[];
}

function searchItems(term: string): SearchHint[] {
  const result = execSync(
    `jf items search "${term}" --format toon`,
    { encoding: 'utf-8' }
  );
  
  const output: ToonOutput<SearchResult | { error: string }> = yaml.parse(result);
  
  if (output.type === 'error') {
    throw new Error((output.data as { error: string }).error);
  }
  
  return (output.data as SearchResult).hints;
}
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

## Best Practices

1. **Always check the type field**: Before processing data, verify the output type
2. **Handle errors explicitly**: Check for `type: error` and handle appropriately
3. **Use null-safe access**: Fields may be null/undefined - use safe access patterns
4. **Parse timestamps as ISO 8601**: All timestamps are in ISO 8601 format
5. **Use schema command**: Run `jf schema <type>` to understand data structure
