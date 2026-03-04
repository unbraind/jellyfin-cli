import { Command } from 'commander';
import {
  createApiClient,
  formatItem,
  formatItems,
  formatMessage,
  formatSearchResult,
  formatToon,
  handleError,
} from './utils.js';
import type { ItemsQueryParams } from '../types/index.js';
import { addMetadataCommands } from './items-metadata.js';
import { parseNonNegativeInt, parsePositiveInt } from './number-options.js';

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
        const limit = parsePositiveInt(options.limit, 'Limit');
        const offset = parseNonNegativeInt(options.offset, 'Offset');
        const params: ItemsQueryParams = {
          parentId: options.parent,
          includeItemTypes: options.types?.split(','),
          genres: options.genres?.split(','),
          years: options.years?.split(',').map((y: string) => parseInt(y, 10)),
          searchTerm: options.search,
          limit,
          startIndex: offset,
          sortBy: options.sort,
          sortOrder: options.order,
          recursive: options.recursive,
          isFavorite: options.favorites,
          isPlayed: options.played ? true : options.unplayed ? false : undefined,
        };
        const result = await client.getItems(params);
        const items = result.Items ?? [];
        // Some servers may return more than requested; clamp to the requested limit.
        console.log(formatItems(items.slice(0, limit), format));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('get <itemId>').description('Get item by ID').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { console.log(formatItem(await client.getItem(itemId), format)); } catch (err) { handleError(err, format); }
    });

  cmd.command('latest').description('Get latest items').option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID').option('--limit <number>', 'Limit', '20')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        console.log(
          formatItems(
            await client.getLatestItems({ parentId: options.parent, limit: parseInt(options.limit ?? '20', 10) }),
            format,
          ),
        );
      } catch (err) { handleError(err, format); }
    });

  cmd.command('resume').description('Get resume items').option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID').option('--limit <number>', 'Limit', '20')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const r = await client.getResumeItems({ parentId: options.parent, limit: parseInt(options.limit ?? '20', 10) });
        console.log(formatItems(r.Items ?? [], format));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('search <term>').description('Search for items').option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit', '20').option('--types <types>', 'Item types (comma-separated)')
    .action(async (term, options) => {
      const { client, format } = await createApiClient(options);
      try {
        console.log(
          formatSearchResult(
            await client.getSearchHints({
              searchTerm: term,
              limit: parseInt(options.limit ?? '20', 10),
              includeItemTypes: options.types?.split(','),
            }),
            format,
          ),
        );
      } catch (err) { handleError(err, format); }
    });

  cmd.command('similar <itemId>').description('Get similar items').option('-f, --format <format>', 'Output format').option('--limit <number>', 'Limit', '20')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const r = await client.getSimilarItems(itemId, { limit: parseInt(options.limit ?? '20', 10) });
        console.log(formatItems(r.Items ?? [], format));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('intros <itemId>').description('Get intro videos').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { console.log(formatItems(await client.getIntros(itemId), format)); } catch (err) { handleError(err, format); }
    });

  cmd.command('chapters <itemId>').description('Get chapters').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const chapters = await client.getChapters(itemId);
        console.log(
          formatToon(
            chapters.map((c, i) => ({
              index: i,
              name: c.name,
              start_position_ticks: c.startPositionTicks,
              has_image: !!c.imageTag,
            })),
            format,
            'chapters',
          ),
        );
      } catch (err) { handleError(err, format); }
    });

  cmd.command('special-features <itemId>').description('Get special features').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { console.log(formatItems(await client.getSpecialFeatures(itemId), format)); } catch (err) { handleError(err, format); }
    });

  cmd.command('trailers <itemId>').description('Get local trailers').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { console.log(formatItems(await client.getLocalTrailers(itemId), format)); } catch (err) { handleError(err, format); }
    });

  cmd.command('ancestors <itemId>').description('Get parent items').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { console.log(formatItems(await client.getAncestors(itemId), format)); } catch (err) { handleError(err, format); }
    });

  cmd.command('parts <itemId>').description('Get additional parts').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try { const r = await client.getAdditionalParts(itemId); console.log(formatItems(r.Items ?? [], format)); } catch (err) { handleError(err, format); }
    });

  cmd.command('playback-info <itemId>').description('Get playback info').option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const info = await client.getPlaybackInfo(itemId);
        console.log(
          formatToon(
            {
              play_session_id: info.playSessionId,
              media_sources: (info.mediaSources ?? []).map((s) => ({
                id: s.Id,
                name: s.Name,
                container: s.Container,
                supports_direct_play: s.SupportsDirectPlay,
                supports_direct_stream: s.SupportsDirectStream,
                supports_transcoding: s.SupportsTranscoding,
              })),
            },
            format,
            'playback_info',
          ),
        );
      } catch (err) { handleError(err, format); }
    });

  cmd.command('stream-url <itemId>').description('Get video stream URL').option('-f, --format <format>', 'Output format')
    .option('--media-source <id>', 'Media source ID').option('--audio-stream <index>', 'Audio stream index')
    .option('--subtitle-stream <index>', 'Subtitle stream index').option('--max-bitrate <bps>', 'Max streaming bitrate')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getStreamUrl(itemId, {
          mediaSourceId: options.mediaSource,
          audioStreamIndex: options.audioStream ? parseInt(options.audioStream, 10) : undefined,
          subtitleStreamIndex: options.subtitleStream ? parseInt(options.subtitleStream, 10) : undefined,
          maxStreamingBitrate: options.maxBitrate ? parseInt(options.maxBitrate, 10) : undefined,
        });
        console.log(formatToon({ url, item_id: itemId }, format, 'stream_url'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('audio-url <itemId>').description('Get audio stream URL').option('-f, --format <format>', 'Output format')
    .option('--media-source <id>', 'Media source ID').option('--audio-stream <index>', 'Audio stream index')
    .option('--max-bitrate <bps>', 'Max streaming bitrate')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getAudioStreamUrl(itemId, {
          mediaSourceId: options.mediaSource,
          audioStreamIndex: options.audioStream ? parseInt(options.audioStream, 10) : undefined,
          maxStreamingBitrate: options.maxBitrate ? parseInt(options.maxBitrate, 10) : undefined,
        });
        console.log(formatToon({ url, item_id: itemId }, format, 'audio_url'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('image-url <itemId>').description('Get image URL for item').option('-f, --format <format>', 'Output format')
    .option('--max-width <pixels>', 'Max width').option('--max-height <pixels>', 'Max height')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getThumbUrl(itemId, {
          maxWidth: options.maxWidth ? parseInt(options.maxWidth, 10) : undefined,
          maxHeight: options.maxHeight ? parseInt(options.maxHeight, 10) : undefined,
        });
        console.log(formatToon({ url, item_id: itemId }, format, 'image_url'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('subtitle-url <itemId> <mediaSourceId> <streamIndex>').description('Get subtitle URL').option('-f, --format <format>', 'Output format')
    .option('--format-type <format>', 'Subtitle format (srt, vtt, ass)', 'srt')
    .action(async (itemId, mediaSourceId, streamIndex, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getSubtitleUrl(itemId, mediaSourceId, parseInt(streamIndex, 10), options.formatType);
        console.log(formatToon({ url, item_id: itemId, stream_index: streamIndex }, format, 'subtitle_url'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('refresh <itemId>').description('Refresh item metadata').option('-f, --format <format>', 'Output format')
    .option('--recursive', 'Refresh recursively').option('--replace-metadata', 'Replace all metadata').option('--replace-images', 'Replace all images')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.refreshItem(itemId, {
          recursive: options.recursive,
          replaceAllMetadata: options.replaceMetadata,
          replaceAllImages: options.replaceImages,
        });
        console.log(formatMessage(`Refresh initiated for item ${itemId}`, format, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('delete <itemId>').description('Delete an item').option('-f, --format <format>', 'Output format').option('--force', 'Skip confirmation')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) { console.error('Use --force to confirm deletion'); process.exit(1); }
      try { await client.deleteItem(itemId); console.log(formatMessage(`Item ${itemId} deleted`, format, true)); } catch (err) { handleError(err, format); }
    });

  cmd.command('filters').description('Get available query filters').option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID').option('--types <types>', 'Item types (comma-separated)')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const filters = await client.getQueryFilters({ parentId: options.parent, includeItemTypes: options.types?.split(',') });
        console.log(
          formatToon(
            {
              genres: filters.Genres ?? [],
              studios: filters.Studios ?? [],
              tags: filters.Tags ?? [],
              years: filters.Years ?? [],
              official_ratings: filters.OfficialRatings ?? [],
              persons: filters.Persons ?? [],
            },
            format,
            'filters',
          ),
        );
      } catch (err) { handleError(err, format); }
    });

  cmd.command('filters2').description('Get advanced query filters (Filters2 endpoint)').option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID').option('--types <types>', 'Item types (comma-separated)')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const filters = await client.getQueryFilters2({ parentId: options.parent, includeItemTypes: options.types?.split(',') });
        console.log(
          formatToon(
            {
              genres: filters.Genres ?? [],
              studios: filters.Studios ?? [],
              tags: filters.Tags ?? [],
              years: filters.Years ?? [],
              official_ratings: filters.OfficialRatings ?? [],
              persons: filters.Persons ?? [],
            },
            format,
            'filters',
          ),
        );
      } catch (err) { handleError(err, format); }
    });

  addMetadataCommands(cmd);

  return cmd;
}
