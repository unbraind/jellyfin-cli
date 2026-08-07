# Jellyfin API Research (Validated August 7, 2026)

This document captures the latest live Jellyfin API discovery and CLI coverage verification for
`jellyfin-cli`.

## August 7 Semantic Read-Only Safety Refresh

The live 10.11.11 OpenAPI document exposes eight installed-plugin maintenance actions as `GET`:
Meilisearch reconnect and reindex, Telegram notifier testing, user-usage backup load/save, and
user-usage add/prune/remove. Their HTTP method alone is therefore not a safe execution contract.

Exact operation resolution now combines method semantics with fail-closed path exceptions. Those
eight operations report `read_only_safe: false`; `jf api get` and `jf api batch` reject them before
the target request; `jf api mutate ... --confirm` remains blocked by global read-only mode. Isolated
loopback tests verify zero target requests for both exact and batch rejection paths.

The refreshed live scope contains `249` semantically read-only operations. All `249` map at the
compatibility threshold, while full scope remains `429/429` with no unmatched direct endpoint
tools. Raw server contracts and responses remain outside Git and PM evidence.

## August 6 Current-Contract Discovery Refresh

Official release discovery confirms Jellyfin `10.11.11` remains stable, the configured server
matches it, and `12.0-rc4` is the current opt-in preview. `jf schema versions` now discovers those
identities at execution time, validates both exact OpenAPI artifacts without forwarding local
authentication, and emits ready-to-run compatibility argv. The compatibility command accepts
`latest-stable` and `latest-preview` selectors so agent workflows do not fossilize an old RC.

The same research pass corrected scope semantics: full coverage evaluates all `405` leaf tools,
while read-only coverage evaluates only `250` tools classified safe under the global read-only
policy. Mutating commands no longer appear as unmatched against a GET/HEAD/OPTIONS-only operation
set. This includes explicit safety exceptions for state-changing command names such as session
logout, remote-control dispatch, playlist sharing, SyncPlay reports, and plugin maintenance that
cannot be classified reliably from a generic verb list. The official TOON runtime is refreshed to
`4.1.1`.

## August 5 Structured-Output Contract Refresh

Read-only probes against the configured Jellyfin 10.11.11 server found that several dedicated
command families resolved `--format` correctly but called TOON-only renderers afterward. JSON
consumers therefore received non-JSON stdout even though the generic OpenAPI and selected core
commands already honored the requested format.

The command runtime now binds all legacy-named item, user, session, task, message, error, and generic
renderers to the resolved final format. A repository guard rejects direct TOON calls from command
handlers. Sanitized compiled-CLI acceptance validated five representative API command families
across all six formats (`30` executions) without persisting or printing server payloads and without
mutating Jellyfin data.

## Verification Scope

- Verification date: **August 7, 2026**
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
- Full-scope unmatched direct endpoint tools at `min_score=3`: `0`
- Intentional non-endpoint tools: `10` (OpenAPI orchestration, WebSocket, and optional notification API surfaces)
- The strict-threshold gaps include many commands that are implemented and live-tested (for example
  artists, devices, genres, items, plugins, sessions, and users). The score is therefore a fuzzy
  naming diagnostic, not proof that an endpoint is implemented or absent.

Do not use the `100%` compatibility-threshold result as the sole claim that every Jellyfin feature
is implemented. Endpoint-level completeness needs an explicit operation-ID manifest plus executable
contract tests.

## Exact Operation Execution

The live 10.11.11 document declares a unique, non-empty `operationId` for all `429` operations.
`jf api inspect|get|mutate` now resolves those identifiers exactly and validates declared path/query
parameters, request-body presence, and request content types before execution.

- `249` operations are semantically read-only and can run through `jf api get`.
- Non-read-only methods and the eight known state-changing plugin `GET` routes require
  `jf api mutate ... --confirm`.
- Global read-only mode blocks `api mutate` before any request.
- Exact inspection merges path- and operation-level parameters and exposes types, formats,
  constraints, defaults, examples, bounded body schemas, response contracts, security alternatives,
  and a ready-to-fill argv template without duplicating catalog or batch dry-run surfaces.
