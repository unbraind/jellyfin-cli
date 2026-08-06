# Agent Integration Guide

`jellyfin-cli` is designed for non-interactive agents, LLM tool runners, and deterministic
automation. It combines:

- official TOON output by default;
- JSON, YAML, table, raw, and Markdown alternatives;
- semantic output types;
- JSON schemas and function-calling tool schemas;
- a global read-only guard;
- redacted request explanations;
- live OpenAPI discovery and coverage diagnostics.

## Safe Session Defaults

For discovery, planning, and tests against a real server, enable read-only mode before executing any
API command:

```bash
export JELLYFIN_READ_ONLY=1
export JELLYFIN_TIMEOUT=120000
```

Credentials belong in environment variables or `~/.jellyfin-cli/settings.json`. Do not place API
keys, passwords, server responses, media IDs, usernames, device inventories, or signed URLs in
prompts, tracked fixtures, snapshots, PM items, or CI logs.

Verify the profile without printing secrets:

```bash
jf config doctor \
  --validate-formats \
  --require-connected \
  --require-auth \
  --require-openapi \
  --require-valid-formats \
  --format json
```

## Output Contract

The default format is official Token-Oriented Object Notation (TOON):

```toon
type: users
data[2]{id,name,admin,disabled}:
  user-1,steve,true,false
  user-2,viewer,false,false
```

Every formatted TOON response has:

- `type`: the semantic output kind;
- `data`: the normalized command result.

Uniform arrays declare their length and fields once. Decode this format with an official TOON
decoder; a YAML parser is not a TOON decoder.

Use JSON when an automation runtime does not have a TOON decoder:

```bash
jf users list --format json
```

The selected serializer is applied at the final output boundary across dedicated API commands,
local configuration commands, success messages, and structured errors. An agent may therefore
treat successful `--format json` stdout as JSON rather than probing whether a command family
silently emitted the default TOON format. The release gate also rejects direct TOON renderer calls
from command handlers so new commands cannot bypass this contract.

See [`toon-format.md`](toon-format.md) for syntax, decoding, strict validation, and examples.

## TypeScript Integration

Use argument arrays rather than shell interpolation:

```typescript
import { decode, type JsonValue } from '@toon-format/toon';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function runJellyfin(args: string[]): Promise<JsonValue> {
  const { stdout, stderr } = await execFileAsync('jf', [...args, '--format', 'toon'], {
    env: {
      ...process.env,
      JELLYFIN_READ_ONLY: '1',
    },
    maxBuffer: 10 * 1024 * 1024,
  });

  if (stderr.trim()) {
    process.stderr.write(stderr);
  }
  return decode(stdout);
}

const result = await runJellyfin(['items', 'search', 'matrix']);
```

Do not construct a shell command from user input. `execFile` preserves argument boundaries and
avoids shell expansion.

## Process and Error Handling

The process exit code is authoritative. Failed commands also emit a structured error when the
selected output format supports it.

An agent runner should:

1. capture `stdout`, `stderr`, and the exit code separately;
2. decode `stdout` on success;
3. decode structured `stderr` when possible on failure;
4. never retry a mutating operation automatically;
5. redact identifiers and response fragments before logging.

Read-only mode blocks known mutating command paths before request execution:

```bash
JELLYFIN_READ_ONLY=1 jf sessions play SESSION_ID ITEM_ID
```

Use `--explain` for redacted request metadata:

```bash
JELLYFIN_READ_ONLY=1 jf --explain system info --format json
```

Explanation data is written to `stderr`, leaving the machine-readable payload on `stdout`.

## Tool Schema Discovery

Export function-calling metadata instead of scraping help:

```bash
jf schema tools --format json
jf schema tools --command items --limit 50 --format json
jf schema tools --command "system info" --openapi-match --format json
```

Each tool record includes:

- a stable tool name;
- the full `jf` command path;
- description;
- argument and option schema;
- read-only safety classification;
- optional likely OpenAPI operation matches.

Tool schemas describe invocation inputs. Output schemas are available separately:

```bash
jf schema list --format json
jf schema items --format json
jf schema user --format json
```

