import type { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function addMetadataCommands(cmd: Command): void {
  cmd.command('update <itemId>')
    .description('Update item metadata')
    .option('-f, --format <format>', 'Output format')
    .option('--name <name>', 'Item name')
    .option('--overview <text>', 'Item overview/description')
    .option('--genres <genres>', 'Genres (comma-separated)')
    .option('--tags <tags>', 'Tags (comma-separated)')
    .option('--studios <studios>', 'Studios (comma-separated)')
    .option('--year <year>', 'Production year')
    .option('--rating <rating>', 'Official rating (e.g., PG, R)')
    .option('--community-rating <rating>', 'Community rating (0-10)')
    .option('--premiere-date <date>', 'Premiere date (YYYY-MM-DD)')
    .option('--sort-name <name>', 'Sort name')
    .option('--trailer-url <url>', 'Trailer URL')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const item = await client.getItem(itemId);
        if (options.name !== undefined) item.Name = options.name;
        if (options.overview !== undefined) item.Overview = options.overview;
        if (options.genres !== undefined) item.Genres = options.genres.split(',');
        if (options.tags !== undefined) item.Tags = options.tags.split(',');
        if (options.studios !== undefined) item.Studios = options.studios.split(',').map((s: string) => ({ Name: s }));
        if (options.year !== undefined) item.ProductionYear = parseInt(options.year, 10);
        if (options.rating !== undefined) item.OfficialRating = options.rating;
        if (options.communityRating !== undefined) item.CommunityRating = parseFloat(options.communityRating);
        if (options.premiereDate !== undefined) item.PremiereDate = options.premiereDate;
        if (options.sortName !== undefined) item.SortName = options.sortName;
        if (options.trailerUrl !== undefined) item.RemoteTrailers = [{ Url: options.trailerUrl }];
        await client.updateItem(itemId, item);
        console.log(toon.formatMessage(`Item ${itemId} updated successfully`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('identify <itemId>')
    .description('Search remote metadata providers to identify/re-identify an item')
    .option('-f, --format <format>', 'Output format')
    .option('--type <type>', 'Item type (Movie, Series, MusicAlbum, MusicArtist, Person, Trailer)', 'Movie')
    .option('--name <name>', 'Override search name')
    .option('--year <year>', 'Override search year')
    .option('--provider <name>', 'Specific provider name (e.g. TheMovieDb)')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const item = await client.getItem(itemId);
        const typeMap: Record<string, string> = {
          Movie: 'Movie', Series: 'Series', MusicAlbum: 'MusicAlbum',
          MusicArtist: 'MusicArtist', Person: 'Person', Trailer: 'Trailer',
        };
        const searchType = typeMap[options.type] ?? 'Movie';
        const results = await client.remoteSearch(searchType, {
          SearchInfo: {
            Name: options.name ?? item.Name,
            Year: options.year ? parseInt(options.year, 10) : item.ProductionYear,
            ItemId: itemId,
          },
          SearchProviderName: options.provider,
          IncludeDisabledProviders: false,
        });
        console.log(toon.formatToon(results.map((r) => ({
          name: r.Name,
          year: r.ProductionYear,
          premiere: r.PremiereDate,
          provider: r.SearchProviderName,
          overview: r.Overview ? r.Overview.substring(0, 100) + (r.Overview.length > 100 ? '...' : '') : undefined,
          ids: r.ProviderIds,
          image: r.ImageUrl,
        })), 'identify_results'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('apply-match <itemId>')
    .description('Apply a remote metadata match to an item (use after identify)')
    .option('-f, --format <format>', 'Output format')
    .option('--provider <name>', 'Provider name')
    .option('--replace-images', 'Replace all images')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.applySearchResult(itemId, {
          searchProviderName: options.provider,
          replaceAllImages: options.replaceImages,
        });
        console.log(toon.formatMessage(`Metadata match applied to item ${itemId}`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('critic-reviews <itemId>').description('Get critic reviews for an item')
    .option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getCriticReviews(itemId);
        console.log(toon.formatToon({
          total: result.TotalRecordCount,
          reviews: (result.Items ?? []).map((r) => ({
            reviewer: r.ReviewerName,
            date: r.Date,
            is_negative: r.IsNegative,
            body: r.Body ? r.Body.substring(0, 200) : undefined,
            url: r.Url,
          })),
        }, 'critic_reviews'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('download-url <itemId>').description('Get direct download URL for an item')
    .option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getItemDownloadUrl(itemId);
        console.log(toon.formatToon({ url, item_id: itemId }, 'download_url'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('root').description('Get the root virtual folder for the current user')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const root = await client.getItemRootFolder();
        console.log(toon.formatItem(root));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('set-content-type <itemId> <contentType>').description('Set content type for an item (e.g. TvShows, Movies, Music)')
    .option('-f, --format <format>', 'Output format')
    .action(async (itemId, contentType, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.setItemContentType(itemId, contentType);
        console.log(toon.formatMessage(`Content type set to '${contentType}' for item ${itemId}`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('metadata-editor <itemId>').description('Get metadata editor data for an item (external IDs, lock status, content type options)')
    .option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const info = await client.getMetadataEditorInfo(itemId);
        console.log(toon.formatToon(info, 'metadata_editor'));
      } catch (err) { handleError(err, format); }
    });
}
