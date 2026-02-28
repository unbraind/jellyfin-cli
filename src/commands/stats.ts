import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createStatsCommand(): Command {
  const cmd = new Command('stats');

  cmd
    .command('counts')
    .description('Get library item counts')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
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
        console.log(toon.formatToon(simplified, 'item_counts'));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
