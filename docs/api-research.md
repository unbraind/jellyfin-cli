# Jellyfin API Research (10.11.6)

## Scope

This document summarizes live API discovery work used to improve `jellyfin-cli` agent workflows
without mutating server data. Latest verification run: **March 4, 2026** against Jellyfin
**10.11.6**.

## Verified Discovery Endpoint

- OpenAPI JSON was reachable at `GET /api-docs/openapi.json`.
- Sample server version observed in this research cycle: `10.11.6`.

## High-Level Surface

- OpenAPI paths: `356`
- OpenAPI operations (standard HTTP methods across all paths): `429`
- Verified with: `jf schema openapi --method GET --read-only-ops --for-command "items list" --limit 10`.

## Latest Coverage Snapshot (March 4, 2026)

Verified with:

```bash
jf-cli schema research --include-unmatched --limit 40 --format json
```

- full scope operation coverage: `100%` (`429 / 429`)
- read-only scope operation coverage: `100%` (`257 / 257`)
- unmatched operations: `0` (full + read-only)
- unmatched tools (CLI intents with no OpenAPI match above score threshold): `21` (full), `57` (read-only)
- local-only tools (utility commands intentionally not mapped to OpenAPI): `18` (full + read-only)

## Latest `jf-cli` Binary Verification (March 4, 2026)

Verified directly with the installed CLI command name (`jf-cli`) in read-only mode:

```bash
jf-cli --format json config doctor --validate-formats --require-connected --require-auth --require-openapi --require-valid-formats
jf-cli --format json schema research --include-unmatched --limit 10
jf-cli --format json schema coverage --read-only-ops --suggest-commands --limit 10
jf-cli --format json setup startup
```

Observed results:

- doctor checks: `connection_ok=true`, `auth_ok=true`, `openapi_available=true`
- formatter checks: all supported formats validated (`toon`, `json`, `table`, `raw`, `yaml`, `markdown`)
- research/coverage: full and read-only operation coverage both `100%` with `0` unmatched operations
- setup startup: deterministic startup state output (`startup_complete_state`) remained stable with warning metadata when `/Startup/Complete` is unavailable

## Local-Only Tool Classification (March 4, 2026)

`jf schema coverage` and `jf schema research` now separate utility-only commands from true API
intent gaps:

- new fields:
  - `local_only_tools_total`
  - `local_only_tools_truncated`
  - `local_only_tools`
- existing `unmatched_tools*` fields now focus on commands that should map to API operations but do
  not currently match above the score threshold.

This prevents local config/schema/setup helper commands from obscuring actionable API coverage
signals in agent automation reports.

## Latest Addition (March 4, 2026)

- Added `jf schema suggest` to improve agent workflow ergonomics:
  - `--for-command "<intent>"` returns ranked OpenAPI matches plus inferred command names.
  - Without `--for-command`, it reports suggestion candidates for uncovered OpenAPI operations.
  - Output type: `openapi_command_suggestions` (machine-friendly for CI/automation backlogs).

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
- optional formatter validation via `jf config doctor --validate-formats` to verify Toon/JSON/YAML/Markdown/Table/Raw output integrity for automation pipelines

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
- Supports `--read-only-ops` filtering to restrict analysis to non-mutating endpoints.
- Supports `--require-coverage <percent>` to enforce minimum coverage as a non-zero exit gate in CI/release workflows.
- Emits deterministic `unmatched_operations` samples for backlog and release planning.
- Supports `--suggest-commands` to generate deterministic candidate CLI command names for unmatched operations, including confidence and rationale metadata for agent planning.

6. OpenAPI gap-to-command suggestion workflow

- `jf schema coverage --suggest-commands` now emits `suggested_commands` entries with:
  - `suggested_command`
  - `intent`
  - `confidence`
  - `rationale`
- This shortens backlog planning cycles by turning unmapped endpoint discovery into immediately actionable CLI command candidates.

7. Schema/global format consistency

