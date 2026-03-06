# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

No changes yet.

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
