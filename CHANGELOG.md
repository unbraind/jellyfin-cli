# Changelog

## Unreleased

### Fixed

- Isolate public package verification from release checkout and authentication ([jf-jsqh](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/issues/jf-jsqh.toon))

## 2026.7.21 - 2026-07-21

### Added

- Automate change-aware daily releases with npm and Bun verification ([jf-tike](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/features/jf-tike.toon))
- Explicit active-playback indicators and richer current-item/play-state details for session output. ([jf-9for](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/features/jf-9for.toon))
- Repository-local `pm` project governance with detailed goals, epics, issues, tasks, evidence, and append-only history. ([jf-vuu5](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/features/jf-vuu5.toon))

### Changed

- Removed the unused `ora` runtime dependency. ([jf-n9ac](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/chores/jf-n9ac.toon))
- Runtime and development dependencies, ESLint flat configuration, and GitHub Actions were upgraded to maintained releases. ([jf-3tgy](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/chores/jf-3tgy.toon))
- Runtime support now starts at Node.js 22.13; CI and release workflows use Node 22.13 and Bun 1.3.11. ([jf-q16p](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/chores/jf-q16p.toon))
- `sessions list` and `sessions get` now honor all documented global and command-local output formats. ([jf-s956](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/chores/jf-s956.toon))
- Modernize GitHub Actions and compatible direct dependency majors ([jf-ff4n](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/tasks/jf-ff4n.toon))

### Fixed

- Make release changelog validation target-version aware ([jf-ss2e](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/issues/jf-ss2e.toon))
- Existing dead assignments surfaced by the updated lint toolchain. ([jf-1m42](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/issues/jf-1m42.toon))
- Stale release documentation that still described the project as unreleased. ([jf-43cu](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/issues/jf-43cu.toon))
- Fix sessions list output format and active playback fields ([jf-ddd7](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/issues/jf-ddd7.toon))
- Correct stale post-release documentation and runtime prerequisites ([jf-fdh1](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/issues/jf-fdh1.toon))
- Align Toon documentation with the emitted type and data envelope ([jf-w5ow](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/issues/jf-w5ow.toon))

### Security

- Updated the npm resolution graph to patched versions with zero `npm audit` findings. ([jf-gkit](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/chores/jf-gkit.toon))
- Security, dependency, correctness, and governance remediation ([jf-zifk](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/epics/jf-zifk.toon))
- Audit repository for additional security, correctness, quality, and release issues ([jf-kpor](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/tasks/jf-kpor.toon))
- Remediate npm dependency vulnerabilities and stale direct dependencies ([jf-ews0](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/tasks/jf-ews0.toon))
- Prevented manual release inputs from being interpolated directly into privileged workflow shell scripts. ([jf-n0m4](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/issues/jf-n0m4.toon))

## 2026.3.6 - 2026-03-06

### Added

- Command-level hook coverage tests for CLI post-action behavior. ([jf-fgfd](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/features/jf-fgfd.toon))

### Changed

- Refactored CLI bootstrap wiring into a reusable program builder for improved maintainability and testability. ([jf-ztoa](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/chores/jf-ztoa.toon))

## 2026.3.4 - 2026-03-04

### Added

- Local and CI verification for both `npx` and `bunx` execution. ([jf-7jxa](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/features/jf-7jxa.toon))
- End-to-end release workflows for GitHub and npm publishing. ([jf-mqvk](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/features/jf-mqvk.toon))
- First public release of `jellyfin-cli`. ([jf-vpw0](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/milestones/jf-vpw0.toon))

### Changed

- Release documentation and contributor guidance hardened for production use. ([jf-jnxj](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/chores/jf-jnxj.toon))
- Project versioning policy standardized to `YYYY.M.D` / `YYYY.M.D-N` (UTC day, SemVer-compatible). ([jf-qfdt](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/chores/jf-qfdt.toon))

### Security

- Tracked-file and full git-history secret scanning integrated into release gates. ([jf-gqxo](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/issues/jf-gqxo.toon))
- Commit-quality and security scanning workflows. ([jf-wemh](https://github.com/unbraind/jellyfin-cli/blob/main/.agents/pm/features/jf-wemh.toon))