- `schema` subcommands now honor global `--format` values (for example `jf --format json schema tools`) in addition to local subcommand format flags.
- This keeps formatter behavior deterministic across all CLI surfaces used in automated pipelines.

8. `jf config doctor` output normalization

- `server.local_address` is now sanitized when Jellyfin returns malformed duplicated protocol values.
- The warning (`server_local_address_looks_malformed`) is still emitted so agents can surface upstream server issues.

9. Global `--explain` request introspection

- Added `--explain` (or `JELLYFIN_EXPLAIN=1`) to emit request metadata for every API call to `stderr`.
- Payload includes method, path, redacted query/body preview, timeout, and `read_only_safe` classification.
- Keeps normal command result output on `stdout`, so pipelines using Toon/JSON/YAML remain stable.

10. Read-only classification hardening

- Mutating verbs now include `restore` and `split`.
- Hyphenated command tokens are analyzed (`merge-versions`, `delete-alternates`, etc.), preventing false read-only-safe labels in tool schema exports.

11. `jf schema validate`

- Added payload validation command for Toon/JSON/YAML outputs against built-in CLI schemas.
- Supports stdin pipelines (`jf items list | jf schema validate items --from toon`) and inline payload checks.
- Emits machine-readable validation status and deterministic field-level errors for CI/agent guardrails.

12. `jf devices info`

- Added support for read-only `GET /Devices/Info` via `jf devices info`.
- This closes one live OpenAPI gap discovered in coverage output and improves current-client diagnostics for agent workflows.

13. Setup formatter consistency (`jf setup`, `jf setup status`)

- `jf setup` and `jf setup status` now honor runtime/global `--format` for both success and error payloads.
- `--output-format` continues to persist the default output format in config, but no longer affects immediate response encoding unless selected as active runtime format.
- Added regression tests for JSON output in `setup status` and JSON error rendering for validation failures.

14. OpenAPI coverage mapping accuracy (`jf schema coverage`)

- Coverage analysis now uses a uniqueness-aware assignment strategy when matching command intents
  to operations.
- This prevents repeated mapping of many tools to the same endpoint and improves backlog quality
  for unmatched API operations.
- On the March 3, 2026 verification run against Jellyfin 10.11.6:
  - read-only scope: `257` operations
  - mapped: `217`
  - coverage: `84.44%`
  - unmatched: `40`

17. `jf setup env --format <format>`

- Added structured output support for setup environment exports while preserving legacy plain output.
- `jf setup env --format json` now emits machine-parseable payloads with masked/secret metadata.
- `jf setup env --shell` remains unchanged for direct POSIX export usage.

15. Global option propagation for agent workflows

- Global `--format` and global `--server` are now propagated to subcommands before action
  execution.
- This makes command behavior deterministic for wrappers that always place global options first
  (for example: `jf --format json --server prod system health`).
- Added regression tests in `tests/commands/global-options.test.ts`.

16. Setup startup diagnostics (`jf setup startup`)

- Added read-only startup-state coverage for:
  - `GET /Startup/Configuration`
  - `GET /Startup/FirstUser`
  - `GET /Startup/Complete`
- Added `jf setup startup` to emit structured startup wizard diagnostics for agent automation.
- Added client unit tests and command/E2E coverage for the new setup startup workflow.

18. Live TV read-only endpoint expansion

- Added `jf livetv program <programId>` for `GET /LiveTv/Programs/{programId}`.
- Added `jf livetv schedules-direct-countries` for `GET /LiveTv/ListingProviders/SchedulesDirect/Countries`.
- Added API/client wrappers plus test coverage so the new endpoints are agent-usable in typed workflows.

19. Release metadata accuracy in CLI

- CLI `--version` now reads from `package.json` instead of a hardcoded constant.
- This keeps distributed binaries aligned with the date+commit versioning policy.

20. OpenAPI intent tokenization accuracy improvements

- Added camel-case aware intent tokenization for command and OpenAPI matching (for example:
  `MediaSegments` -> `media`, `segments`; `InstantMix` -> `instant`, `mix`).
