# Release Readiness

Use this checklist before creating a GitHub release or publishing to npm.

## 1) Configure auth outside the repository

Store credentials only in env vars or in `~/.jellyfin-cli/settings.json`:

```bash
jf setup --server http://your-jellyfin-host:8096 --api-key "$JELLYFIN_API_KEY"
```

The CLI writes `settings.json` with owner-only permissions (`0600`) on supported platforms.

You can inspect exported values without revealing secrets:

```bash
jf setup env --shell
jf setup env --format json
```

## 2) Sync date+commit version

```bash
bun run version:sync
```

Version format is required: `YYYY.MM.DD-<commitIndex>` (example: `2025.12.31-10`).

## 3) Run full release validation

```bash
bun run validate:release
```

This runs:

- TypeScript checks (`bun run typecheck`)
- Lint (`bun run lint`)
- Full tests (`bun run test`)
- Build (`bun run build`)
- Version policy check (`bun run check:version`)
- Source LOC guard (`bun run check:file-length`)
- Secret scan on tracked files (`bun run check:secrets`)

## 4) Run live read-only CLI E2E checks

```bash
export JELLYFIN_READ_ONLY=1
export JELLYFIN_TIMEOUT=120000
bun test tests/e2e/cli.test.ts
```

The E2E suite is read-only and is designed to avoid mutating media library data.
It runs `bun run src/cli.ts` by default; set `JELLYFIN_E2E_USE_DIST=1` to force `dist/cli.js`.
The suite also auto-loads auth from `~/.jellyfin-cli/settings.json` when env vars are not set.

## 5) Run discovery diagnostics against live server

```bash
jf config doctor
jf schema openapi --include-paths --method GET --for-command "items list" --limit 25
jf schema tools --command system --limit 10
jf schema coverage --method GET --command-prefix system --min-score 3 --limit 20
```

All commands above are read-only and provide machine-parseable discovery output for agent workflows.

## 6) Verify executable names

Installed binaries:

- `jf`
- `jellyfin-cli`
- `jf-cli`

## 7) Final git hygiene

```bash
git status
git diff --stat
bun run check:secrets
```

Confirm there are no local credential files or private values staged for commit.
If you set temporary env vars in your shell, clear them before release (`unset JELLYFIN_API_KEY JELLYFIN_PASSWORD`).
