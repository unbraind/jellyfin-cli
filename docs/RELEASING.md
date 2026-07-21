# Automated Releases

`jellyfin-cli` uses the same two-stage release model as `pm-cli`: a daily change-aware driver prepares a checked release commit and tag, and the tag-triggered workflow publishes and verifies the immutable package.

## Release policy

- Versions are UTC calendar versions: `YYYY.M.D` for the first release of a day and `YYYY.M.D-N` for later releases.
- The scheduled driver runs daily at `02:35 UTC` and releases only when at least one non-tracker file changed after the latest reachable release tag.
- Commits that only change `.agents/pm/**` are retained as project evidence but do not publish a new CLI package.
- By default, only one release is created per UTC day. A maintainer may explicitly use `--allow-same-day-release` when a second same-day release is required.
- `CHANGELOG.md` is generated from closed pm items by the project-managed `pm-changelog` package using the explicitly pinned pm CLI version. Do not edit it manually.
- Publishing is idempotent: rerunning the tag workflow skips `npm publish` when the exact version already exists, then repeats public verification and GitHub Release creation.

## Architecture

The release path is deliberately split:

1. `.github/workflows/auto-release.yml` checks out full history, installs with both Node and Bun available, and calls `scripts/release/run-release-pipeline.mjs`.
2. The pipeline compares `HEAD` with the latest tag, ignores tracker-only changes, enforces the one-release-per-day guard, asks the npm registry for the next available calendar version, and installs `pm-changelog` through the pinned published pm CLI.
3. `pm changelog generate --mode replace --all-release-tags` rebuilds the entire changelog. Historical items use explicit `release` metadata, so the `2026.3.4` and `2026.3.6` sections remain stable while newly closed items enter the pending release.
4. The pipeline updates `package.json` and `package-lock.json`, runs `bun run validate:release`, generates release notes from the target changelog section, creates one release commit and tag, and pushes both atomically.
5. `.github/workflows/release.yml` runs for the pushed tag, verifies tag/package identity, repeats the complete release gate, publishes with npm provenance, verifies the exact registry version through npm metadata, `npx`, and `bunx --bun`, then creates the GitHub Release.

During release preparation, the pipeline sets `PM_CHANGELOG_RELEASE_VERSION` only for the validation subprocess. This makes `changelog:pm:check` compare the prepared versioned section with the same target used to generate it. Normal branch validation leaves the variable unset and continues to require the pending `Unreleased` form.

The tag push must use a maintainer token rather than the workflow `GITHUB_TOKEN`: GitHub does not recursively start another workflow from a tag created with the default token, and protected `main` may also require bypass rights. The release token is passed only to the atomic git push and is not persisted by checkout.

## npm and Bun publication semantics

There is one public package artifact and one registry publication. Bun uses `registry.npmjs.org` by default, and `bunx` installs package executables from npm. Therefore “publish to npm and Bun” means:

- publish `jellyfin-cli@<exact-version>` once to the npm registry with provenance;
- verify Node/npm consumption with `npx --package jellyfin-cli@<version> jf --version`;
- verify Bun installation and runtime execution with `bunx --bun --package jellyfin-cli@<version> jf --version`.

Publishing a second copy with `bun publish` would target the same npm registry and version, so it would be a duplicate publish rather than a separate Bun release.

## One-time GitHub and npm setup

Create or reuse a GitHub Environment named `release`, then configure:

- `NPM_TOKEN`: npm automation/granular token with publish access to `jellyfin-cli`. The release workflow exposes it only as `NODE_AUTH_TOKEN` for the publish step.
- `RELEASE_PAT`: maintainer fine-grained token with repository contents write access and permission to push through the configured `main` protection rules. Store it in the `release` environment.
- npm Trusted Publishing/provenance for this repository and `.github/workflows/release.yml`. The workflow grants only `contents: write` and `id-token: write`, runs on a GitHub-hosted runner, and publishes with `--provenance`.

Protect the `release` environment as appropriate for the repository, but do not add an approval rule to the scheduled path unless intentionally accepting that every daily release waits for manual approval.

## Changelog ownership and preservation

Install and generate through pm:

```bash
bun run changelog:pm:install
bun run changelog:pm
bun run changelog:pm:check
```

The checked-in `.agents/pm/extensions/.managed-extensions.json` records the project installation while vendored extension files remain ignored. Every legacy changelog bullet has a closed pm source item. The entries from prior releases carry `release: 2026.3.4` or `release: 2026.3.6`; current unreleased entries remain unassigned until the release pipeline supplies `--release-version`.

For a new user-visible change:

1. Create or reuse a duplicate-safe pm item before implementation.
2. Use type and tags to route it (`Feature`/`added`, `Issue`/`fixed`, `security`, `changed`, and so on).
3. Link files, docs, and tests while working.
4. Close the item with evidence before the final changelog generation.
5. Run `bun run changelog:pm` after the last tracker mutation and commit both tracker history and `CHANGELOG.md`.

If classification is wrong, fix it in the separately maintained `pm-changelog` package and consume the released fix here. Do not patch generated Markdown by hand.

## Local parity and dry runs

```bash
git fetch --tags --force
bun install --frozen-lockfile
bun run test:release
bun run changelog:pm:check
bun run validate:release

# Requires a clean working tree. Detects changes and runs gates without mutation.
bun run release:pipeline:dry-run -- --json
```

To inspect the next registry-safe version without changing files:

```bash
bun run version:next
```

`bun run version:sync` is retained for an intentional manual release preparation. It updates both npm manifests to the next registry-safe version; normal releases should let Auto Release do this.

Manual workflow dispatch defaults to `push: false`. Use that mode for a read-only gate run. A production dispatch requires `push: true`, `dry_run: false`, and the configured `RELEASE_PAT`.

## Failure and recovery

- Scheduled failure: Auto Release opens or updates `Auto Release blocked: scheduled run failed` with the run and commit. Fix the gate or secret and dispatch Auto Release again.
- No changes: JSON reports `no_changes_since_last_tag`; this is a successful no-op.
- Tracker-only changes: JSON reports `tracker_only_changes_since_last_tag`; this is a successful no-op.
- Release already today: JSON reports `release_already_cut_today`; changes remain eligible for the next UTC day.
- Empty generated section: the pipeline reports `empty_generated_changelog_section_for_target_version` and refuses to create an untraceable release. Close and classify the relevant pm item, regenerate, and retry.
- Tag workflow failed before publish: rerun `Release` with the existing tag after fixing the gate.
- npm publish succeeded but a later step failed: rerun `Release` with the same tag. It detects the existing npm version, skips the duplicate publish, repeats npm/npx/Bun verification, and repairs the GitHub Release.
- Tag/package mismatch: never move a published tag. Correct the release preparation before publishing a new version.

## Post-publish proof

```bash
VERSION=2026.7.21
npm view "jellyfin-cli@${VERSION}" version dist.integrity dist.unpackedSize --json
npx --yes --package "jellyfin-cli@${VERSION}" jf --version
bunx --bun --package "jellyfin-cli@${VERSION}" jf --version
gh release view "v${VERSION}" --json tagName,name,isDraft,isPrerelease,url
bun run release:verify-published -- --version "${VERSION}"
```

Always verify an exact version. `latest` can be cached or can advance during diagnosis.
