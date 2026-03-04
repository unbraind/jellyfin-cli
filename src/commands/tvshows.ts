import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createTvshowsCommand(): Command {
  const cmd = new Command('tvshows');

  cmd
    .command('episodes <seriesId>')
    .description('Get episodes for a TV series')
    .option('-f, --format <format>', 'Output format')
    .option('--season <number>', 'Filter by season number')
    .option('--season-id <id>', 'Filter by season ID')
    .option('--limit <number>', 'Limit', '50')
    .option('--offset <number>', 'Offset', '0')
    .option('--missing', 'Include missing episodes')
    .option('--sort <field>', 'Sort field')
    .action(async (seriesId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getEpisodes(seriesId, {
          season: options.season ? parseInt(options.season, 10) : undefined,
          seasonId: options.seasonId,
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.offset, 10),
          isMissing: options.missing,
          sortBy: options.sort,
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('seasons <seriesId>')
    .description('Get seasons for a TV series')
    .option('-f, --format <format>', 'Output format')
    .option('--specials', 'Include special seasons')
    .action(async (seriesId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getSeasons(seriesId, {
          isSpecialSeason: options.specials,
        });
        const simplified = (result.Items ?? []).map((s) => ({
          id: s.Id,
          name: s.Name,
          index: s.IndexNumber,
          series_id: s.SeriesId,
          series_name: s.SeriesName,
          episode_count: s.RecursiveItemCount,
          unplayed_item_count: s.UserData?.UnplayedItemCount,
          played: s.UserData?.Played,
          image_tag: s.ImageTags?.Primary,
        }));
        console.log(toon.formatToon(simplified, 'seasons'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('next-up')
    .description('Get next up episodes')
    .option('-f, --format <format>', 'Output format')
    .option('--series <id>', 'Filter by series ID')
    .option('--parent <id>', 'Parent ID')
    .option('--limit <number>', 'Limit', '25')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getNextUpEpisodes({
          seriesId: options.series,
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('upcoming')
    .description('Get upcoming episodes')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID')
    .option('--limit <number>', 'Limit', '25')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getUpcomingEpisodes({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('similar <itemId>')
    .description('Get similar shows for a series or episode')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '25')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getSimilarShows(itemId, {
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
