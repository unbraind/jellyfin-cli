import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createVideosCommand(): Command {
  const cmd = new Command('videos');

  cmd
    .command('merge-versions <ids...>')
    .description('Merge multiple video items into a single record (space-separated IDs)')
    .option('-f, --format <format>', 'Output format')
    .action(async (ids, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.mergeVideoVersions(ids);
        console.log(toon.formatMessage(`Merged ${ids.length} video version(s) into a single record`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('delete-alternates <itemId>')
    .description('Delete all alternate video sources for an item')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm deletion of alternate sources');
        process.exit(1);
      }
      try {
        await client.deleteAlternateSources(itemId);
        console.log(toon.formatMessage(`Alternate sources deleted for item ${itemId}`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('parts <itemId>')
    .description('Get additional parts (multi-part videos) for an item')
    .option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getAdditionalParts(itemId);
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('cancel-transcoding').description('Cancel active video transcoding sessions')
    .option('-f, --format <format>', 'Output format')
    .option('--device <id>', 'Specific device ID')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.cancelActiveEncodings(options.device);
        console.log(toon.formatMessage('Active transcoding cancelled', true));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
