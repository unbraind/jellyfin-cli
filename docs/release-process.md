# Release Process

This project has not had a public release yet.
Use this process for the first release and all future releases.

## 1) Preconditions

- `main` is protected and required checks are green.
- No private data appears in working tree or history.
- Version follows `YYYY.MM.DD` or `YYYY.MM.DD-<N>` (UTC day, no `-1` suffix).

## 2) Validate locally

```bash
bun install
bun run version:sync
bun run validate:release
```

## 3) Prepare release candidate in GitHub Actions

Run `.github/workflows/release-prepare.yml` with target ref (`main` or release commit SHA).

Expected artifacts:
- `release-notes.md`
- `jellyfin-cli-<version>-dist.tar.gz`
- `SHA256SUMS.txt`

## 4) Final checks before publish

- Confirm `CHANGELOG.md` has the upcoming release notes.
- Confirm docs updates for any user-facing behavior changes.
- Confirm package identity:

```bash
node -p "require('./package.json').name"
node -p "require('./package.json').version"
bun run smoke:npx
```

## 5) Publish (manual, guarded)

Run `.github/workflows/release-publish.yml`:

- Use `dry_run: true` first.
- For real publish, set `dry_run: false` and `confirm_publish: YES_PUBLISH`.
- Preferred auth: npm Trusted Publishing (GitHub OIDC, no long-lived token).
- Fallback auth: set `NPM_TOKEN` GitHub secret if Trusted Publishing is not configured yet.

The workflow publishes to npm with provenance enabled.
It also verifies the published package can execute via both `npx` and `bunx`.

## 6) Create tag + GitHub release (manual)

Run `.github/workflows/release-github.yml`:

- `ref`: published release commit (usually `main`)
- optional `tag`: leave empty to use `v<package.version>`
- `confirm_release`: `YES_RELEASE`

This workflow creates an annotated tag and a GitHub release with generated notes.

## 7) Post-publish verification

```bash
bunx jellyfin-cli --help
npx jellyfin-cli --help
```

Also verify executable aliases:

```bash
jf --help
jellyfin-cli --help
jf-cli --help
```

Keep `Unreleased` open in `CHANGELOG.md` for the next cycle.
