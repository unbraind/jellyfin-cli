import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createUsersCommand(): Command {
  const cmd = new Command('users');

  cmd
    .command('list')
    .description('List all users')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const users = await client.getUsers();
        console.log(toon.formatUsers(users));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('get <userId>')
    .description('Get user by ID')
    .option('-f, --format <format>', 'Output format')
    .action(async (userId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const user = await client.getUserById(userId);
        console.log(toon.formatUser(user));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('me')
    .description('Get current user info')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const user = await client.getCurrentUser();
        console.log(toon.formatUser(user));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('by-name <username>')
    .description('Get user by username')
    .option('-f, --format <format>', 'Output format')
    .action(async (username, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const users = await client.getUsers();
        const user = users.find((u) => u.Name?.toLowerCase() === username.toLowerCase());
        if (!user) {
          console.error(toon.formatError(`User '${username}' not found`));
          process.exit(1);
        }
        console.log(toon.formatUser(user));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
