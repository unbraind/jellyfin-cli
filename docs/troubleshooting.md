# Troubleshooting Guide

This guide covers common issues and solutions when using jellyfin-cli.

## Quick Diagnostics

Run these commands to diagnose common issues:

```bash
# Check if CLI is properly installed
jf --version

# Check setup status
jf setup status

# Test server connection
jf config test

# View current configuration
jf config get
```

## Configuration Issues

### Issue: "No configuration found"

**Symptoms:**
```
type: error
data:
  error: "No server configuration found"
```

**Solutions:**

1. Run setup wizard:
```bash
jf setup --server http://your-server:8096 --api-key YOUR_KEY
```

2. Or use environment variables:
```bash
export JELLYFIN_SERVER_URL=http://your-server:8096
export JELLYFIN_API_KEY=your-api-key
```

3. Or manually set config:
```bash
jf config set --server http://your-server:8096 --api-key YOUR_KEY
```

### Issue: "Invalid API key"

**Symptoms:**
```
type: error
data:
  error: "Unauthorized"
  code: 401
```

**Solutions:**

1. Verify API key is correct
2. Check if API key has required permissions
3. Generate new API key from Jellyfin dashboard:
   - Go to Dashboard > API Keys
   - Create new key with appropriate permissions

```bash
# Create new API key (if you have admin access)
jf apikeys create "jellyfin-cli"

# Update config with new key
jf config set --api-key NEW_KEY
```

### Issue: "Connection refused"

**Symptoms:**
```
type: error
data:
  error: "connect ECONNREFUSED"
```

**Solutions:**

1. Verify server URL is correct:
```bash
jf config get
```

2. Check server is running:
```bash
curl http://your-server:8096/health
```

3. Check firewall rules
4. Verify port (default: 8096)
5. Try with IP address instead of hostname

### Issue: "Connection timeout"

**Symptoms:**
```
type: error
data:
  error: "Timeout awaiting request"
```

**Solutions:**

1. Increase timeout:
```bash
jf config set --timeout 60000
```

2. Or use environment variable:
```bash
export JELLYFIN_TIMEOUT=60000
```

3. Check network connectivity
4. Verify server isn't overloaded

## Authentication Issues

### Issue: "Authentication failed" with username/password

**Symptoms:**
```
type: error
data:
  error: "Authentication failed"
```

**Solutions:**

1. Verify credentials:
```bash
jf config set --username your-user --password your-password
```

2. Check user exists:
```bash
jf users list
```

3. Verify user has API access permissions
4. Try with API key instead

### Issue: Quick Connect not working

**Symptoms:**
```
type: error
data:
  error: "Quick Connect is disabled"
```

**Solutions:**

1. Enable Quick Connect in Jellyfin:
   - Go to Dashboard > Networking
   - Enable "Enable Quick Connect"

2. Check status:
```bash
jf quickconnect status
```

## Permission Issues

### Issue: "Access denied" for admin operations

**Symptoms:**
```
type: error
data:
  error: "Access denied"
  code: 403
```

**Solutions:**

1. Verify user is admin:
```bash
jf users me
```

2. Check user policy:
```bash
jf users policy <userId>
```

3. Update policy if needed:
```bash
jf users update-policy <userId> --admin true
```

### Issue: "Cannot delete item"

**Symptoms:**
```
type: error
data:
  error: "User does not have permission to delete items"
```

**Solutions:**

1. Check user has delete permission:
```bash
jf users policy <userId>
```

2. Enable delete permission:
```bash
jf users update-policy <userId> --delete-content true
```

## Command Issues

### Issue: "Item not found"

**Symptoms:**
```
type: error
data:
  error: "Item not found"
  code: 404
```

**Solutions:**

1. Verify item ID:
```bash
jf items search "item name"
```

2. List items in library:
```bash
jf items list --parent <libraryId>
```

3. Check item exists:
```bash
jf items get <itemId>
```

### Issue: "Session not found"

**Symptoms:**
```
type: error
data:
  error: "Session not found"
```

**Solutions:**

1. List active sessions:
```bash
jf sessions list
```

2. Session may have disconnected - refresh list
3. Device may need to be playing content

### Issue: "--force required"

**Symptoms:**
```
Use --force to confirm deletion
```

**Solution:**

Add `--force` flag to destructive operations:
```bash
jf users delete <userId> --force
jf items delete <itemId> --force
```

### Issue: "Task is already running"

**Symptoms:**
```
type: error
data:
  error: "Task is already running"
```

**Solutions:**

1. Check task status:
```bash
jf tasks list
```

2. Wait for task to complete
3. Stop running task:
```bash
jf tasks stop <taskId>
```

## Output Issues

### Issue: Output is not parseable

**Symptoms:**
- Invalid YAML
- Unexpected format

**Solutions:**

1. Ensure toon format is specified:
```bash
jf items list --format toon
```

2. Try JSON format:
```bash
jf items list --format json
```

3. Check for errors in output:
```bash
jf items list 2>&1
```

### Issue: Table format is truncated

**Symptoms:**
- Columns cut off
- Data missing

**Solutions:**

1. Use toon or json format for complete data:
```bash
jf users list --format toon
```

2. Pipe to file:
```bash
jf items list --format json > items.json
```

## Network Issues

### Issue: SSL/TLS errors

**Symptoms:**
```
type: error
data:
  error: "unable to verify the first certificate"
```

**Solutions:**

1. Use HTTP for testing (not recommended for production):
```bash
jf config set --server http://your-server:8096
```

2. For self-signed certs, ensure proper CA setup
3. Use valid SSL certificate

### Issue: WebSocket connection fails

**Symptoms:**
- Real-time features not working
- Session updates delayed

**Solutions:**

1. WebSocket uses same port as HTTP
2. Check proxy configuration
3. Ensure WebSocket protocol is allowed

## Performance Issues

### Issue: Slow response times

**Solutions:**

1. Check server load:
```bash
jf system info
```

2. Reduce result size:
```bash
jf items list --limit 20
```

3. Use specific types:
```bash
jf items list --types Movie
```

4. Increase timeout for large libraries:
```bash
jf config set --timeout 120000
```

### Issue: Large result sets

**Solutions:**

1. Use pagination:
```bash
jf items list --limit 100 --offset 0
jf items list --limit 100 --offset 100
```

2. Filter results:
```bash
jf items list --types Movie --genres "Action"
```

3. Use search instead of list:
```bash
jf items search "specific term"
```

## Debug Mode

### Enable Verbose Output

For debugging, redirect stderr:

```bash
# Capture both stdout and stderr
jf items list 2>&1 | tee output.log

# Check config path
jf config path

# View raw API response
jf system info --format raw
```

### Test API Directly

```bash
# Test with curl
curl -H "X-Emby-Token: YOUR_API_KEY" http://server:8096/System/Info

# Test health endpoint
curl http://server:8096/health
```

## Getting Help

1. Check this troubleshooting guide
2. Review [API Reference](api.md) for correct command usage
3. Check [Agent Integration](agent-integration.md) for integration issues
4. Open an issue on GitHub with:
   - Command that failed
   - Error output (use `--format raw`)
   - Jellyfin server version (`jf system info`)
   - CLI version (`jf --version`)

## Common Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Invalid/expired API key |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Invalid ID, item deleted |
| 409 | Conflict | Resource state conflict |
| 500 | Server Error | Jellyfin internal error |
| 503 | Unavailable | Server overloaded/maintenance |