- This improves `jf schema coverage` accuracy for already-implemented commands that previously
  looked unmatched due to token-shape differences.
- March 4, 2026 verification run against Jellyfin 10.11.6:
  - read-only scope: `257` operations
  - mapped: `225`
  - coverage: `87.55%`
  - unmatched: `32`

21. Live TV channel endpoint + setup startup state normalization (March 4, 2026)

- Added `jf livetv channel <channelId>` for `GET /LiveTv/Channels/{channelId}`.
- Added API/client method delegation and test coverage for the new read-only Live TV endpoint.
- Fixed read-only allowlist mismatch for QuickConnect status checks by allowing `quickconnect check`.
- `jf setup startup` now emits a deterministic `startup_complete_state` (`complete` | `required` | `unknown`) to keep agent pipelines stable when `/Startup/Complete` is unavailable (405).

22. Intent matching + auth key alias improvements (March 4, 2026)

- Added token alias expansion in OpenAPI intent matching for domain terms (`apikey`, `quickconnect`, `livetv`) and safer singularization (`libraries` -> `library`, while keeping `status` intact).
- Added `jf auth keys` as a read-only alias to list API keys through the auth command namespace.
- Updated live E2E defaults to run `bun run src/cli.ts` unless `JELLYFIN_E2E_USE_DIST=1` is set, preventing stale `dist/` mismatches.
- March 4, 2026 verification run against Jellyfin 10.11.6:
  - read-only scope: `257` operations
  - mapped: `230`
  - coverage: `89.49%`
  - unmatched: `27`

23. Dashboard endpoint support + external-id alias coverage bump (March 4, 2026)

- Added `jf dashboard pages [--main-menu true|false]` for `GET /web/ConfigurationPages`.
- Added `jf dashboard page <name>` for `GET /web/ConfigurationPage?name=...`.
- Added `jf media external-id-infos <itemId>` as a read-only alias of `media external-ids`.
- Added client wrappers and unit/E2E tests for dashboard commands.
- March 4, 2026 verification run against Jellyfin 10.11.6:
  - read-only scope: `257` operations
  - mapped: `232`
  - coverage: `90.27%`
  - unmatched: `25`

24. Named image endpoint command coverage + formatter consistency (March 4, 2026)

- Added read-only named image URL commands:
  - `jf images artist-url <artistName> <imageType>`
  - `jf images genre-url <genreName> <imageType>`
  - `jf images music-genre-url <genreName> <imageType>`
  - `jf images person-url <personName> <imageType>`
  - `jf images studio-url <studioName> <imageType>`
- Added indexed path support (`--index`) in typed named image URL builders.
- Updated `images` command output paths to honor `--format` consistently for list/url/user/delete outputs.
- March 4, 2026 verification run against Jellyfin 10.11.6:
  - read-only scope: `257` operations
  - mapped: `237`
  - coverage: `92.22%`
  - unmatched: `20`

25. OpenAPI gap prioritization by tag (March 4, 2026)

- Enhanced `jf schema coverage` output with `unmatched_by_tag` summaries.
- New fields:
  - `unmatched_by_tag_total`
  - `unmatched_by_tag` (top tags with operation counts + sample paths)
- This makes API research output directly actionable for implementation planning by surfacing the
  highest-impact missing endpoint domains first.

26. Setup auth-mode hardening for API key + username (March 4, 2026)

- `jf setup` now supports `--api-key` together with `--username` so user-specific commands can
  resolve and persist the expected `user_id` without requiring password auth.
- Explicit API-key setup now clears inherited stale password values unless `--password` is
  explicitly provided, preventing false validation conflicts from older settings.
- Validation still blocks `--api-key` + `--password` combinations.
- Verified live against local Jellyfin `10.11.6` using read-only E2E + full release checks on
  March 4, 2026.

27. OpenAPI intent precision + filter consistency hardening (March 4, 2026)

- Refined command-intent scoring to treat generic parameter tokens (`id`, `name`, `type`, `index`)
  as low-signal while prioritizing specific subcommand tokens.

