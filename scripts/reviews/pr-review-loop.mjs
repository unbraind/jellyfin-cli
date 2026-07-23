#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

function runGh(args, input) {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    input,
    stdio: [input === undefined ? 'inherit' : 'pipe', 'pipe', 'inherit'],
  }).trim();
}

function fail(message) {
  if (message) console.error(message);
  console.error(`Usage:
  node scripts/reviews/pr-review-loop.mjs inventory [--pr <number>] [--repo <owner/name>]
  node scripts/reviews/pr-review-loop.mjs react --node-id <id> --reaction <THUMBS_UP|THUMBS_DOWN|...>
  node scripts/reviews/pr-review-loop.mjs reply-inline --comment-id <id> --body <text> [--pr <number>] [--repo <owner/name>]
  node scripts/reviews/pr-review-loop.mjs resolve-thread --thread-id <id>`);
  process.exit(2);
}

function parseArgs(argv) {
  const [command = 'inventory', ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (!flag?.startsWith('--') || value === undefined) fail(`Invalid argument: ${flag ?? ''}`);
    options[flag.slice(2)] = value;
  }
  return { command, options };
}

function resolveTarget(options) {
  const repo = options.repo
    ?? JSON.parse(runGh(['repo', 'view', '--json', 'nameWithOwner'])).nameWithOwner;
  const pr = Number(
    options.pr ?? JSON.parse(runGh(['pr', 'view', '--json', 'number'])).number,
  );
  if (!repo.includes('/') || !Number.isInteger(pr) || pr <= 0) {
    fail('A valid repository and PR are required.');
  }
  const [owner, name] = repo.split('/');
  return { repo, owner, name, pr };
}

const inventoryQuery = `
query ReviewInventory(
  $owner: String!, $name: String!, $pr: Int!,
  $commentCursor: String, $reviewCursor: String, $threadCursor: String
) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $pr) {
      number url headRefOid updatedAt
      comments(first: 100, after: $commentCursor) {
        pageInfo { hasNextPage endCursor }
        nodes { id databaseId author { login } body createdAt updatedAt reactionGroups { content users { totalCount } viewerHasReacted } }
      }
      reviews(first: 100, after: $reviewCursor) {
        pageInfo { hasNextPage endCursor }
        nodes { id databaseId author { login } body state submittedAt updatedAt reactionGroups { content users { totalCount } viewerHasReacted } }
      }
      reviewThreads(first: 100, after: $threadCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id isResolved isOutdated path line originalLine
          comments(first: 100) {
            pageInfo { hasNextPage endCursor }
            nodes { id databaseId author { login } body createdAt updatedAt reactionGroups { content users { totalCount } viewerHasReacted } }
          }
        }
      }
    }
  }
}`;

const threadCommentsQuery = `
query ThreadComments($threadId: ID!, $cursor: String) {
  node(id: $threadId) {
    ... on PullRequestReviewThread {
      comments(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes { id databaseId author { login } body createdAt updatedAt reactionGroups { content users { totalCount } viewerHasReacted } }
      }
    }
  }
}`;

function graphql(query, variables) {
  const args = ['api', 'graphql', '-f', `query=${query}`];
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined && value !== null) args.push('-F', `${key}=${value}`);
  }
  return JSON.parse(runGh(args));
}

function fetchInventory(target) {
  const comments = [];
  const reviews = [];
  const reviewThreads = [];
  const cursors = {
    commentCursor: undefined,
    reviewCursor: undefined,
    threadCursor: undefined,
  };
  const exhausted = {
    commentCursor: false,
    reviewCursor: false,
    threadCursor: false,
  };
  let header;
  let hasNextPage = true;

  while (hasNextPage) {
    const payload = graphql(inventoryQuery, {
      owner: target.owner,
      name: target.name,
      pr: target.pr,
      ...cursors,
    });
    const page = payload.data.repository.pullRequest;
    header ??= {
      number: page.number,
      url: page.url,
      headRefOid: page.headRefOid,
      updatedAt: page.updatedAt,
    };
    comments.push(...page.comments.nodes);
    reviews.push(...page.reviews.nodes);
    reviewThreads.push(...page.reviewThreads.nodes);
    const connections = [page.comments, page.reviews, page.reviewThreads];
    const cursorKeys = ['commentCursor', 'reviewCursor', 'threadCursor'];
    connections.forEach((connection, index) => {
      const key = cursorKeys[index];
      if (!exhausted[key]) {
        cursors[key] = connection.pageInfo.endCursor;
        exhausted[key] = !connection.pageInfo.hasNextPage;
      }
    });
    hasNextPage = connections.some((connection) => connection.pageInfo.hasNextPage);
  }

  for (const thread of reviewThreads) {
    let connection = thread.comments;
    while (connection.pageInfo.hasNextPage) {
      const payload = graphql(threadCommentsQuery, {
        threadId: thread.id,
        cursor: connection.pageInfo.endCursor,
      });
      connection = payload.data.node.comments;
      thread.comments.nodes.push(...connection.nodes);
      thread.comments.pageInfo = connection.pageInfo;
    }
  }

  return {
    ...header,
    comments: { nodes: comments },
    reviews: { nodes: reviews },
    reviewThreads: { nodes: reviewThreads },
  };
}

function addReaction(nodeId, reaction) {
  const valid = new Set([
    'THUMBS_UP',
    'THUMBS_DOWN',
    'LAUGH',
    'HOORAY',
    'CONFUSED',
    'HEART',
    'ROCKET',
    'EYES',
  ]);
  if (!nodeId || !valid.has(reaction)) fail('A valid --node-id and --reaction are required.');
  const mutation = `mutation($subjectId: ID!, $content: ReactionContent!) {
    addReaction(input: { subjectId: $subjectId, content: $content }) { reaction { content } }
  }`;
  return runGh([
    'api',
    'graphql',
    '-f',
    `query=${mutation}`,
    '-F',
    `subjectId=${nodeId}`,
    '-F',
    `content=${reaction}`,
  ]);
}

function main(argv = process.argv.slice(2)) {
  const { command, options } = parseArgs(argv);
  if (command === 'inventory') {
    const target = resolveTarget(options);
    console.log(JSON.stringify({ repository: target.repo, pullRequest: fetchInventory(target) }, null, 2));
    return;
  }
  if (command === 'react') {
    console.log(addReaction(options['node-id'], options.reaction));
    return;
  }
  if (command === 'reply-inline') {
    const target = resolveTarget(options);
    if (!options['comment-id'] || !options.body) {
      fail('reply-inline requires --comment-id and --body.');
    }
    console.log(runGh([
      'api',
      `repos/${target.repo}/pulls/${target.pr}/comments/${options['comment-id']}/replies`,
      '-f',
      `body=${options.body}`,
    ]));
    return;
  }
  if (command === 'resolve-thread') {
    if (!options['thread-id']) fail('resolve-thread requires --thread-id.');
    const mutation = `mutation($threadId: ID!) {
      resolveReviewThread(input: { threadId: $threadId }) { thread { id isResolved } }
    }`;
    console.log(runGh([
      'api',
      'graphql',
      '-f',
      `query=${mutation}`,
      '-F',
      `threadId=${options['thread-id']}`,
    ]));
    return;
  }
  fail(`Unknown command: ${command}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
