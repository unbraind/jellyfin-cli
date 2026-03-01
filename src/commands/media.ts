import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createMediaCommand(): Command {
  const cmd = new Command('media');

  cmd.command('segments <itemId>').description('Get media segments for an item')
    .option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getMediaSegments(itemId);
        console.log(toon.formatToon((result.Items ?? []).map((s) => ({
          id: s.Id,
          type: s.Type,
          start_ticks: s.StartTicks,
          end_ticks: s.EndTicks,
        })), 'media_segments'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('lyrics <itemId>').description('Get lyrics for an audio item')
    .option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const lyrics = await client.getLyrics(itemId);
        console.log(toon.formatToon({
          metadata: lyrics.Metadata,
          lyrics: lyrics.Lyrics?.map((l) => ({
            text: l.Text,
            start: l.Start,
          })),
        }, 'lyrics'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('theme-songs <itemId>').description('Get theme songs for an item')
    .option('-f, --format <format>', 'Output format')
    .option('--inherit', 'Include inherited theme songs')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getThemeSongs(itemId, undefined, options.inherit);
        console.log(toon.formatToon({
          items: result.Items?.map((i) => ({
            id: i.Id,
            name: i.Name,
            runtime_ticks: i.RunTimeTicks,
          })),
          total_count: result.TotalRecordCount,
          owner_id: result.OwnerId,
        }, 'theme_songs'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('theme-videos <itemId>').description('Get theme videos for an item')
    .option('-f, --format <format>', 'Output format')
    .option('--inherit', 'Include inherited theme videos')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getThemeVideos(itemId, undefined, options.inherit);
        console.log(toon.formatToon({
          items: result.Items?.map((i) => ({
            id: i.Id,
            name: i.Name,
            runtime_ticks: i.RunTimeTicks,
          })),
          total_count: result.TotalRecordCount,
          owner_id: result.OwnerId,
        }, 'theme_videos'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('external-ids <itemId>').description('Get external ID info for an item')
    .option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const ids = await client.getExternalIdInfos(itemId);
        console.log(toon.formatToon(ids.map((id) => ({
          name: id.Name,
          key: id.Key,
          url: id.Url,
          type: id.Type,
        })), 'external_ids'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('remote-images <itemId>').description('Get available remote images for an item')
    .option('-f, --format <format>', 'Output format')
    .option('--type <type>', 'Image type')
    .option('--limit <number>', 'Limit')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getRemoteImages(itemId, {
          type: options.type,
          limit: options.limit ? parseInt(options.limit, 10) : undefined,
        });
        console.log(toon.formatToon({
          total_count: result.TotalRecordCount,
          providers: result.Providers,
          images: result.Images?.map((img) => ({
            provider: img.ProviderName,
            url: img.Url,
            type: img.Type,
            language: img.Language,
            rating: img.CommunityRating,
            width: img.Width,
            height: img.Height,
          })),
        }, 'remote_images'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('download-image <itemId>').description('Download a remote image to an item')
    .option('-f, --format <format>', 'Output format')
    .option('--type <type>', 'Image type')
    .option('--url <url>', 'Image URL')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.downloadRemoteImage(itemId, { type: options.type, imageUrl: options.url });
        console.log(toon.formatMessage(`Image downloaded to item ${itemId}`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('hls-url <itemId>').description('Get HLS master playlist URL')
    .option('-f, --format <format>', 'Output format')
    .option('--media-source <id>', 'Media source ID')
    .option('--audio-stream <index>', 'Audio stream index')
    .option('--subtitle-stream <index>', 'Subtitle stream index')
    .option('--max-bitrate <bps>', 'Max streaming bitrate')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getHlsMasterPlaylistUrl(itemId, {
          mediaSourceId: options.mediaSource,
          audioStreamIndex: options.audioStream ? parseInt(options.audioStream, 10) : undefined,
          subtitleStreamIndex: options.subtitleStream ? parseInt(options.subtitleStream, 10) : undefined,
          maxStreamingBitrate: options.maxBitrate ? parseInt(options.maxBitrate, 10) : undefined,
        });
        console.log(toon.formatToon({ url, item_id: itemId }, 'hls_url'));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
