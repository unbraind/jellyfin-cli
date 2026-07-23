# Release Readiness

Use this checklist before creating a GitHub release or publishing to npm.

## CI/CD baseline (recommended)

Configure branch protection on `main` to require these checks before merge:

- `CI / Quality Gates`
- `CodeQL / Analyze (javascript-typescript)`
- `Secret Scan / Secret Scanning (Tracked + History)`
- `Commit Quality / Semantic PR Title`
- `Commit Quality / Commit Subject Style`

Use `.github/workflows/auto-release.yml` for change-aware scheduled/manual preparation and `.github/workflows/release.yml` for tag-driven provenance publishing. Configure `RELEASE_PAT` and `NPM_TOKEN` in the `release` environment as described in [Automated Releases](RELEASING.md).

## 1) Configure auth outside the repository

Store credentials only in env vars or in `~/.jellyfin-cli/settings.json`:

```bash
jf setup --server http://your-jellyfin-host:8096 --api-key "$JELLYFIN_API_KEY"
```

The CLI hardens `~/.jellyfin-cli/` to owner-only permissions (`0700`) and writes
`settings.json` with owner-only permissions (`0600`) on supported platforms.

You can inspect exported values without revealing secrets:

```bash
jf setup env --shell
jf setup env --format json
```

## 2) Preview the next release version

```bash
bun run version:next
```

Version format is required: `YYYY.M.D` or `YYYY.M.D-<N>` (example: `2026.3.4` or `2026.3.4-2`).
Use no suffix for the first release of a UTC day; use `-N` for release 2+ on that day.

## 3) Run full release validation

```bash
bun run validate:release
```

This runs:

- TypeScript checks (`bun run typecheck`)
- Lint (`bun run lint`)
- Full tests (`bun run test`)
- Cross-runtime unit/integration tests (`bun run test:portable`)
- Build (`bun run build`)
- Dist smoke check (`bun run smoke:dist`)
- Version policy check (`bun run check:version`)
- Source LOC guard (`bun run check:file-length`)
- Secret scan on tracked files (`bun run check:secrets`)
- Secret scan on full git history (`bun run check:secrets:history`)
- npm packaging dry-run (`bun run pack:dry-run`)
- `npx` execution smoke from local package tarball (`bun run smoke:npx`)
- `bunx` execution smoke from local package tarball (`bun run smoke:bunx`)
- Generated pm changelog check (`bun run changelog:pm:check`)
- Release automation unit checks (`bun run test:release`)

The repository's mandatory `100/100/100/100` statement/branch/function/line coverage gate is tracked
separately and is not yet satisfied. Until that gate is implemented and green, this checklist must
not be interpreted as permission to publish. Current measurements and runtime limitations are
recorded in [Jellyfin API Research](api-research.md).

Run `bun run test:coverage:four` to produce the authoritative four-dimension diagnostic report.

## 4) Run live read-only CLI E2E checks

```bash
export JELLYFIN_READ_ONLY=1
export JELLYFIN_TIMEOUT=120000
bun test tests/e2e/cli.test.ts

# Optional: force compiled CLI (`dist/cli.js`) instead of `bun run src/cli.ts`
JELLYFIN_E2E_USE_DIST=1 bun test tests/e2e/cli.test.ts
```

The E2E suite is read-only and is designed to avoid mutating media library data.
It runs `bun run src/cli.ts` by default; set `JELLYFIN_E2E_USE_DIST=1` to force `dist/cli.js`.
The suite also auto-loads auth from `~/.jellyfin-cli/settings.json` when env vars are not set.
For unit/coverage runs, prefer not exporting `JELLYFIN_*` globally; command tests use isolated env,
and live checks should be run explicitly as above.

When strict read-only mode is enabled, base `jf setup` is still allowed because it only updates
local CLI config (`~/.jellyfin-cli/settings.json`) and does not mutate server data.
Mutating setup endpoints (for example `setup update-configuration`) remain blocked.

For explicit installed-binary smoke checks (`jf-cli`) with format/schema validation:

```bash
export JELLYFIN_READ_ONLY=1
export JELLYFIN_TIMEOUT=120000

jf-cli --format json config doctor
jf-cli --format yaml system info
jf-cli --format markdown users me
jf-cli system --help
jf-cli system info --help
jf-cli --format json years list --limit 5
jf-cli --format toon items list --limit 1 | jf-cli schema validate items --from toon
# Direct official TOON decoder check
jf-cli --format toon system info \
  | bun -e "import { decode } from '@toon-format/toon'; const s=await new Response(Bun.stdin.stream()).text(); const d=decode(s); if (d?.type !== 'system_info') process.exit(1)"
# JSON parse check
jf-cli --format json config doctor | jq '.checks.connection_ok and .checks.auth_ok and .checks.openapi_available'

# YAML parse check (via Bun + yaml parser dependency)
jf-cli --format yaml system info \
  | bun -e "import YAML from 'yaml'; const s=await new Response(Bun.stdin.stream()).text(); const d=YAML.parse(s); if (!d?.ServerName || !d?.Version) process.exit(1)"
```

These commands are read-only and verify that key output formats remain machine-parseable.
The `--help` checks above ensure global flags are discoverable from every command surface.

## 5) Run discovery diagnostics against live server

```bash
jf config doctor
jf setup validate --require-all --validate-formats --format json
jf config doctor --validate-formats --format json
jf config doctor --validate-formats --require-connected --require-auth --require-openapi --require-valid-formats --format json
jf schema openapi --include-paths --method GET --for-command "items list" --limit 25
jf schema openapi --endpoint /api-docs/openapi.json --read-only-ops --limit 25
jf schema research --include-unmatched --require-coverage 100 --limit 20
jf schema tools --command system --limit 10
jf schema coverage --method GET --command-prefix system --min-score 3 --require-coverage 100 --limit 20
jf schema suggest --for-command "users list" --limit 10
```

All commands above are read-only and provide machine-parseable discovery output for agent workflows.

## 6) Verify executable names

Installed binaries:

- `jf`
- `jellyfin-cli`
- `jf-cli`

Smoke check executable behavior before release:

```bash
bun run build
node dist/cli.js --help
node dist/cli.js --version
```

Published package usage (post-publish verification):

```bash
bunx jellyfin-cli --help
npx jellyfin-cli --help
```

## 7) Final git hygiene

```bash
git status
git diff --stat
bun run check:secrets
bun run check:secrets:history
```

Confirm there are no local credential files or private values staged for commit.
If you set temporary env vars in your shell, clear them before release (`unset JELLYFIN_API_KEY JELLYFIN_PASSWORD`).

## 8) Changelog state

Never edit [../CHANGELOG.md](../CHANGELOG.md) manually. Ensure every user-visible or security-relevant change is represented by a closed, classified pm item, then run `bun run changelog:pm` after the final tracker mutation. Historical releases are preserved by each pm item's explicit release metadata.
