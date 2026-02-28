import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createSubtitlesCommand(): Command {
  const cmd = new Command('subtitles');

  cmd.command('search <itemId> <language>').description('Search for remote subtitles')
    .option('-f, --format <format>', 'Output format')
    .option('--perfect', 'Only perfect matches')
    .action(async (itemId, language, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const subtitles = await client.searchRemoteSubtitles(itemId, language, options.perfect);
        console.log(toon.formatToon(subtitles.map((s) => ({
          id: s.Id,
          name: s.Name,
          format: s.Format,
          author: s.Author,
          rating: s.CommunityRating,
          downloads: s.DownloadCount,
          provider: s.ProviderName,
          language: s.ThreeLetterISOLanguageName,
          is_hash_match: s.IsHashMatch,
        })), 'subtitles'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('download <itemId> <subtitleId>').description('Download a remote subtitle')
    .option('-f, --format <format>', 'Output format')
    .action(async (itemId, subtitleId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.downloadRemoteSubtitle(itemId, subtitleId);
        console.log(toon.formatMessage(`Subtitle ${subtitleId} downloaded to item ${itemId}`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('delete <itemId> <index>').description('Delete a subtitle track')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (itemId, index, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm deletion');
        process.exit(1);
      }
      try {
        await client.deleteSubtitle(itemId, parseInt(index, 10));
        console.log(toon.formatMessage(`Subtitle track ${index} deleted from item ${itemId}`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('providers').description('List subtitle providers')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const providers = await client.getSubtitleProviders();
        console.log(toon.formatToon(providers.map((p) => ({ name: p.Name })), 'subtitle_providers'));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
