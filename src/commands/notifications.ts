import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createNotificationsCommand(): Command {
  const cmd = new Command('notifications');

  cmd
    .command('types')
    .description('List notification types')
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
        console.log(toon.formatToon(simplified, 'notification_types'));
      } catch (err) {
        handleError(err, format);
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
        console.log(toon.formatToon(simplified, 'notifications'));
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
        console.log(toon.formatMessage('Notification sent', true));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
