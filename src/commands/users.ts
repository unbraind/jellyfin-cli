import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';
import { addAdminCommands } from './users-admin.js';

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

  cmd
    .command('create <username>')
    .description('Create a new user')
    .option('-f, --format <format>', 'Output format')
    .option('--password <password>', 'User password')
    .action(async (username, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.createUser({ Name: username, Password: options.password });
        console.log(toon.formatToon({
          id: result.Id,
          name: result.Name,
          server_id: result.ServerId,
          created: true,
        }, 'user_created'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('update-password <userId>')
    .description('Update user password')
    .option('-f, --format <format>', 'Output format')
    .option('--current <password>', 'Current password')
    .option('--new <password>', 'New password')
    .action(async (userId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.updateUserPassword(userId, {
          CurrentPw: options.current,
          NewPw: options.new,
        });
        console.log(toon.formatMessage(`Password updated for user ${userId}`, true));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('delete <userId>')
    .description('Delete a user')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (userId, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm deletion');
        process.exit(1);
      }
      try {
        await client.deleteUser(userId);
        console.log(toon.formatMessage(`User ${userId} deleted`, true));
      } catch (err) {
        handleError(err, format);
      }
    });

  addAdminCommands(cmd);

  cmd.command('public').description('List public (non-hidden) users (no auth required)')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const users = await client.getPublicUsers();
        console.log(toon.formatUsers(users));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