- The schema declares `76` JSON-capable request-body operations, `2` text bodies, and `4` image
  bodies (media-type declarations overlap for JSON variants).
- JSON, text, and file-backed binary/text bodies are supported without allowing custom origins or
  custom authorization headers.
- Buffered responses have an explicit size limit; binary responses are base64-wrapped so every
  formatter remains machine-valid.

This exact-operation fallback complements the typed command interface. It proves executable reach
for current and future schema operations without claiming that a generic call is as ergonomic as a
dedicated high-level command.

## Read-Only Batch Execution

`jf api batch` composes exact read operations without introducing a generic mutation pipeline. A
strict version-1 JSON manifest is limited to 25 requests by default and 100 at the hard ceiling.
Every operation ID, method, path parameter, and query name is validated against one resolved
OpenAPI document before the first request runs.

Execution is sequential and deterministic, reuses one authenticated client, preserves caller IDs,
and enforces both per-response and aggregate byte budgets. `--dry-run` emits the fully materialized
plan without executing API operations. Live acceptance uses only `GetPublicSystemInfo` and
`GetSystemInfo` under `JELLYFIN_READ_ONLY=1`; raw responses and server identity remain untracked.

## Version Compatibility Evidence

Official primary sources identify `10.11.11` as the latest stable server release and `12.0 RC4` as
an opt-in preview. The official artifacts contain:

- `10.11.11`: `315` paths, `388` operations, and `357` component schemas.
- `12.0-rc4` (document API version `12.0.0`): `294` paths, `364` operations, and `357` component
  schemas.

The live server additionally exposes plugin-provided contracts, so upgrade analysis uses an
official-to-official baseline by default. The sanitized `10.11.11` to `12.0-rc4` comparison found
`39` breaking findings, `129` review findings, and `26` non-breaking findings. These counts are an
RC compatibility signal, not a claim about the eventual Jellyfin 12 stable contract.

```bash
# Stable exact-version consistency check
jf schema compatibility

# Discover moving official stable and preview artifact identities
jf schema versions

# Explicit preview comparison; nonzero after output when breaking findings exist
jf schema compatibility \
  --target-version latest-preview \
  --allow-prerelease \
  --fail-on-breaking

# Separate local extension drift from core version compatibility
jf schema compatibility --baseline live
```

Raw official and live documents remain in owner-only `~/.jellyfin-cli` storage. Git and PM contain
only versions, aggregate counts, classifications, and public source links.

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

## Official TOON Contract Validation

The default `toon` format now uses `@toon-format/toon` 4.1.1, the official TypeScript
implementation of Token-Oriented Object Notation. It is no longer a YAML-like custom serializer.
The CLI preserves semantic empty arrays, null values, false values, and zero values during
serialization.

Canonical live formatter families were validated by piping compiled CLI output through both the
official decoder and `jf-cli schema validate`:

```bash
JELLYFIN_READ_ONLY=1 jf-cli --format toon system info \
  | jf-cli schema validate system_info --from toon --format json
```

The same read-only validation passed for `system_info`, `users`, `items`, `sessions`, `libraries`,
and `tasks`. Unit-level contract coverage also decodes and validates representative output for
`query_result`, `search_result`, `config`, `activity_log`, `message`, and `error`.

## End-to-End CLI Validation

The full live E2E suite (`tests/e2e/cli.test.ts`) was executed against the local instance with
read-only-safe coverage patterns:

```bash
JELLYFIN_E2E_USE_DIST=1 JELLYFIN_READ_ONLY=1 bun test tests/e2e/cli.test.ts
```

Latest compiled-binary run result (2026-07-23): `177` passing, `0` failing in `144.36s`.

## Full Test + Coverage Validation

Command:

```bash
bun run test:coverage
bun run test:coverage:four
```

Observed on 2026-07-23:

- Bun: `915` passing, `177` credential-dependent skips, `0` failing.
- Vitest: `906` passing, `0` failing; `38.24%` statements, `37.38%` branches, `50.00%`
  functions, and `37.90%` lines.
