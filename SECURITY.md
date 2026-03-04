# Security Policy

## Supported versions

Only the latest release is supported for security fixes.

## Reporting a vulnerability

Please report vulnerabilities privately via GitHub Security Advisories:

- https://github.com/unbraind/jellyfin-cli/security/advisories/new

Do not include secrets or exploit details in public issues.

## Security expectations for contributors

- Never commit credentials, API keys, or private server URLs
- Keep `.env` and local settings files untracked
- Run `bun run check:secrets` and `bun run check:secrets:history` before opening a PR
- Preserve secret masking behavior in command output

For operational security guidance, see [docs/security.md](docs/security.md).
