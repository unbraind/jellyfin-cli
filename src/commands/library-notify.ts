import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

// Webhook-style notification commands — tell Jellyfin a file has changed so it rescans.
// Useful in CI/CD pipelines after moving/encoding media files.

export function createLibraryNotifyCommand(): Command {
  const cmd = new Command('library-notify');
  cmd.description('Notify Jellyfin of file-system changes (triggers targeted rescans)');

  cmd.command('media-updated').description('Notify Jellyfin that a media file has been updated')
    .option('-f, --format <format>', 'Output format')
    .option('--path <path>', 'Path of the updated media file')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.notifyLibraryMediaUpdated([{ Path: options.path, UpdateType: 'Modified' }]);
        console.log(toon.formatMessage('Library media update notification sent', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('movies-added').description('Notify Jellyfin that new movie files have been added')
    .option('-f, --format <format>', 'Output format')
    .option('--path <path>', 'Path of the added movie file')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.notifyMoviesAdded([{ Path: options.path, UpdateType: 'Created' }]);
        console.log(toon.formatMessage('Movie added notification sent', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('movies-updated').description('Notify Jellyfin that existing movie files have changed')
    .option('-f, --format <format>', 'Output format')
    .option('--path <path>', 'Path of the updated movie file')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.notifyMoviesUpdated([{ Path: options.path, UpdateType: 'Modified' }]);
        console.log(toon.formatMessage('Movie updated notification sent', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('series-added').description('Notify Jellyfin that a new TV series directory has been added')
    .option('-f, --format <format>', 'Output format')
    .option('--path <path>', 'Path of the added series directory')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.notifySeriesAdded([{ Path: options.path, UpdateType: 'Created' }]);
        console.log(toon.formatMessage('Series added notification sent', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('series-updated').description('Notify Jellyfin that an existing TV series directory has changed')
    .option('-f, --format <format>', 'Output format')
    .option('--path <path>', 'Path of the updated series directory')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.notifySeriesUpdated([{ Path: options.path, UpdateType: 'Modified' }]);
        console.log(toon.formatMessage('Series updated notification sent', true));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
