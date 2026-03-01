import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';
import type { ItemsQueryParams } from '../types/index.js';

export function createItemsCommand(): Command {
  const cmd = new Command('items');

  cmd.command('list').description('List items')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID')
    .option('--types <types>', 'Item types (comma-separated)')
    .option('--genres <genres>', 'Genres (comma-separated)')
    .option('--years <years>', 'Years (comma-separated)')
    .option('--search <term>', 'Search term')
    .option('--limit <number>', 'Limit', '50')
    .option('--offset <number>', 'Offset', '0')
    .option('--sort <field>', 'Sort field')
    .option('--order <direction>', 'Sort order')
    .option('--recursive', 'Recursive search')
    .option('--favorites', 'Show only favorites')
    .option('--played', 'Show only played items')
    .option('--unplayed', 'Show only unplayed items')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const params: ItemsQueryParams = {
          parentId: options.parent,
          includeItemTypes: options.types?.split(','),
          genres: options.genres?.split(','),
          years: options.years?.split(',').map((y: string) => parseInt(y, 10)),
          searchTerm: options.search,
          limit: parseInt(options.limit, 10),
          startIndex: parseInt(options.offset, 10),
          sortBy: options.sort,
          sortOrder: options.order,
          recursive: options.recursive,
          isFavorite: options.favorites,
          isPlayed: options.played ? true : options.unplayed ? false : undefined,
        };
        const result = await client.getItems(params);
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('get <itemId>').description('Get item by ID').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { console.log(toon.formatItem(await client.getItem(itemId))); } catch (err) { handleError(err, format); }
    });

  cmd.command('latest').description('Get latest items').option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID').option('--limit <number>', 'Limit', '20')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try { console.log(toon.formatItems(await client.getLatestItems({ parentId: options.parent, limit: parseInt(options.limit ?? '20', 10) }))); } catch (err) { handleError(err, format); }
    });

  cmd.command('resume').description('Get resume items').option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID').option('--limit <number>', 'Limit', '20')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try { const r = await client.getResumeItems({ parentId: options.parent, limit: parseInt(options.limit ?? '20', 10) }); console.log(toon.formatItems(r.Items ?? [])); } catch (err) { handleError(err, format); }
    });

  cmd.command('search <term>').description('Search for items').option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '20').option('--types <types>', 'Item types (comma-separated)')
    .action(async (term, options) => {
      const { client, format } = await createApiClient(options);
      try { console.log(toon.formatSearchResult(await client.getSearchHints({ searchTerm: term, limit: parseInt(options.limit ?? '20', 10), includeItemTypes: options.types?.split(',') }))); } catch (err) { handleError(err, format); }
    });

  cmd.command('similar <itemId>').description('Get similar items').option('-f, --format <format>', 'Output format').option('--limit <number>', 'Limit', '20')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { const r = await client.getSimilarItems(itemId, { limit: parseInt(options.limit ?? '20', 10) }); console.log(toon.formatItems(r.Items ?? [])); } catch (err) { handleError(err, format); }
    });

  cmd.command('intros <itemId>').description('Get intro videos').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { console.log(toon.formatItems(await client.getIntros(itemId))); } catch (err) { handleError(err, format); }
    });

  cmd.command('chapters <itemId>').description('Get chapters').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { const chapters = await client.getChapters(itemId); console.log(toon.formatToon(chapters.map((c, i) => ({ index: i, name: c.name, start_position_ticks: c.startPositionTicks, has_image: !!c.imageTag })), 'chapters')); } catch (err) { handleError(err, format); }
    });

  cmd.command('special-features <itemId>').description('Get special features').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { console.log(toon.formatItems(await client.getSpecialFeatures(itemId))); } catch (err) { handleError(err, format); }
    });

  cmd.command('trailers <itemId>').description('Get local trailers').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { console.log(toon.formatItems(await client.getLocalTrailers(itemId))); } catch (err) { handleError(err, format); }
    });

  cmd.command('ancestors <itemId>').description('Get parent items').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { console.log(toon.formatItems(await client.getAncestors(itemId))); } catch (err) { handleError(err, format); }
    });

  cmd.command('parts <itemId>').description('Get additional parts').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { const r = await client.getAdditionalParts(itemId); console.log(toon.formatItems(r.Items ?? [])); } catch (err) { handleError(err, format); }
    });

  cmd.command('playback-info <itemId>').description('Get playback info').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { const info = await client.getPlaybackInfo(itemId); console.log(toon.formatToon({ play_session_id: info.playSessionId, media_sources: (info.mediaSources ?? []).map((s) => ({ id: s.Id, name: s.Name, container: s.Container, supports_direct_play: s.SupportsDirectPlay, supports_direct_stream: s.SupportsDirectStream, supports_transcoding: s.SupportsTranscoding })) }, 'playback_info')); } catch (err) { handleError(err, format); }
    });

  cmd.command('stream-url <itemId>').description('Get video stream URL').option('-f, --format <format>', 'Output format')
    .option('--media-source <id>', 'Media source ID').option('--audio-stream <index>', 'Audio stream index')
    .option('--subtitle-stream <index>', 'Subtitle stream index').option('--max-bitrate <bps>', 'Max streaming bitrate')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { const url = client.getStreamUrl(itemId, { mediaSourceId: options.mediaSource, audioStreamIndex: options.audioStream ? parseInt(options.audioStream, 10) : undefined, subtitleStreamIndex: options.subtitleStream ? parseInt(options.subtitleStream, 10) : undefined, maxStreamingBitrate: options.maxBitrate ? parseInt(options.maxBitrate, 10) : undefined }); console.log(toon.formatToon({ url, item_id: itemId }, 'stream_url')); } catch (err) { handleError(err, format); }
    });

  cmd.command('audio-url <itemId>').description('Get audio stream URL').option('-f, --format <format>', 'Output format')
    .option('--media-source <id>', 'Media source ID').option('--audio-stream <index>', 'Audio stream index')
    .option('--max-bitrate <bps>', 'Max streaming bitrate')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { const url = client.getAudioStreamUrl(itemId, { mediaSourceId: options.mediaSource, audioStreamIndex: options.audioStream ? parseInt(options.audioStream, 10) : undefined, maxStreamingBitrate: options.maxBitrate ? parseInt(options.maxBitrate, 10) : undefined }); console.log(toon.formatToon({ url, item_id: itemId }, 'audio_url')); } catch (err) { handleError(err, format); }
    });

  cmd.command('image-url <itemId>').description('Get image URL for item').option('-f, --format <format>', 'Output format')
    .option('--max-width <pixels>', 'Max width').option('--max-height <pixels>', 'Max height')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { const url = client.getThumbUrl(itemId, { maxWidth: options.maxWidth ? parseInt(options.maxWidth, 10) : undefined, maxHeight: options.maxHeight ? parseInt(options.maxHeight, 10) : undefined }); console.log(toon.formatToon({ url, item_id: itemId }, 'image_url')); } catch (err) { handleError(err, format); }
    });

  cmd.command('subtitle-url <itemId> <mediaSourceId> <streamIndex>').description('Get subtitle URL').option('-f, --format <format>', 'Output format')
    .option('--format-type <format>', 'Subtitle format (srt, vtt, ass)', 'srt')
    .action(async (itemId, mediaSourceId, streamIndex, options) => {
      const { client, format } = await createApiClient(options);
      try { const url = client.getSubtitleUrl(itemId, mediaSourceId, parseInt(streamIndex, 10), options.formatType); console.log(toon.formatToon({ url, item_id: itemId, stream_index: streamIndex }, 'subtitle_url')); } catch (err) { handleError(err, format); }
    });

  cmd.command('refresh <itemId>').description('Refresh item metadata').option('-f, --format <format>', 'Output format')
    .option('--recursive', 'Refresh recursively').option('--replace-metadata', 'Replace all metadata').option('--replace-images', 'Replace all images')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { await client.refreshItem(itemId, { recursive: options.recursive, replaceAllMetadata: options.replaceMetadata, replaceAllImages: options.replaceImages }); console.log(toon.formatMessage(`Refresh initiated for item ${itemId}`, true)); } catch (err) { handleError(err, format); }
    });

  cmd.command('delete <itemId>').description('Delete an item').option('-f, --format <format>', 'Output format').option('--force', 'Skip confirmation')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) { console.error('Use --force to confirm deletion'); process.exit(1); }
      try { await client.deleteItem(itemId); console.log(toon.formatMessage(`Item ${itemId} deleted`, true)); } catch (err) { handleError(err, format); }
    });

  cmd.command('filters').description('Get available query filters').option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID').option('--types <types>', 'Item types (comma-separated)')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const filters = await client.getQueryFilters({ parentId: options.parent, includeItemTypes: options.types?.split(',') });
        console.log(toon.formatToon({
          genres: filters.Genres ?? [],
          studios: filters.Studios ?? [],
          tags: filters.Tags ?? [],
          years: filters.Years ?? [],
          official_ratings: filters.OfficialRatings ?? [],
          persons: filters.Persons ?? [],
        }, 'filters'));
      } catch (err) { handleError(err, format); }
    });

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
        if (options.trailerUrl !== undefined) {
          item.RemoteTrailers = [{ Url: options.trailerUrl }];
        }

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

  return cmd;
}