## Validating Output

Validate the decoded envelope against the built-in schema registry:

```bash
jf items list --limit 1 --format toon |
  jf schema validate items --from toon --format json
```

Use explicit `--from toon`, `--from json`, or `--from yaml` in CI. `--from auto` is useful
interactively but should not replace a declared serialization contract.

The TOON path uses the official strict decoder, including array-length and tabular-row validation.

## Live API Research

The local server is the primary contract source:

```bash
jf schema openapi --include-paths --limit 50 --format json
jf schema versions --format json
jf schema research --include-unmatched --limit 100 --format json
jf schema coverage --read-only-ops --include-unmatched --limit 100 --format json
```

Useful focused queries:

```bash
jf schema openapi --method GET --tag Users --read-only-ops --format json
jf schema suggest --for-command "users list" --limit 10 --format json
jf schema tools --command users --openapi-match --format json
```

Intent coverage is a naming/mapping diagnostic. It does not prove that every operation has an
executable, semantically complete command. For implementation decisions, inspect operation IDs,
request/response schemas, command behavior, tests, and read-only live evidence together.

Treat the tool classifications as disjoint sets. `unmatched_tools` are genuine direct-mapping
candidates; `local_only_tools` need no server endpoint; and `non_endpoint_tools` already use an
OpenAPI orchestration, WebSocket, or optional plugin transport. Agents should not create endpoint
implementation tasks from the latter two lists.

## Version Compatibility

Before an upgrade, discover and compare the configured server's official core version with the
current candidate:

```bash
jf schema versions --format toon
jf schema compatibility \
  --target-version latest-preview \
  --allow-prerelease \
  --fail-on-breaking \
  --format toon
```

The default baseline is the exact official artifact matching the live server's declared API version.
This keeps plugin-provided operations out of core upgrade findings. Use `--baseline live` only when
you intentionally want a server/plugin drift audit.

The report separates artifact identity (for example, `12.0-rc4`) from the OpenAPI document version
(`12.0.0`) and classifies removed operations, operation ID changes, parameter requiredness and
schema changes, request content types, response statuses, and component schemas. Prerelease
artifacts require explicit opt-in. Official downloads never receive server credentials, and cached
documents stay under `~/.jellyfin-cli/cache/openapi`.

`latest-stable` and `latest-preview` are resolved from Jellyfin's official GitHub releases at
execution time and then validated against the exact official OpenAPI artifact. This keeps automation
current without weakening prerelease opt-in.

## Exact Operation Execution

Use typed commands first. When an endpoint has no ergonomic typed surface—or an agent needs a
forward-compatible exact contract—resolve and invoke its OpenAPI operation ID:

```bash
jf api inspect GetUserById --format json
jf api get GetUserById --path-param userId=USER_ID --format toon
```

The CLI rejects unknown operation IDs, undeclared query/path parameters, missing required inputs,
unsupported request content types, and oversized responses. Binary responses are base64-encoded
inside the normal structured envelope.

The inspection response is the canonical request-construction contract for agents. It includes
merged path- and operation-level parameters, bounded recursive schema metadata, declared request
content types, response status/content types, security alternatives, and an
`invocation.argv_template`. Fill placeholders explicitly; inspection never sends an API request.

For related reads, submit one strict manifest so the CLI can resolve the schema once and preflight
the entire plan before execution:

```bash
printf '%s' '{
  "version": 1,
  "requests": [
    {"id": "server", "operation_id": "GetPublicSystemInfo"},
    {
      "id": "user",
      "operation_id": "GetUserById",
      "path_params": {"userId": "USER_ID"}
    }
  ]
}' | jf api batch --stdin --dry-run --format toon
```

Remove `--dry-run` after inspecting the resolved plan. Batches accept only read-only HTTP methods,
preserve input order and caller IDs, reuse one authenticated client, and enforce request-count,
per-response, and aggregate byte ceilings. One invalid manifest entry prevents every network
operation. Runtime HTTP failures are returned per request and make the process exit nonzero.

Mutations are intentionally separate:

