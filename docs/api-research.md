# Jellyfin API Research (10.11.6)

## Scope

This document summarizes live API discovery work used to improve `jellyfin-cli` agent workflows without mutating server data.
Latest verification run: **March 3, 2026** against Jellyfin **10.11.6**.

## Verified Discovery Endpoint

- OpenAPI JSON was reachable at `GET /api-docs/openapi.json`.
- Sample server version observed in this research cycle: `10.11.6`.

## High-Level Surface

- OpenAPI paths: `356`
- OpenAPI operations (standard HTTP methods across all paths): `429`
- Verified with: `jf schema openapi --method GET --for-command "items list" --limit 10`.

## Read-Only Validation Strategy

To avoid modifying media library state during validation:

- Live E2E tests execute read-only commands directly.
- Live E2E tests now force `JELLYFIN_TIMEOUT=120000` during execution to reduce aborts on large libraries.
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
- Supports `--include-paths`, plus operation filters (`--method`, `--tag`, `--path-prefix`, `--search`) and intent matching (`--for-command`) for deterministic endpoint discovery.
- Reuses centralized OpenAPI probing logic shared with `config doctor`.

4. `jf schema tools`

- New command-tree introspection command that exports tool schemas for every CLI leaf command.
- Emits typed `input_schema` payloads for both positional args and options, including inherited global options.
- Includes `read_only_safe` metadata per command to help agents select non-mutating tool calls.

5. `jf schema coverage`

- Adds intent-based OpenAPI coverage estimation for the current CLI command surface.
- Supports method/tag/path filtering and command-domain scoping via `--command-prefix`.
- Emits deterministic `unmatched_operations` samples for backlog and release planning.

6. Schema/global format consistency

- `schema` subcommands now honor global `--format` values (for example `jf --format json schema tools`) in addition to local subcommand format flags.
- This keeps formatter behavior deterministic across all CLI surfaces used in automated pipelines.

7. `jf config doctor` output normalization

- `server.local_address` is now sanitized when Jellyfin returns malformed duplicated protocol values.
- The warning (`server_local_address_looks_malformed`) is still emitted so agents can surface upstream server issues.

8. Global `--explain` request introspection

- Added `--explain` (or `JELLYFIN_EXPLAIN=1`) to emit request metadata for every API call to `stderr`.
- Payload includes method, path, redacted query/body preview, timeout, and `read_only_safe` classification.
- Keeps normal command result output on `stdout`, so pipelines using Toon/JSON/YAML remain stable.

9. Read-only classification hardening

- Mutating verbs now include `restore` and `split`.
- Hyphenated command tokens are analyzed (`merge-versions`, `delete-alternates`, etc.), preventing false read-only-safe labels in tool schema exports.

## Recommended Next Enhancements

1. Add a policy profile mode (`--safety-profile`) to enforce granular allow/deny sets beyond binary read-only.
2. Add optional `schema tools --openapi-match` mode to attach inferred OpenAPI candidates directly per tool schema row.
3. Add structured command replay snippets (`curl`, `httpie`) to `--explain` output for rapid debugging.