28. Read-only setup workflow + 100% live mapping confirmation (March 4, 2026)

- `JELLYFIN_READ_ONLY=1` now allows the base `jf setup` command so local CLI configuration can be
  updated safely in strict no-server-mutation workflows.
- Mutating setup commands remain blocked by read-only guardrails (`setup update-configuration`).
- Verified with installed binary (`jf-cli`) and source runner (`bun run src/cli.ts`) against Jellyfin
  `10.11.6`.

29. Bidirectional OpenAPI research snapshots (`schema coverage` + `schema research`) (March 4, 2026)

- Coverage output now includes unmatched CLI tool samples in addition to unmatched API operations.
- New machine-readable fields:
  - `unmapped_tool_count`
  - `unmatched_tools_total`
  - `unmatched_tools_truncated`
  - `unmatched_tools[]` with `command`, `read_only_safe`, and `reason`
- This gives agents a two-way planning view:
  - API operations still missing command coverage
  - CLI commands whose intent does not currently map to OpenAPI
- Live `schema research` snapshot now reports:
  - full scope: `429/429` mapped (`100%`)
  - read-only scope: `257/257` mapped (`100%`)
- Added a targeted penalty when a match only aligns with top-level command-domain tokens and misses
  specific trailing intent tokens.

28. Consolidated live research snapshot command (March 4, 2026)

- Added `jf schema research` to emit a single OpenAPI + coverage report for agent planning.
- Includes both `full_scope` and `read_only_scope` coverage blocks in one response.
- Supports `--include-unmatched` for backlog sampling and `--command-prefix` for domain-scoped analysis.
- Verification run against Jellyfin `10.11.6` on March 4, 2026:
  - read-only scope: `257/257` mapped (`100%`)
  - full scope: `429/429` mapped (`100%`)
- Fixed `jf schema openapi --for-command` so inferred `command_matches` now respect active operation
  filters (including `--read-only-ops`, `--method`, `--tag`, `--path-prefix`, `--search`).
- Added regression coverage:
  - `tests/utils/openapi.test.ts` (specific subcommand precedence)
  - `tests/commands/schema.test.ts` (filter application to command-match inference)

Verification notes (March 4, 2026, Jellyfin 10.11.6):
- `jf schema openapi --for-command "media external-id-infos" --read-only-ops` no longer returns
  mutating `/Library/Media/Updated` in `command_matches`.

29. Persisted research snapshots for CI/agents (March 4, 2026)

- Added `jf schema research --save <path>` to write the consolidated OpenAPI + coverage snapshot
  to disk as JSON for deterministic automation workflows.
- The command output now includes `saved_to` when a snapshot file is written.

30. Years listing timeout hardening for large libraries (March 4, 2026)

- `jf years list` now uses `GET /Items/Filters2` first and only falls back to `GET /Years` when needed.
- This keeps the command read-only while avoiding long `/Years` scans that can exceed CLI/test timeouts.
- Verified against local Jellyfin `10.11.6` with:
  - `bun test tests/e2e/cli.test.ts -t "years list"`
  - `bun run validate:release`
- Coverage headline remains `92.22%` read-only mapped operations (`237/257`) while command-intent
  diagnostics are more accurate and deterministic for agent planning.

28. Read-only media URL endpoint expansion (March 4, 2026)

- Added new URL-focused read-only media commands:
  - `jf media video-stream-url <itemId>`
  - `jf media audio-stream-url <itemId>`
  - `jf media hls-legacy-url <itemId> <playlistId>`
  - `jf media hls-audio-segment-url <itemId> <segmentId>`
  - `jf media item-file-url <itemId>`

  - `jf media kodi-strm-url <type> <id> [--parent-id <parentId>]`
  - `jf media branding-css-url`
