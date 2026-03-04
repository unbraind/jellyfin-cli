import type { OpenApiOperationEntry } from '../utils/openapi.js';

export type UnmatchedTagSummary = {
  tag: string;
  operations: number;
  sample_paths: string[];
};

type TagBucket = {
  count: number;
  samplePaths: Set<string>;
};

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
