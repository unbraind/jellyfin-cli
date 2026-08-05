import { Command } from 'commander';
import { createApiClient, formatMessage, formatToon, handleError } from './utils.js';

/**
 * Builds the notifications command tree with validated options and actions.
 * @returns - The configured Commander command tree.
 */
export function createNotificationsCommand(): Command {
  const cmd = new Command('notifications');

  cmd
    .command('types')
    .description('List notification types (requires Notifications plugin)')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const types = await client.getNotificationTypes();
        const simplified = types.map((t) => ({
          type: t.Type,
          name: t.Name,
          enabled: t.Enabled,
          category: t.Category,
        }));
        console.log(formatToon(simplified, format, 'notification_types'));
      } catch (err) {
        if (err instanceof Error && err.message.includes('404')) {
          console.log(formatToon({
            available: false,
            message: 'Optional notification endpoint is not available on this server',
          }, format, 'notification_types'));
        } else {
          handleError(err, format);
        }
      }
    });

  cmd
    .command('list')
    .description('List user notifications')
    .option('-f, --format <format>', 'Output format')
    .option('--user <userId>', 'User ID')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getNotifications(options.user);
        const simplified = (result.Notifications ?? []).map((n) => ({
          id: n.Id,
          name: n.Name,
          description: n.Description,
          level: n.Level,
          is_read: n.IsRead,
          date: n.Date,
          url: n.Url,
        }));
        console.log(formatToon(simplified, format, 'notifications'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('send')
    .description('Send admin notification')
    .requiredOption('--name <name>', 'Notification name')
    .option('--description <text>', 'Notification description')
    .option('--url <url>', 'URL')
    .option('--level <level>', 'Notification level (Normal, Warning, Error)')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.sendAdminNotification({
          name: options.name,
          description: options.description,
          url: options.url,
          level: options.level,
        });
        console.log(formatMessage('Notification sent', format));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
