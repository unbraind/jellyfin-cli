# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Repository-local `pm` project governance with detailed goals, epics, issues, tasks, evidence, and append-only history.
- Explicit active-playback indicators and richer current-item/play-state details for session output.

### Changed
- `sessions list` and `sessions get` now honor all documented global and command-local output formats.
- Runtime support now starts at Node.js 22.13; CI and release workflows use Node 22.13 and Bun 1.3.11.
- Runtime and development dependencies, ESLint flat configuration, and GitHub Actions were upgraded to maintained releases.
- Removed the unused `ora` runtime dependency.

### Fixed
- Stale release documentation that still described the project as unreleased.
- Existing dead assignments surfaced by the updated lint toolchain.

### Security
- Updated the npm resolution graph to patched versions with zero `npm audit` findings.
- Prevented manual release inputs from being interpolated directly into privileged workflow shell scripts.

## [2026.3.6] - 2026-03-06

### Added
- Command-level hook coverage tests for CLI post-action behavior.

### Changed
- Refactored CLI bootstrap wiring into a reusable program builder for improved maintainability and testability.

## [2026.3.4] - 2026-03-04

### Added
- First public release of `jellyfin-cli`.
- End-to-end release workflows for GitHub and npm publishing.
- Commit-quality and security scanning workflows.
- Local and CI verification for both `npx` and `bunx` execution.

### Changed
- Project versioning policy standardized to `YYYY.M.D` / `YYYY.M.D-N` (UTC day, SemVer-compatible).
- Release documentation and contributor guidance hardened for production use.

### Security
- Tracked-file and full git-history secret scanning integrated into release gates.
