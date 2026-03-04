# Agent Integration Guide

This guide explains how to integrate jellyfin-cli with AI agents, LLMs, and automation tools.

## Why Agent-Optimized?

Traditional CLIs are designed for human interaction with:
- Interactive prompts
- Human-readable tables
- Colored output
- Inconsistent error messages

jellyfin-cli is designed for **machine consumption** with:
- Structured YAML output (Toon format)
- Consistent type information
- Machine-parseable error messages
- No interactive prompts
- JSON schema support

## Quick Start for Agents

### Basic Pattern

```bash
# 1. Execute command with toon format (default)
jf items search "matrix"

# 2. Parse the YAML output
# 3. Check the 'type' field to determine data structure
# 4. Handle errors if type === 'error'
```

### Output Structure

Every command outputs:

```yaml
type: <output_type>
data:
  <structured_data>
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### Understanding Types

Use the schema command to understand output types:

```bash
# List all available types
jf schema list

# Get schema for a specific type
jf schema user
jf schema items
jf schema sessions

# Get all schemas at once
jf schema
```

### OpenAPI-Aware Command Discovery

Use live server metadata to keep agent plans aligned with actual Jellyfin capabilities:

```bash
# Summarize/filter live OpenAPI operations
jf schema openapi --read-only-ops --for-command "items list" --limit 20

# Export machine-usable CLI tool schemas
jf schema tools --openapi-match --openapi-match-limit 3 --limit 20

# Suggest command patterns from intent
jf schema suggest --for-command "users list" --limit 10

# Suggest command candidates for uncovered endpoints
jf schema suggest --read-only-ops --limit 20
```

## Integration Patterns

### Pattern 1: Direct Execution

Execute commands directly and parse output:

```python
import yaml
import subprocess

