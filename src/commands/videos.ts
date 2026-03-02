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

  cmd.command('merge-episodes <ids...>').description('Merge multiple episode items into a single record')
    .option('-f, --format <format>', 'Output format')
    .action(async (ids, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.mergeEpisodeVersions(ids);
        console.log(toon.formatMessage(`Merged ${ids.length} episode version(s)`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('merge-movies <ids...>').description('Merge multiple movie items into a single record')
    .option('-f, --format <format>', 'Output format')
    .action(async (ids, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.mergeMovieVersions(ids);
        console.log(toon.formatMessage(`Merged ${ids.length} movie version(s)`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('split-episodes <ids...>').description('Split merged episode versions back into separate records')
    .option('-f, --format <format>', 'Output format')
    .action(async (ids, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.splitEpisodeVersions(ids);
        console.log(toon.formatMessage(`Split ${ids.length} episode record(s)`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('split-movies <ids...>').description('Split merged movie versions back into separate records')
    .option('-f, --format <format>', 'Output format')
    .action(async (ids, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.splitMovieVersions(ids);
        console.log(toon.formatMessage(`Split ${ids.length} movie record(s)`, true));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