- `tests/setup/node-bun-compat.ts` provides typed Node adapters for the test harness's
  `Bun.spawn` and `Bun.serve` boundaries. The live E2E suite remains a separate Bun gate because
  subprocess execution is intentionally black-box and does not contribute attributable parent-process
  coverage.

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

### Bounded Jellyfin 10.11 WebSocket events

The configured Jellyfin 10.11.11 server currently exposes `356` OpenAPI paths and `429` REST
operations, all mapped by the CLI intent inventory. The remaining major server API surface is the
authenticated `/socket` protocol, which is intentionally outside OpenAPI.

`jf events types` now models all 28 values in Jellyfin 10.11.11's official
`SessionMessageType`, including library, user-data, session, task, plugin, timer, server-lifecycle,
playback, and SyncPlay messages. `jf events watch` follows the official TypeScript SDK behavior:

- authenticate through the `ApiKey` WebSocket query parameter without printing or persisting it;
- respond to `ForceKeepAlive` at half the server-provided interval;
- support the official `Sessions`, `ActivityLogEntry`, and `ScheduledTasksInfo` periodic reads;
- stop by record count, duration, socket closure, or signal;
- enforce connection, message-size, record-count, duration, and subscription-rate bounds;
- emit aggregate TOON by default or explicit NDJSON with `--stream --format json`.

Live compiled acceptance used only read subscriptions with `JELLYFIN_READ_ONLY=1`; no Jellyfin data
was modified and raw payloads were not persisted.

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

### Direct endpoints versus non-endpoint transports

Coverage reports now keep four disjoint tool classes so agents do not invent work from false fuzzy
matches:

- `mapped_tool_count`: commands with a direct OpenAPI operation match;
- `unmatched_tools`: direct endpoint commands with no match above the requested score;
- `local_only_tools`: configuration, setup, and schema utilities that do not contact an API;
- `non_endpoint_tools`: API-related tools that intentionally have no one-to-one REST operation.

The live full-scope result contains `375` direct mappings, `20` local tools, `10` non-endpoint
tools, and `0` unmatched tools across `405` leaf commands. All `429` operations remain mapped.
The read-only scope evaluates only the `250` read-only-safe tools; mutating tools are deliberately
outside that population, and every emitted read-only classification has `read_only_safe: true`.
The live naming diagnostic maps `215` direct tools, classifies `19` local and `8` non-endpoint
tools, and retains `8` safe direct commands for manual mapping review; operation coverage is
`249/249` (`100%`). The unmatched tool intents do not make mutating commands eligible for live
tests.
The non-endpoint reasons are stable machine values:

- `openapi_orchestration` for `jf api *` and `jf schema compatibility`;
- `websocket_transport` for `jf events *`;
- `optional_plugin_api` for `jf notifications *`.

The official Jellyfin `v10.11.11` server tree and the live OpenAPI document contain no notification
controller/operations. Notification commands therefore remain an explicitly optional compatibility
surface rather than being misreported as missing core OpenAPI coverage. `notifications types`
returns a structured `available: false` response when absent, and notification reads honor all six
output formats. Mutation behavior is tested only against an isolated loopback fixture.

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
- [Jellyfin 12.0-rc4 release](https://github.com/jellyfin/jellyfin/releases/tag/v12.0-rc4)
- [Jellyfin stable OpenAPI artifacts](https://repo.jellyfin.org/files/openapi/stable/)
- [Jellyfin 10.11.11 WebSocket message enum](https://github.com/jellyfin/jellyfin/blob/v10.11.11/MediaBrowser.Model/Session/SessionMessageType.cs)
- [Official Jellyfin TypeScript SDK WebSocket service](https://github.com/jellyfin/jellyfin-sdk-typescript/blob/master/src/websocket/websocket-service.ts)
- [Official TOON TypeScript implementation](https://github.com/toon-format/toon)
- [TOON 4.1.1 release](https://github.com/toon-format/toon/releases/tag/v4.1.1)
- [TOON specification](https://github.com/toon-format/spec)
- [Bun coverage documentation](https://bun.sh/docs/test/code-coverage)
- [Vitest coverage provider guidance](https://vitest.dev/guide/coverage.html)
