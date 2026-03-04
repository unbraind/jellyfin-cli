# Contributing to jellyfin-cli

Thanks for contributing.

## Development setup

```bash
bun install
bun run dev --help
```

npm users can run the same checks after `npm ci` (Bun is still required for runtime/build scripts).

## Project principles

- Default output must remain agent-parseable (Toon format)
- Keep strict TypeScript safety
- Preserve consistent structured error output
- Avoid interactive prompts for core command workflows

## Required checks before opening a PR

```bash
bun run typecheck
bun run lint
bun test
bun run build
bun run smoke:dist
bun run check:file-length
bun run check:secrets
bun run check:secrets:history
bun run pack:dry-run
bun run smoke:npx
```

For release-related changes:

```bash
bun run version:sync
bun run check:version
bun run validate:release
```

## Pull request guidelines

- Keep changes focused and atomic
- Update docs for user-facing command or output changes
- Add/adjust tests for behavior changes
- Never commit credentials or private server details

## Commit messages

Use concise, imperative Conventional Commit subjects:

- Format: `<type>(<scope>): <subject>`
- Keep subject line <= 72 chars
- Use lowercase type/scope
- Recommended types: `feat`, `fix`, `docs`, `chore`, `ci`, `build`, `test`, `refactor`, `perf`, `revert`

Examples:

- `feat(schema): add openapi coverage suggestion output`
- `fix(config): enforce output format validation`
- `docs: update release readiness checklist`

PR titles are validated in CI to match this style.

## Security

If you find a vulnerability, do not open a public issue.
Report it via [SECURITY.md](SECURITY.md).