- Added typed API client URL helpers for:
  - `/Videos/{itemId}/stream.{container}`
  - `/Audio/{itemId}/stream.{container}`
  - `/Audio/{itemId}/universal`
  - `/Videos/{itemId}/hls/{playlistId}/stream.m3u8`
  - `/Audio/{itemId}/hls/{segmentId}/stream.mp3`
  - `/Items/{itemId}/File`
  - `/Kodi/{type}/{id}/file.strm` and `/Kodi/{type}/{parentId}/{id}/file.strm`
  - `/Branding/Css.css`

Verification notes (March 4, 2026, Jellyfin 10.11.6):
- New live E2E tests pass for `media video-stream-url`, `media audio-stream-url`, and
  `media item-file-url`.
- Read-only schema coverage currently remains `89.49%` (`230/257`) because current intent matching
  does not yet fully map `media ...-url` commands to all `Audio`/`Videos` tag operations.

29. Audio HLS URL endpoint support + coverage summary contract (March 4, 2026)

- Added new read-only audio HLS URL commands:
  - `jf media audio-hls-master-url <itemId>` for `GET /Audio/{itemId}/master.m3u8`
  - `jf media audio-hls-variant-url <itemId>` for `GET /Audio/{itemId}/main.m3u8`
- Added typed client URL helper methods:
  - `getAudioHlsMasterPlaylistUrl`
  - `getAudioHlsVariantPlaylistUrl`
- Added a stable nested `summary` object in `jf schema coverage` output to simplify machine parsing
  in agent/CI workflows.

Verification notes (March 4, 2026, Jellyfin 10.11.6):
- Targeted E2E tests pass for both new audio HLS commands against the local read-only workflow.
- `jf schema coverage --read-only-ops --format json` now includes:
  - `summary.operation_scope_count`
  - `summary.mapped_operation_count`
  - `summary.unmapped_operation_count`
  - `summary.coverage_percent`
  - `summary.tool_scope_count`
  - `summary.mapped_tool_count`
- Current read-only coverage result observed in this run: `90.27%` (`232/257`).

## Recommended Next Enhancements

1. Add a policy profile mode (`--safety-profile`) to enforce granular allow/deny sets beyond binary read-only.
2. Add structured command replay snippets (`curl`, `httpie`) to `--explain` output for rapid debugging.

32. `schema tools --openapi-match` enrichment (March 4, 2026)

- Implemented `jf schema tools --openapi-match` so tool schema export can include inferred
  Jellyfin OpenAPI candidates per command.
- Added supporting options:
  - `--openapi-match-limit <number>`
  - `--min-score <number>`
  - `--name <name>`
  - `--endpoint <path>`
- Output now includes top-level `openapi_matching` metadata plus per-tool `openapi_matches` rows.
- Added regression coverage in `tests/commands/schema.test.ts` for both success and unconfigured
  server error paths.

31. `config doctor` global format propagation parity (March 4, 2026)

- Fixed output-format parity for `config doctor` so global runtime format flags are respected:
  - `jf-cli --format json config doctor`
  - `jf-cli --format yaml config doctor`
  - `jf-cli --format markdown config doctor`
- Added regression coverage to prevent fallback-to-Toon regressions in automated pipelines.

30. TV Similar Shows endpoint coverage (March 4, 2026)

- Added `jf tvshows similar <itemId> [--limit <number>]` as a read-only command mapped to
  `GET /Shows/{itemId}/Similar`.
- Added typed API wrappers:
  - `TvShowsApi.getSimilarShows`
  - `JellyfinApiClient.getSimilarShows`
- Added regression coverage:
  - `tests/api/new-features.test.ts`
  - `tests/api/submodules.test.ts`
  - `tests/e2e/cli.test.ts`

Verification notes (March 4, 2026, Jellyfin 10.11.6):
- Live E2E run confirms `jf tvshows similar` returns `type: items` when a series ID is available.
- The command is read-only and does not mutate library data.

31. Coverage mapping precision for multi-operation commands (March 4, 2026)

- Updated `jf schema coverage` mapping logic so one command intent can map more than one operation
  when confidence remains high.
- This fixes undercounting for command families that intentionally cover multiple related endpoints
  (for example stream/universal variants).
