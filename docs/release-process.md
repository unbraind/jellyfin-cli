# Release Process

Normal releases are automatic. The complete maintained procedure is in [Automated Releases](RELEASING.md).

## 1) Preconditions

- `main` is protected and required checks are green.
- No private data appears in working tree or history.
- Version follows `YYYY.M.D` or `YYYY.M.D-<N>` (UTC day, no `-1` suffix).

## 2) Validate locally

```bash
bun install
bun run changelog:pm:check
bun run validate:release
```

## 3) Let Auto Release prepare the candidate

`.github/workflows/auto-release.yml` runs daily and skips cleanly unless release-relevant changes exist after the latest tag. A manual dispatch defaults to a non-pushing gate run.

It computes the next calendar version, regenerates the complete changelog from pm, validates, and atomically pushes the release commit and tag.

## 4) Final checks before publish

- Confirm `CHANGELOG.md` has the upcoming release notes.
- Confirm docs updates for any user-facing behavior changes.
- Confirm package identity:

```bash
node -p "require('./package.json').name"
node -p "require('./package.json').version"
bun run smoke:npx
bun run smoke:bunx
```

## 5) Publish and verify (tag-driven)

The pushed tag starts `.github/workflows/release.yml`. It publishes once to the npm registry with provenance, then proves the exact package through `npx` and `bunx --bun`. Bun consumes npm packages; there is no separate Bun registry copy.

## 6) Create the GitHub Release

The same tag workflow creates the GitHub Release from the pm-generated version section. Rerunning it for an existing tag is safe: an already-published npm version is verified rather than republished.

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

Do not hand-edit `CHANGELOG.md`; close and classify pm items, then run `bun run changelog:pm` after the last tracker mutation.
