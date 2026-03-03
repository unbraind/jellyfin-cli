# Jellyfin API Research (10.11.6)

## Scope

This document summarizes live API discovery work used to improve `jellyfin-cli` agent workflows without mutating server data.

## Verified Discovery Endpoint

- OpenAPI JSON was reachable at `GET /api-docs/openapi.json`.
- Sample server version observed in this research cycle: `10.11.6`.

## High-Level Surface

- OpenAPI paths: `356`
- OpenAPI operations (standard HTTP methods across all paths): `429`

## Read-Only Validation Strategy

To avoid modifying media library state during validation:

- Live E2E tests execute read-only commands directly.
- Commands that are write-capable are validated via `--help` checks in E2E where appropriate.
- Health/auth/schema checks are now available via `jf config doctor`.

## Agent-Focused Improvements Implemented

1. `jf config doctor`

- Emits a structured diagnostics payload with:
  - active auth mode
  - connectivity check status
  - authentication check status
  - OpenAPI availability + path/operation counts
  - warnings for common pitfalls

2. Settings-aware live E2E bootstrapping

- `tests/e2e/cli.test.ts` now reads `~/.jellyfin-cli/settings.json` when env vars are not set.
- This keeps secrets out of repository files while enabling reproducible local full CLI runs.

3. `jf schema openapi`

- New read-only API discovery command to fetch and summarize OpenAPI directly from the configured server.
- Supports `--include-paths` and `--limit` for deterministic operation-list sampling.
- Reuses centralized OpenAPI probing logic shared with `config doctor`.

4. `jf schema tools`

- New command-tree introspection command that exports tool schemas for every CLI leaf command.
- Emits typed `input_schema` payloads for both positional args and options, including inherited global options.
- Includes `read_only_safe` metadata per command to help agents select non-mutating tool calls.

## Recommended Next Enhancements

1. Add optional `--explain` mode to print resolved Jellyfin endpoint + query before execution.
2. Add a policy profile mode (`--safety-profile`) to enforce granular allow/deny sets beyond binary read-only.
3. Add command-to-endpoint mapping metadata in `schema tools` so agents can reason about underlying API operations directly.
