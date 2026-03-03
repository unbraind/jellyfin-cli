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
```

## 2) Run full release validation

```bash
bun run validate:release
```

This runs:

- TypeScript checks (`bun run typecheck`)
- Lint (`bun run lint`)
- Full tests (`bun run test`)
- Build (`bun run build`)
- Source LOC guard (`bun run check:file-length`)
- Secret scan on tracked files (`bun run check:secrets`)

## 3) Run live read-only CLI E2E checks

```bash
export JELLYFIN_READ_ONLY=1
bun test tests/e2e/cli.test.ts
```

The E2E suite is read-only and is designed to avoid mutating media library data.

## 4) Run discovery diagnostics against live server

```bash
jf config doctor
jf schema openapi --include-paths --method GET --for-command "items list" --limit 25
jf schema tools --command system --limit 10
```

All commands above are read-only and provide machine-parseable discovery output for agent workflows.

## 5) Verify executable names

Installed binaries:

- `jf`
- `jellyfin-cli`
- `jf-cli`

## 6) Final git hygiene

```bash
git status
git diff --stat
```

Confirm there are no local credential files or private values staged for commit.
