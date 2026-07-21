# Jellyfin API Research (Validated July 21, 2026)

This document captures the latest live Jellyfin API discovery and CLI coverage verification for
`jellyfin-cli`.

## Verification Scope

- Verification date: **July 21, 2026**
- Server used: local Jellyfin **10.11.11**
- Auth source: `~/.jellyfin-cli/settings.json` and `JELLYFIN_*` env vars
- Auth aliases supported: `JF_*` (`JF_SERVER_URL`, `JF_API_KEY`, `JF_USER`, `JF_PASSWORD`, `JF_USER_ID`, `JF_TIMEOUT`, `JF_FORMAT`)
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
- Intent-mapper coverage at the compatibility threshold (`min_score=3`): `100%` (`429/429`)
- Intent-mapper coverage at a stricter diagnostic threshold (`min_score=8`): `71.1%` (`305/429`)
- Unmatched tool intents at `min_score=3`: `1` (`jf notifications list`)
- The strict-threshold gaps include many commands that are implemented and live-tested (for example
  artists, devices, genres, items, plugins, sessions, and users). The score is therefore a fuzzy
  naming diagnostic, not proof that an endpoint is implemented or absent.

Do not use the `100%` compatibility-threshold result as the sole claim that every Jellyfin feature
is implemented. Endpoint-level completeness needs an explicit operation-ID manifest plus executable
contract tests; that stronger evidence remains part of the tracked API-interface work.

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
- API-key authentication passed from the owner-only global profile.
- Username/password authentication passed from an isolated environment-only profile after validating
  Jellyfin's `AuthenticationResult` envelope and required `MediaBrowser` client header.

## End-to-End CLI Validation

The full live E2E suite (`tests/e2e/cli.test.ts`) was executed against the local instance with
read-only-safe coverage patterns:

```bash
JELLYFIN_E2E_USE_DIST=1 JELLYFIN_READ_ONLY=1 bun test tests/e2e/cli.test.ts
```

Latest compiled-binary run result: `177` passing, `0` failing in `112.81s`.

## Full Test + Coverage Validation

Command:

```bash
bun run test:coverage
```

Observed after the authentication repair:

- `901` passing, `177` credential-dependent skips, `0` failing
- Bun coverage baseline before the current ratchet: `58.83%` lines and `44.93%` functions
- Bun's current reporter does not provide the four independent statement/branch/function/line totals
  required by the repository policy. Vitest provides those dimensions under Node, but fourteen
  integration suites currently depend on Bun-only `Bun.spawn`/`Bun.serve` APIs.

The repository-wide `100/100/100/100` requirement is not yet met. It remains a release-blocking,
priority-zero tracked feature; no lower baseline should be described as complete coverage.

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

## Latest Agent-Focused Improvements

### Exact-version OpenAPI source resilience

Schema discovery prefers the configured server. If all local OpenAPI candidates fail, it resolves
the public Jellyfin version, fetches the exact matching stable artifact from
`repo.jellyfin.org/files/openapi/stable`, never forwards local credentials to that host, and caches
the version-matched document below `~/.jellyfin-cli/cache/openapi/` with owner-only permissions. A
cached or downloaded document whose declared version differs from the server is rejected. Output
includes `source_kind`, `source_path`, and `cache_path` provenance.

### Live username/password authentication

The client now follows Jellyfin 10.11.11's OpenAPI contract for
`POST /Users/AuthenticateByName`: it sends client-identification metadata, unwraps
`AuthenticationResult.User`, installs `AuthenticationResult.AccessToken`, and propagates the token
and user ID to all API modules. A clean environment-only profile proved the compiled `jf-cli users
me` flow without writing credentials to the repository or mutating media data.

### OpenAPI intent alias tuning for command coverage mapping

Improved tokenization/matching so command-intent mapping is more resilient for agent workflows:

- `health` now aliases to `ping` (`system health` maps to `/System/Ping`)
- `userdata` now expands to `user` + `data` for endpoint matching
- `url` treated as low-signal token to avoid false penalties in score ranking
- `rename` now expands to `update + option + custom + name` so `devices rename` maps to
  `POST /Devices/Options`

Validation outcomes:

- full-scope unmatched-tool count improved from `2` to `1` on Jellyfin `10.11.6` at `min_score=3`
- no change to operation coverage (remains `100%`)
- new regression tests in:
  - `tests/utils/openapi-tokenize.test.ts`
  - `tests/utils/openapi.test.ts`

### Remaining OpenAPI documentation gap (server-side)

The last unmatched full-scope tool is:

- `jf notifications list`

This command works against the live server, but its endpoint does not score above threshold against
the published OpenAPI schema on this Jellyfin build. This is treated as an OpenAPI documentation
gap rather than a CLI implementation gap.

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

## Primary Sources

- [Jellyfin server repository and hosted Swagger path](https://github.com/jellyfin/jellyfin#accessing-the-hosted-web-client)
- [Jellyfin 10.11.11 release](https://github.com/jellyfin/jellyfin/releases/tag/v10.11.11)
- [Jellyfin stable OpenAPI artifacts](https://repo.jellyfin.org/files/openapi/stable/)
- [Bun coverage documentation](https://bun.sh/docs/test/code-coverage)
- [Vitest coverage provider guidance](https://vitest.dev/guide/coverage.html)
