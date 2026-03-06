import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { isGithubStarPrompted, isGithubStarred, markGithubStarPrompted, markGithubStarred } from './config.js';

const REPO = 'unbraind/jellyfin-cli';
const REPO_URL = 'https://github.com/unbraind/jellyfin-cli';

function ghSpawn(args: string[]): boolean {
  const result = spawnSync('gh', args, { stdio: 'pipe', timeout: 5000 });
  return result.status === 0 && !result.error;
}

function isGhAvailable(): boolean {
  return ghSpawn(['--version']);
}

function isGhLoggedIn(): boolean {
  return ghSpawn(['auth', 'status']);
}

function isRepoStarred(): boolean {
  return ghSpawn(['api', `user/starred/${REPO}`]);
}

function starRepo(): boolean {
  return ghSpawn(['api', '--method', 'PUT', `user/starred/${REPO}`]);
}

function isTTY(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function printManualStarMessage(reason: string): void {
  console.log(`\n⭐  If you find jellyfin-cli useful, please star it on GitHub!`);
  console.log(`   ${reason}`);
  console.log(`   ${REPO_URL}\n`);
}

/**
 * Checks if the user has starred the jellyfin-cli GitHub repo and prompts them
 * to do so if they haven't. Only runs when:
 * - Terminal is interactive (TTY)
 * - `gh` CLI is available and authenticated
 * - The repo has not been starred yet
 */
export async function promptGithubStar(): Promise<void> {
  // Skip in non-interactive / piped environments
  if (!isTTY()) return;

  // Check local cache first to avoid slow API calls on every run.
  if (isGithubStarred() || isGithubStarPrompted()) return;

  // gh CLI must be available and authenticated.
  if (!isGhAvailable()) {
    printManualStarMessage('gh is not installed, so open this link manually:');
    markGithubStarPrompted();
    return;
  }
  if (!isGhLoggedIn()) {
    printManualStarMessage('gh is not authenticated, so open this link manually:');
    markGithubStarPrompted();
    return;
  }

  // Check the actual star status via GitHub API.
  if (isRepoStarred()) {
    markGithubStarred();
    markGithubStarPrompted();
    return;
  }

  // Prompt the user
  console.log(`\n⭐  If you find jellyfin-cli useful, please star it on GitHub!`);
  console.log(`   ${REPO_URL}\n`);
  const answer = await prompt('   Star the repo now with gh? [Y/n] ');

  if (!answer || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    if (starRepo()) {
      console.log('   ✓ Starred! Thank you — it really helps 🙏\n');
      markGithubStarred();
      markGithubStarPrompted();
    } else {
      console.log(`   Could not star automatically. Visit: ${REPO_URL}\n`);
      markGithubStarPrompted();
    }
  } else {
    console.log(`   No problem! You can star later at: ${REPO_URL}\n`);
    markGithubStarPrompted();
  }
}