```bash
jf api mutate UpdateDeviceOptions \
  --path-param deviceId=DEVICE_ID \
  --body-json '{"CustomName":"Living room"}' \
  --confirm
```

`api mutate` is classified as unsafe in exported tool schemas and is blocked before execution by
`JELLYFIN_READ_ONLY=1` / `--read-only`. `--explain` reports only body content type and byte length
for generic calls; it never writes body contents to diagnostics.

## Real-Time Event Automation

Jellyfin's WebSocket messages are not described by OpenAPI. Discover the supported 10.11 contract
locally, then request a bounded window:

```bash
jf events types --format toon
JELLYFIN_READ_ONLY=1 jf events watch \
  --subscribe sessions \
  --type Sessions \
  --count 2 \
  --duration 15 \
  --format toon
```

For a low-latency pipeline, use newline-delimited JSON:

```bash
JELLYFIN_READ_ONLY=1 jf events watch \
  --type LibraryChanged UserDataChanged \
  --count 20 \
  --duration 60 \
  --stream \
  --format json |
while IFS= read -r record; do
  printf '%s\n' "$record" | jf schema validate event_stream_record --from json --format json
done
```

The last line is always a `kind: "summary"` record. Earlier lines are ordered `kind: "event"`
records. Treat payloads as private server data: process them in memory, select only required
fields, and do not store raw records in prompts, CI logs, PM, or source control.

## Help Discovery

Every command exposes local help and inherited global options:

```bash
jf --help
jf items --help
jf items search --help
```

Global options:

- `--format <toon|json|table|raw|yaml|markdown>`
- `--server <name>`
- `--explain`
- `--read-only`
- `--help`
- `--version`

Prefer tool schemas for automated invocation and help text for human inspection.

## Pagination

List/search commands generally expose `--limit` and an offset/start option when supported by the
Jellyfin endpoint. Agents should:

1. request a bounded page;
2. inspect the returned total/count fields;
3. advance the offset deterministically;
4. stop when the page is empty or the total is reached;
5. enforce their own maximum result and byte budgets.

Never fetch an unbounded media library solely to answer a narrow question.

## Server Selection

Named profiles keep credentials and preferences outside the repository:

```bash
jf config list --format json
jf --server home system info
```

Environment values override the active profile for ephemeral automation:

```bash
JELLYFIN_SERVER_URL=http://server.example:8096 \
JELLYFIN_API_KEY=redacted \
JELLYFIN_READ_ONLY=1 \
jf system info --format json
```

Never echo or trace those variables. Use CI secret masking and disable shell tracing around
credential setup.

## Setup Automation

The interactive wizard is intended for humans:

```bash
jf setup
```

Agents should use explicit configuration and readiness commands:

```bash
jf setup status --format json
jf setup env --format json
jf setup validate --require-all --validate-formats --format json
```

Writing a local environment file is an explicit local mutation. Review the target and permissions
before using `jf setup env --write-file`.

## Performance and Context Efficiency

- Prefer TOON for large uniform lists consumed by an LLM.
- Prefer JSON for `jq`, typed pipelines, and runtimes without a TOON decoder.
- Use `--limit` and command filters before execution.
- Use schema/tool discovery once and cache only non-sensitive results.
- Avoid repeating full OpenAPI or library inventories in prompts.
- Treat signed media/image URLs as secrets until they expire.

## Production Checklist

- Read-only mode is enabled for discovery and tests.
- Credentials are resolved only from environment variables or the owner-local settings file.
- Command arguments are passed without a shell.
- Exit code, `stdout`, and `stderr` are handled separately.
- TOON is decoded by an official decoder.
- The decoded envelope is schema-validated where contracts cross trust boundaries.
- Pagination and output-byte limits are bounded.
- Logs redact server, user, device, media, session, and URL identifiers.
- `jf config doctor` and `jf setup validate` pass required checks.
- The actual packaged `jf-cli` binary has passed read-only live tests.

## References

- [TOON output contract](toon-format.md)
- [CLI API reference](api.md)
- [Live API research](api-research.md)
- [Security](security.md)
- [Release readiness](release-readiness.md)
- [Troubleshooting](troubleshooting.md)
