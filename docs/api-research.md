# Jellyfin API Research (Validated March 4, 2026)

This document captures the latest live Jellyfin API discovery and CLI coverage verification for
`jellyfin-cli`.

## Verification Scope

- Verification date: **March 4, 2026**
- Server used: local Jellyfin **10.11.6**
- Auth source: `~/.jellyfin-cli/settings.json` and `JELLYFIN_*` env vars
- Safety mode: read-only command selection for live checks (no media/library mutations)

## Live Discovery Results

Command:

```bash
jf-cli --format json schema research --include-unmatched --limit 100
```

Observed:

- OpenAPI source: `/api-docs/openapi.json`
- Path count: `356`
- Operation count: `429`
- Full-scope operation coverage: `100%` (`429/429`)
- Read-only operation coverage: `100%` (`257/257`)
- Unmapped operations: `0` in both scopes
- Full-scope unmatched tools above `min_score=3`: `2` (down from `14` after additional intent alias tuning)

## Live Readiness Checks

Command:

```bash
jf-cli --format json config doctor \
  --validate-formats \
  --require-connected \
  --require-auth \
  --require-openapi \
  --require-valid-formats
```

Observed:

- `connection_ok: true`
- `auth_ok: true`
- `openapi_available: true`
- All output formats validated: `toon`, `json`, `table`, `raw`, `yaml`, `markdown`

## End-to-End CLI Validation

The full live E2E suite (`tests/e2e/cli.test.ts`) was executed against the local instance with
read-only-safe coverage patterns:

```bash
JELLYFIN_E2E_USE_DIST=1 JELLYFIN_READ_ONLY=1 bun test tests/e2e/cli.test.ts
```

Latest run result: `177` passing, `0` failing.

## Full Test + Coverage Validation

Command:

```bash
bun run test:coverage
```

Observed (latest):

- `1052` passing, `0` failing
- Coverage: `99.63%` lines, `94.54%` functions
- `src/utils/schema-validate.ts`: `100%` lines and functions

## Help UX Verification

To keep command discovery consistent for humans and agents, every `jf [command] --help` now shows
root/global flags (`--format`, `--server`, `--explain`, `--read-only`) under `Global Options`.

Validation:

- Added tests: `tests/commands/help-global-options.test.ts`
- Verified live help output:
  - `jf-cli system --help`
  - `jf-cli system info --help`

## Coverage Reporting Interpretation

`schema research` and `schema coverage` report two useful classes for agent planning:

- `unmatched_tools`: commands that appear API-backed but did not map above score threshold.
- `local_only_tools`: commands intentionally local (config/schema/setup helpers).

This avoids treating local utility commands as API implementation gaps.

## Latest Agent-Focused Improvement

### OpenAPI intent alias tuning for command coverage mapping

Improved tokenization/matching so command-intent mapping is more resilient for agent workflows:

- `health` now aliases to `ping` (`system health` maps to `/System/Ping`)
- `userdata` now expands to `user` + `data` for endpoint matching
- `url` treated as low-signal token to avoid false penalties in score ranking

Validation outcomes:

- full-scope unmatched-tool count improved from `14` to `2` (same server + same threshold)
- no change to operation coverage (remains `100%`)
- new regression tests in:
  - `tests/utils/openapi-tokenize.test.ts`
  - `tests/utils/openapi.test.ts`

### Top-level help audit for global option discoverability

Added a full top-level command help audit test to ensure every `jf [command] --help` includes root
global options (`--format`, `--server`, `--explain`, `--read-only`).

Validation outcomes:

- every top-level command help surface shows `Global Options`
- regression test added:
  - `tests/commands/help-global-options-all.test.ts`

### Setup readiness gate for setup wizard workflows

Added `jf setup validate` as a read-only setup readiness diagnostic to consolidate:

- local config presence
- server connectivity (`/System/Info/Public`)
- auth viability (`/System/Info`)
- OpenAPI availability (`/api-docs/openapi.json` fallback probing)
- optional formatter validation for `toon/json/table/raw/yaml/markdown`

It supports `--require-all` for CI/agent pass/fail gating and keeps setup verification in one command
without mutating server/library data.

Added regression tests:

- `tests/commands/setup.test.ts`

## Repro Commands

```bash
# Full release validation
bun run validate:release

# Live schema discovery snapshot
jf-cli --format json schema research --include-unmatched --limit 100

# Live safety/format diagnostics
jf-cli --format json config doctor --validate-formats --require-connected --require-auth --require-openapi --require-valid-formats
jf-cli --format json setup validate --require-all --validate-formats

# Optional read-only guard for interactive sessions
export JELLYFIN_READ_ONLY=1
```
