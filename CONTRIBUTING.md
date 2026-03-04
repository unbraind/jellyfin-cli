# Contributing to jellyfin-cli

Thanks for contributing.

## Development setup

```bash
bun install
bun run dev --help
```

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
bun run check:file-length
bun run check:secrets
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

Use concise, imperative commit subjects. Examples:

- `feat(schema): add openapi coverage suggestion output`
- `fix(config): enforce output format validation`
- `docs: update release readiness checklist`

## Security

If you find a vulnerability, do not open a public issue.
Report it via [SECURITY.md](SECURITY.md).
