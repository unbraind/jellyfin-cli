import { matchOperationsForCommandIntent, type OpenApiOperationEntry } from '../utils/openapi.js';
import type { CliToolSchema } from '../utils/tool-schema.js';

export type UnmatchedTagSummary = {
  tag: string;
  operations: number;
  sample_paths: string[];
};

type TagBucket = {
  count: number;
  samplePaths: Set<string>;
};

export type UnmatchedToolSummary = {
  command: string;
  read_only_safe: boolean;
  reason: 'no_openapi_match_above_min_score' | 'local_only_command';
};

export type CoverageMappingResult = {
  mappedOperationKeys: Set<string>;
  mappedToolCount: number;
  unmatchedTools: UnmatchedToolSummary[];
  localOnlyTools: UnmatchedToolSummary[];
};

const LOCAL_ONLY_COMMANDS = new Set([
  'jf config delete',
  'jf config doctor',
  'jf config get',
  'jf config list',
  'jf config path',
  'jf config reset',
  'jf config set',
  'jf config test',
  'jf config use',
  'jf schema coverage',
  'jf schema list',
  'jf schema openapi',
  'jf schema research',
  'jf schema suggest',
  'jf schema tools',
  'jf schema validate',
  'jf setup env',
  'jf setup status',
]);

function isLocalOnlyCommand(command: string): boolean {
  return LOCAL_ONLY_COMMANDS.has(command);
}

export function mapOpenApiCoverageToTools(
  operations: OpenApiOperationEntry[],
  tools: CliToolSchema[],
  minScore: number,
): CoverageMappingResult {
  const mappedOperationKeys = new Set<string>();
  let mappedToolCount = 0;
  const unmatchedTools: UnmatchedToolSummary[] = [];
  const localOnlyTools: UnmatchedToolSummary[] = [];

  for (const tool of tools) {
    if (isLocalOnlyCommand(tool.command)) {
      localOnlyTools.push({
        command: tool.command,
        read_only_safe: tool.read_only_safe,
        reason: 'local_only_command',
      });
      continue;
    }

    const commandIntent = tool.command.replace(/^jf\s+/i, '').trim();
    const matches = matchOperationsForCommandIntent(operations, commandIntent).filter(
      (candidate) => candidate.score >= minScore,
    );
    if (matches.length === 0) {
      unmatchedTools.push({
        command: tool.command,
        read_only_safe: tool.read_only_safe,
        reason: 'no_openapi_match_above_min_score',
      });
      continue;
    }

    mappedToolCount += 1;
    const primaryMatch = matches.find(
      (candidate) => !mappedOperationKeys.has(`${candidate.method} ${candidate.path}`),
    ) ?? matches[0];
    mappedOperationKeys.add(`${primaryMatch.method} ${primaryMatch.path}`);

    const extraScoreThreshold = Math.max(minScore, primaryMatch.score - 2);
    for (const match of matches) {
      const key = `${match.method} ${match.path}`;
      if (key === `${primaryMatch.method} ${primaryMatch.path}`) {
        continue;
      }
      if (match.score < extraScoreThreshold || match.matchedOn.length < 2) {
        continue;
      }
      mappedOperationKeys.add(key);
    }
  }

  return {
    mappedOperationKeys,
    mappedToolCount,
    unmatchedTools,
    localOnlyTools,
  };
}

export function summarizeOperationsByTag(
  operations: OpenApiOperationEntry[],
  rowLimit = 10,
  samplePathsPerTag = 3,
): UnmatchedTagSummary[] {
  const buckets = new Map<string, TagBucket>();

  for (const operation of operations) {
    const tags = operation.tags.length > 0 ? operation.tags : ['untagged'];

    for (const tag of tags) {
      const bucket = buckets.get(tag) ?? { count: 0, samplePaths: new Set<string>() };
      bucket.count += 1;
      if (bucket.samplePaths.size < samplePathsPerTag) {
        bucket.samplePaths.add(operation.path);
      }
      buckets.set(tag, bucket);
    }
  }

  return Array.from(buckets.entries())
    .map(([tag, bucket]) => ({
      tag,
      operations: bucket.count,
      sample_paths: Array.from(bucket.samplePaths),
    }))
    .sort((a, b) => b.operations - a.operations || a.tag.localeCompare(b.tag))
    .slice(0, rowLimit);
}
