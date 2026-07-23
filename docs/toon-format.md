# TOON Output Format

TOON (Token-Oriented Object Notation) is the default `jellyfin-cli` output format. The CLI uses the
official [`@toon-format/toon`](https://github.com/toon-format/toon) encoder and decoder, rather than
treating YAML as TOON.

TOON represents the JSON data model with indentation for nested objects, explicit array lengths, and
tabular rows for uniform arrays. It is compact for LLM context while remaining deterministic and
losslessly decodable.

## Output Envelope

Every TOON response has a stable `type` and `data` envelope:

```toon
type: user
data:
  id: user-1
  name: steve
  admin: true
```

The `type` identifies the semantic payload. `data` is the command result after the command-specific
normalization and secret-redaction rules have run. Undefined object properties are omitted; explicit
`null`, empty strings, empty objects, and empty arrays are preserved.

An empty list remains distinguishable from missing data:

```toon
type: items
data: []
```

## Uniform Arrays

The official encoder collapses uniform object arrays into a counted table. Field names appear once:

```toon
type: users
data[2]{id,name,admin,disabled}:
  user-1,steve,true,false
  user-2,viewer,false,false
```

The `[2]` declares the row count and `{id,name,admin,disabled}` declares the row schema. Strict
decoding rejects a mismatched count or row shape.

Nested fields can participate in a table header:

```toon
type: sessions
data[1]{id,user,client,is_playing,now{id,name,type},state{paused,muted}}:
  session-1,steve,Jellyfin Web,true,item-1,Example Movie,Movie,false,false
```

Non-uniform or deeply nested arrays use TOON's list representation instead:

```toon
type: operations
data[2]:
  - method: GET
    path: /System/Info
  - method: GET
    path: /Users
    tags[1]: User
```

## Scalar Rules

TOON scalars use the same value model as JSON:

- strings
- finite numbers
- booleans
- `null`
- arrays
- objects

Strings are quoted when required to preserve their value. URLs, timestamps, numeric-looking strings,
empty strings, and strings containing structural punctuation may therefore be quoted:

```toon
type: config
data:
  url: "http://server.example:8096"
  user: steve
  timeout: 30000
```

Consumers must decode TOON rather than parsing lines or removing quotes manually.

## Selecting a Format

TOON is the default:

```bash
jf users list
jf users list --format toon
jf --format toon users list
```

Other output formats remain independent:

```bash
jf users list --format json
jf users list --format yaml
jf users list --format table
jf users list --format raw
jf users list --format markdown
```

`yaml` is a separate format. It is not an alias for `toon`.

## Decoding and Round-Trip Validation

Use the official TypeScript package for programmatic decoding:

```typescript
import { decode } from '@toon-format/toon';
import { execFileSync } from 'node:child_process';

const serialized = execFileSync('jf', ['users', 'list', '--format', 'toon'], {
  encoding: 'utf8',
});
const payload = decode(serialized);
```

The decoder returns the JSON data model represented by the TOON document. In strict mode (the
default), it validates declared array lengths and tabular row counts.

The CLI also exposes a schema-aware validation command:

```bash
jf users list --format toon |
  jf schema validate users --from toon --format json
```

Example result:

```json
{
  "valid": true,
  "expected_type": "users",
  "detected_type": "users",
  "error_count": 0,
  "errors": []
}
```

`--from auto` attempts JSON, then strict TOON, then YAML. Prefer an explicit input format in CI so a
document cannot be accepted under the wrong serialization contract.

## Schemas and Agent Discovery

Inspect the available output schemas and command tool definitions before building a consumer:

```bash
jf schema list --format json
jf schema user --format json
jf schema items --format json
jf schema tools --format json
```

Schemas describe the decoded envelope, not the textual layout. Decode TOON first, then validate the
resulting JSON data model.

The schema and live OpenAPI discovery commands are read-only:

```bash
jf schema openapi --format toon
jf schema research --include-unmatched --format toon
jf schema coverage --format toon
```

## Common Payloads

Success:

```toon
type: message
data:
  message: Operation completed
  success: true
```

Error:

```toon
type: error
data:
  error: Item not found
  success: false
  code: 404
```

Items:

```toon
type: items
data[2]{id,name,type,year,rating}:
  item-1,Example Movie,Movie,2026,8.1
  item-2,Example Series,Series,2025,7.9
```

Query result:

```toon
type: items
data:
  total: 2
  offset: 0
  items[2]{Id,Name,Type}:
    item-1,Example Movie,Movie
    item-2,Example Series,Series
```

System information:

```toon
type: system_info
data:
  name: Jellyfin
  version: 10.11.11
  id: server-id
  local_address: "http://server.example:8096"
  operating_system: Linux
  has_pending_restart: false
```

Actual fields vary by command and server response. Use `jf schema`, command help, and
[`api.md`](api.md) as the authoritative command contract.

## Error Handling

Errors written in TOON remain typed envelopes. Check `type` after decoding:

```typescript
import { decode, type JsonValue } from '@toon-format/toon';

function getErrorMessage(payload: JsonValue): string | undefined {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return undefined;
  }
  if (payload.type !== 'error' || typeof payload.data !== 'object' || payload.data === null) {
    return undefined;
  }
  const data = payload.data;
  return !Array.isArray(data) && typeof data.error === 'string' ? data.error : undefined;
}
```

The process exit code remains authoritative for success or failure. Structured output supplements
the exit code; it does not replace it.

## Security and Privacy

- Credentials are never intentionally included in formatted configuration output.
- Settings and OpenAPI caches stay below `~/.jellyfin-cli/` with owner-local permissions.
- Use `--read-only` or `JELLYFIN_READ_ONLY=1` for non-mutating automation.
- Do not log raw command output when it may contain library, user, device, or session data.
- Prefer `jf config doctor --format json` for redacted diagnostics.

## Best Practices for Agents

1. Decode TOON with the official decoder; do not use a YAML parser.
2. Check the process exit code and decoded `type` before reading `data`.
3. Respect declared array lengths and field headers.
4. Use JSON when another program lacks a TOON decoder.
5. Use `jf schema tools --format json` for function-calling metadata.
6. Enable read-only mode before live discovery or acceptance tests.
7. Keep credentials in environment variables or `~/.jellyfin-cli/settings.json`, never prompts,
   tracked fixtures, snapshots, or logs.

## References

- [Official TOON implementation](https://github.com/toon-format/toon)
- [TOON specification](https://github.com/toon-format/spec)
- [TOON TypeScript API](https://toonformat.dev/reference/api)
- [Agent integration](agent-integration.md)
- [CLI API reference](api.md)
- [Security](security.md)
