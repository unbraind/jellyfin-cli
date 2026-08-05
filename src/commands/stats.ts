import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';

/**
 * Builds the stats command tree with validated options and actions.
 * @returns - The configured Commander command tree.
 */
export function createStatsCommand(): Command {
  const cmd = new Command('stats');

  cmd
    .command('counts')
    .description('Get library item counts')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format, formatter } = await createApiClient(options);
      try {
        const counts = await client.getItemCounts();
        const simplified = {
          movies: counts.MovieCount,
          series: counts.SeriesCount,
          episodes: counts.EpisodeCount,
          artists: counts.ArtistCount,
          songs: counts.SongCount,
          albums: counts.AlbumCount,
          box_sets: counts.BoxSetCount,
          music_videos: counts.MusicVideoCount,
          books: counts.BookCount,
          trailers: counts.TrailerCount,
        };
        console.log(formatter.formatToon(simplified, 'item_counts'));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
