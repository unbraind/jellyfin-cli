import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createBackupCommand(): Command {
  const cmd = new Command('backup');

  cmd.command('list').description('List available backups')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const backups = await client.getBackups();
        console.log(toon.formatToon(backups.map((b) => ({
          name: b.Name,
          path: b.Path,
          size: b.Size,
          date: b.Date,
        })), 'backups'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('create').description('Create a backup')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.createBackup();
        console.log(toon.formatMessage('Backup created successfully', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('restore <backupPath>').description('Restore from a backup')
    .option('-f, --format <format>', 'Output format')
    .action(async (backupPath, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.restoreBackup(backupPath);
        console.log(toon.formatMessage(`Backup restored from ${backupPath}`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('delete <backupPath>').description('Delete a backup')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (backupPath, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm deletion');
        process.exit(1);
      }
      try {
        await client.deleteBackup(backupPath);
        console.log(toon.formatMessage(`Backup ${backupPath} deleted`, true));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