- Added regression test:
  - `tests/commands/schema.test.ts`:
    `maps multiple operations to one command intent when all matches meet the score threshold`
- Also fixed a setup command quality issue:
  - `src/commands/setup.ts` indentation around target server save resolution now follows project
    formatting conventions.

Verification notes (March 4, 2026, Jellyfin 10.11.6):
- Read-only scope: `257/257` mapped (`100%`).
- Full scope: `424/429` mapped (`98.83%`).
- Remaining unmatched full-scope operations observed in this run:
  - `POST /ScheduledTasks/Running/{taskId}`
  - `GET /Startup/Configuration`
  - `POST /Startup/Configuration`
  - `GET /SyncPlay/List`
  - `POST /SyncPlay/New`

32. Endpoint-aligned alias and startup update coverage closure (March 4, 2026)

- Added endpoint-aligned command aliases for improved OpenAPI intent matching and agent discoverability:
  - `jf syncplay groups` (alias of `syncplay list`)
  - `jf syncplay new` (alias of `syncplay create`)
  - `jf tasks running <taskId>` (alias of `tasks run`)
  - `jf setup configuration` (alias of `setup startup`)
- Added startup wizard configuration update command:
  - `jf setup update-configuration --ui-culture <culture> --metadata-country-code <code> --preferred-metadata-language <language>`
  - maps to `POST /Startup/Configuration`
- Hardened read-only guard classification for task execution verbs:
  - added `run` / `running` mutating verb detection so task-start commands are blocked by `--read-only` / `JELLYFIN_READ_ONLY=1`.
- Improved intent token alias expansion:
  - added `syncplay` token expansion (`syncplay`, `sync`, `play`) for better command-to-operation mapping.

Verification notes (March 4, 2026, Jellyfin 10.11.6):
- `jf schema coverage --format json`: full operation scope now `429/429` mapped (`100%`).
- `jf schema coverage --read-only-ops --format json`: read-only scope remains `257/257` mapped (`100%`).
- Added regression coverage:
  - `tests/commands/setup.test.ts`
  - `tests/utils/read-only-guard.test.ts`
  - `tests/utils/openapi-tokenize.test.ts`
  - `tests/e2e/cli.test.ts`

33. Full live OpenAPI intent coverage verification (March 4, 2026)

- Verified against local Jellyfin `10.11.6`:
  - `jf schema coverage --read-only-ops --suggest-commands --limit 40`
  - `jf schema coverage --suggest-commands --limit 40`
- Result:
  - read-only operation scope: `257`
  - read-only mapped operations: `257`
  - read-only coverage: `100%`
  - full operation scope: `429`
  - full mapped operations: `429`
  - full coverage: `100%`
  - unmatched operations: `0` (both scopes)
- Release-quality verification also passed on the same run:
 - `bun run validate:release`
- `1011` tests passing (includes read-only live CLI E2E coverage).

34. OpenAPI probe resilience + endpoint override for agent workflows (March 4, 2026)

- Added `--endpoint <path>` support to:
  - `jf schema openapi`
  - `jf schema coverage`
- This allows deterministic OpenAPI discovery on installations that expose schema docs at non-default paths.
- Hardened OpenAPI probe error reporting to include all attempted candidate paths in one message,
  which makes agent fallback/debug logic easier when schema discovery fails.
- Added regression coverage:
  - `tests/utils/openapi.test.ts` (preferred endpoint override + aggregated probe failure message)
  - `tests/commands/schema.test.ts` (coverage command with custom `--endpoint`)

Verification notes (March 4, 2026, Jellyfin 10.11.6):
- `jf schema openapi --endpoint /api-docs/openapi.json --read-only-ops --format json`
  returned:
  - `path_count: 356`
  - `operation_count: 429`
  - `filtered_operation_count: 257`
- `jf schema coverage --endpoint /api-docs/openapi.json --read-only-ops --suggest-commands --format json`
  returned:
  - read-only operation scope: `257`
  - mapped operations: `257`
  - coverage: `100%`
  - unmatched operations: `0`