def run_jf_command(args):
    """Run a jellyfin-cli command and return parsed output."""
    result = subprocess.run(
        ['jf'] + args + ['--format', 'toon'],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0 and not result.stdout:
        raise Exception(f"Command failed: {result.stderr}")
    
    data = yaml.safe_load(result.stdout)
    
    if data.get('type') == 'error':
        raise Exception(data['data']['error'])
    
    return data
```

### Pattern 2: Streaming URLs

Get direct streaming URLs for media playback:

```python
def play_movie(item_id, session_id):
    """Play a movie on a specific session."""
    # Get stream URL
    stream = run_jf_command(['items', 'stream-url', item_id])
    url = stream['data']['url']
    
    # Send play command
    run_jf_command(['sessions', 'play', session_id, item_id])
    
    return url
```

### Pattern 3: User Management

Automate user management tasks:

```python
def create_user_with_policy(username, password, is_admin=False):
    """Create a user and set their policy."""
    # Create user
    result = run_jf_command(['users', 'create', username, '--password', password])
    user_id = result['data']['id']
    
    # Set admin policy if needed
    if is_admin:
        run_jf_command([
            'users', 'update-policy', user_id,
            '--admin', 'true',
            '--remote-access', 'true'
        ])
    
    return user_id
```

### Pattern 4: Library Maintenance

Automate library maintenance:

```python
def refresh_library_and_wait():
    """Refresh library and monitor progress."""
    # Start refresh
    run_jf_command(['library', 'refresh'])
    
    # Monitor task progress
    while True:
        tasks = run_jf_command(['tasks', 'list'])
        scan_task = next(
            (t for t in tasks['data'] if t['key'] == 'RefreshLibrary'),
            None
        )
        
        if scan_task and scan_task['state'] == 'Idle':
            break
        
        time.sleep(5)
    
    return True
```

## Common Workflows

### Workflow 1: Search and Play

```python
def search_and_play(query, session_id):
    """Search for content and play it."""
    # Search
    results = run_jf_command(['items', 'search', query, '--limit', '10'])
    
    if not results['data']['hints']:
        return "No results found"
    
    # Get first result
    item = results['data']['hints'][0]
    
    # Play it
    run_jf_command(['sessions', 'play', session_id, item['id']])
    
    return f"Now playing: {item['name']}"
```

### Workflow 2: Get Recommendations

```python
def get_recommendations_for_user(user_id):
    """Get personalized recommendations."""
    # Get user's favorites
    favorites = run_jf_command(['favorites', 'list', '--user', user_id])
    
    if not favorites['data']:
        # Fall back to general recommendations
        recs = run_jf_command(['discover', 'recommendations'])
        return recs['data']
    
    # Get similar items based on favorites
    recommendations = []
    for fav in favorites['data'][:5]:
        similar = run_jf_command(['items', 'similar', fav['id'], '--limit', '5'])
        recommendations.extend(similar['data'])
    
    return recommendations
```

### Workflow 3: Session Monitoring

```python
def monitor_active_sessions():
    """Monitor all active sessions and their playback."""
    sessions = run_jf_command(['sessions', 'list'])
    
    for session in sessions['data']:
        user = session['user_name']
        device = session['device_name']
        
        if session.get('now_playing'):
            item = session['now_playing']['name']
            position = session['play_state']['position_ticks']
            total = session['now_playing'].get('run_time_ticks', 0)
            
            if total > 0:
                progress = (position / total) * 100
                print(f"{user} on {device}: {item} ({progress:.1f}%)")
        else:
            print(f"{user} on {device}: Idle")
```

### Workflow 4: Bulk Metadata Update

```python
def update_movie_genres(movie_ids, new_genres):
    """Update genres for multiple movies."""
    genres_str = ','.join(new_genres)
    
    for movie_id in movie_ids:
        try:
            run_jf_command([
                'items', 'update', movie_id,
                '--genres', genres_str
            ])
            print(f"Updated {movie_id}")
        except Exception as e:
            print(f"Failed to update {movie_id}: {e}")
```

## Error Handling

### Error Output Format

```yaml
type: error
data:
  error: "Item not found"
  code: 404
  details:
    itemId: "invalid-id"
  success: false
meta:
  timestamp: "2024-01-01T00:00:00.000Z"
  format: toon
  version: "1.0.0"
```

### Error Handling Pattern

```python
class JellyfinError(Exception):
    def __init__(self, message, code=None, details=None):
        super().__init__(message)
        self.code = code
        self.details = details

def safe_jf_command(args):
    """Run command with proper error handling."""
    result = subprocess.run(
        ['jf'] + args + ['--format', 'toon'],
        capture_output=True,
        text=True
    )
    
    data = yaml.safe_load(result.stdout) if result.stdout else None
    
    if data and data.get('type') == 'error':
        error_data = data['data']
        raise JellyfinError(
            error_data.get('error', 'Unknown error'),
            code=error_data.get('code'),
            details=error_data.get('details')
        )
    
    if result.returncode != 0:
        raise JellyfinError(f"Command failed with code {result.returncode}")
    
    return data
```

## Schema Integration

### Using Schemas for Validation

```python
import json
import subprocess
from jsonschema import validate, ValidationError

def get_schema(output_type):
    """Get JSON schema for an output type."""
    result = subprocess.run(
        ['jf', 'schema', output_type, '--format', 'json'],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

def validate_output(data, expected_type):
    """Validate output against its schema."""
    schema = get_schema(expected_type)
    try:
        validate(instance=data, schema=schema)
        return True
    except ValidationError as e:
        print(f"Validation error: {e.message}")
        return False
```

### Dynamic Type Handling

```python
def process_output(data):
    """Process output based on its type."""
    output_type = data.get('type')
    
    handlers = {
        'items': handle_items,
        'users': handle_users,
        'sessions': handle_sessions,
        'error': handle_error,
        'search_result': handle_search,
        # Add more handlers as needed
    }
    
    handler = handlers.get(output_type, handle_unknown)
    return handler(data['data'])
```

## LLM Prompt Engineering

### System Prompt Template

```
You are an assistant that interacts with a Jellyfin media server using the jellyfin-cli tool.

The CLI outputs structured YAML in the "Toon" format:
- Every output has a 'type' field indicating the data structure
- Every output has a 'data' field with the actual data
- Errors have type 'error' with details in the data field

Available commands:
- jf items search <term> - Search for media
- jf items get <id> - Get item details
- jf sessions list - List active sessions
- jf sessions play <sessionId> <itemId> - Play media
- jf users list - List users
- jf library list - List libraries
- jf schema list - List all output types

Always check the 'type' field to understand the output structure.
Handle 'type: error' outputs gracefully.
```

### Example Conversation

```
User: What movies do we have with "matrix" in the title?

Assistant: [executes: jf items search "matrix" --types Movie]

The search found 3 movies:
1. The Matrix (1999) - Action, Sci-Fi
2. The Matrix Reloaded (2003) - Action, Sci-Fi
3. The Matrix Revolutions (2003) - Action, Sci-Fi

Would you like me to play one of these?
```

## Best Practices

### 1. Always Specify Format

```bash
# Good - explicit format
jf items search "matrix" --format toon

# Also works (toon is default) but explicit is clearer
jf items search "matrix"
```

### 2. Handle Pagination

```python
def get_all_items(parent_id):
    """Get all items with pagination."""
    all_items = []
    offset = 0
    limit = 100
    
    while True:
        result = run_jf_command([
            'items', 'list',
            '--parent', parent_id,
            '--limit', str(limit),
            '--offset', str(offset)
        ])
        
        items = result['data']
        all_items.extend(items)
        
        if len(items) < limit:
            break
        
        offset += limit
    
    return all_items
```

### 3. Use Specific Types

```bash
# Good - filter by type
jf items list --types Movie,Series

# Less efficient - gets all items
jf items list
```

### 4. Cache Schema Information

```python
# Cache schemas at startup
SCHEMAS = {}

def init_schemas():
    types = run_jf_command(['schema', 'list'])
    for t in types['data']['types']:
        SCHEMAS[t] = get_schema(t)
```

### 5. Rate Limiting

```python
import time

class RateLimitedClient:
    def __init__(self, requests_per_second=10):
        self.min_interval = 1.0 / requests_per_second
        self.last_request = 0
    
    def run(self, args):
        now = time.time()
        elapsed = now - self.last_request
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        
        self.last_request = time.time()
        return run_jf_command(args)
```

## Complete Example: Media Browser Agent

```python
#!/usr/bin/env python3
"""
A simple media browser agent using jellyfin-cli.
"""

import yaml
import subprocess
from typing import Optional, List, Dict, Any

class JellyfinAgent:
    def __init__(self):
        self.output_format = 'toon'
    
    def _run(self, *args) -> Dict[str, Any]:
        """Execute a jellyfin-cli command."""
        cmd = ['jf'] + list(args) + ['--format', self.output_format]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        data = yaml.safe_load(result.stdout) if result.stdout else None
        
        if data and data.get('type') == 'error':
            raise Exception(data['data']['error'])
        
        return data
    
    def search(self, query: str, item_type: Optional[str] = None) -> List[Dict]:
        """Search for media."""
        args = ['items', 'search', query]
        if item_type:
            args.extend(['--types', item_type])
        
        result = self._run(*args)
        return result['data']['hints']
    
    def get_libraries(self) -> List[Dict]:
        """Get all libraries."""
        result = self._run('library', 'list')
        return result['data']
    
    def get_items(self, library_id: str, limit: int = 50) -> List[Dict]:
        """Get items from a library."""
        result = self._run('items', 'list', '--parent', library_id, '--limit', str(limit))
        return result['data']
    
    def get_item(self, item_id: str) -> Dict:
        """Get item details."""
        result = self._run('items', 'get', item_id)
        return result['data']
    
    def get_sessions(self) -> List[Dict]:
        """Get active sessions."""
        result = self._run('sessions', 'list')
        return result['data']
    
    def play(self, session_id: str, item_id: str) -> bool:
        """Play an item on a session."""
        self._run('sessions', 'play', session_id, item_id)
        return True
    
    def control(self, session_id: str, action: str) -> bool:
        """Control playback (pause, unpause, stop, next, previous)."""
        self._run('sessions', action, session_id)
        return True

# Usage
if __name__ == '__main__':
    agent = JellyfinAgent()
    
    # Search for movies
    movies = agent.search('matrix', 'Movie')
    for movie in movies[:5]:
        print(f"- {movie['name']} ({movie.get('year', 'N/A')})")
    
    # List libraries
    print("\nLibraries:")
    for lib in agent.get_libraries():
        print(f"- {lib['name']} ({lib['collection_type']})")
```

## Related Documentation

- [API Reference](api.md) - Complete command documentation
- [Toon Format](toon-format.md) - Output format specification
- [Troubleshooting](troubleshooting.md) - Common issues
