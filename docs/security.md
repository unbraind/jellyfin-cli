# Security Best Practices

This guide covers security best practices for using jellyfin-cli.

## Credential Management

### Never Commit Credentials

Credentials should **never** be committed to version control.

**Protected files in `.gitignore`:**
```
.env
settings.json
*.credentials.json
*.api-keys.json
```

Credentials for this CLI are expected in `~/.jellyfin-cli/settings.json` and/or environment variables.
Never place real credentials in repository files.

### API Keys vs Passwords

| Method | Security Level | Best For |
|--------|---------------|----------|
| API Key | High | Automation, scripts, agents |
| Username/Password | Medium | Interactive use, Quick Connect |
| Quick Connect | High | Initial setup, one-time auth |

### Using API Keys (Recommended)

```bash
# Generate API key from Jellyfin Dashboard
# Dashboard > API Keys > Create

# Configure with API key
jf setup --server https://your-server:8096 --api-key YOUR_API_KEY

# API keys are masked in output
jf config get
# Output: has_api_key: true (key not shown)
```

### Using Environment Variables

For CI/CD or containerized environments:

```bash
# Set environment variables
export JELLYFIN_SERVER_URL=https://your-server:8096
export JELLYFIN_API_KEY=your-api-key

# Equivalent short aliases are also supported
export JF_SERVER_URL=https://your-server:8096
export JF_API_KEY=your-api-key

# CLI will use these automatically
jf users list
```

**Important:** Never log or echo environment variables:
```bash
# BAD - exposes credentials
echo "Using key: $JELLYFIN_API_KEY"

# GOOD - just check if set
if [ -z "$JELLYFIN_API_KEY" ]; then
  echo "API key not set"
fi
```

Before commit/push, verify no secrets are tracked:

```bash
git status --short
git diff --cached
git grep -n "JELLYFIN_API_KEY\\|JELLYFIN_PASSWORD\\|192\\.168\\." .
bun run check:secrets
bun run check:secrets:history
```

### Configuration File Security

Configuration is stored in `~/.jellyfin-cli/settings.json`:

```bash
# Check file permissions
ls -la ~/.jellyfin-cli/settings.json

# Should be readable only by owner
chmod 600 ~/.jellyfin-cli/settings.json
```

**Recommended permissions:**
```
-rw------- 1 user user settings.json
```

`jf setup` and `jf config set` now enforce owner-only permissions (`0600`) on `settings.json` as a best-effort hardening step.

## Network Security

### Use HTTPS

Always use HTTPS in production:

```bash
# GOOD - encrypted
jf setup --server https://your-server:8096

# BAD - unencrypted (only for testing)
jf setup --server http://your-server:8096
```

### VPN/Private Network

For best security:
- Run Jellyfin on a private network
- Access via VPN when remote
- Don't expose Jellyfin directly to the internet

### Firewall Rules

Restrict access to Jellyfin port:

```bash
# Example: Allow only specific IPs
ufw allow from 192.168.1.0/24 to any port 8096
```

## API Key Management

### Principle of Least Privilege

Create API keys with only necessary permissions:

| Use Case | Recommended Permissions |
|----------|------------------------|
| Read-only browsing | Read access only |
| Playback control | Read + Playback |
| User management | Admin access |
| System administration | Full admin |

### Key Rotation

Rotate API keys periodically:

```bash
# 1. Create new key
jf apikeys create "jellyfin-cli-new"

# 2. Update configuration
jf config set --api-key NEW_KEY

# 3. Test new key
jf config test

# 4. Delete old key
jf apikeys delete OLD_KEY
```

### Audit API Keys

Regularly review active keys:

```bash
# List all API keys
jf apikeys list

# Remove unused keys
jf apikeys delete <key> --force
```

## User Permissions

### User Policy Best Practices

```bash
# View user policy
jf users policy <userId>

# Limit user permissions
jf users update-policy <userId> \
  --admin false \
  --remote-access false \
  --delete-content false \
  --transcoding true
```

### Default User Restrictions

For new users, consider:
- Disable admin rights
- Limit to specific libraries
- Disable remote access if not needed
- Restrict transcoding for resource management

### Audit User Access

```bash
# List all users and their admin status
jf users list --format toon | grep -A5 "is_admin"

# Check specific user's permissions
jf users policy <userId>
```

## Session Security

### Monitor Active Sessions

```bash
# List all active sessions
jf sessions list

# Check for unauthorized access
jf sessions list --format toon | grep "user_name"
```

### Terminate Suspicious Sessions

```bash
# Delete device/session if suspicious
jf devices delete <deviceId> --force
```

## Command Safety

### Destructive Operations

Destructive operations require `--force` flag:

```bash
# These require confirmation
jf users delete <userId> --force
jf items delete <itemId> --force
jf config reset --force
```

### Safe Practices

1. **Test with non-destructive commands first:**
```bash
# Check before deleting
jf items get <itemId>
jf items delete <itemId> --force
```

2. **Use dry-run patterns:**
```bash
# List what would be affected
jf items list --parent <libraryId> --limit 10
```

3. **Backup before major changes:**
```bash
# Create backup
jf backup create
```

## Logging and Auditing

### Activity Monitoring

```bash
# View recent activity
jf system activity --limit 50

# Filter by date
jf system activity --min-date 2024-01-01
```

### Log Access

```bash
# List available logs
jf environment logs

# View specific log
jf environment log log_20240101.log --lines 100
```

## Container Security

### Docker Secrets

When running in Docker, use secrets:

```yaml
# docker-compose.yml
services:
  jellyfin-cli:
    image: jellyfin-cli
    secrets:
      - jellyfin_api_key
    environment:
      - JELLYFIN_SERVER_URL=https://jellyfin:8096

secrets:
  jellyfin_api_key:
    external: true
```

### Environment in Containers

```bash
# Pass via environment
docker run -e JELLYFIN_API_KEY=xxx jellyfin-cli

# Or use secret files
docker run -v /run/secrets/api_key:/secrets/api_key:ro jellyfin-cli
```

## CI/CD Security

### GitHub Actions

Use GitHub Secrets:

```yaml
# .github/workflows/jellyfin.yml
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run jellyfin-cli
        env:
          JELLYFIN_SERVER_URL: ${{ secrets.JELLYFIN_SERVER_URL }}
          JELLYFIN_API_KEY: ${{ secrets.JELLYFIN_API_KEY }}
        run: |
          jf library refresh
```

### Mask Output

Never log credentials in CI:

```yaml
- name: Configure
  run: |
    # Mask the API key in logs
    echo "::add-mask::$JELLYFIN_API_KEY"
    jf config test
```

## Security Checklist

### Setup Checklist

- [ ] Use HTTPS for server URL
- [ ] Store API key in environment variable or secure config
- [ ] Verify config file permissions (600)
- [ ] Never commit settings.json
- [ ] Create dedicated API key for CLI use

### Operational Checklist

- [ ] Regularly audit API keys
- [ ] Review user permissions
- [ ] Monitor activity logs
- [ ] Rotate API keys periodically
- [ ] Remove unused user accounts

### Production Checklist

- [ ] Jellyfin behind reverse proxy with SSL
- [ ] Firewall rules configured
- [ ] API keys have minimal permissions
- [ ] Activity logging enabled
- [ ] Regular backups configured

## Incident Response

### If Credentials Are Compromised

1. **Immediately revoke API key:**
```bash
jf apikeys delete COMPROMISED_KEY --force
```

2. **Generate new key:**
```bash
jf apikeys create "jellyfin-cli-new"
```

3. **Update all configurations:**
```bash
jf config set --api-key NEW_KEY
```

4. **Review activity logs:**
```bash
jf system activity --min-date 2024-01-01
```

5. **Force password change if password was exposed**

### If Unauthorized Access Detected

1. **List active sessions:**
```bash
jf sessions list
```

2. **Remove unauthorized devices:**
```bash
jf devices delete <deviceId> --force
```

3. **Review user policies:**
```bash
jf users policy <userId>
```

4. **Consider password reset for affected users**

## Related Documentation

- [Configuration Guide](README.md#configuration)
- [API Reference](api.md) - Command documentation
- [Troubleshooting](troubleshooting.md) - Common issues
