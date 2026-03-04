import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

function parseOptionalInt(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  return parseInt(value, 10);
}

export function attachMediaUrlCommands(cmd: Command): void {
  cmd.command('video-stream-url <itemId>').description('Get direct video stream URL (optionally by container)')
    .option('-f, --format <format>', 'Output format')
    .option('--container <container>', 'Container extension (e.g. mp4, mkv)')
    .option('--media-source <id>', 'Media source ID')
    .option('--audio-stream <index>', 'Audio stream index')
    .option('--subtitle-stream <index>', 'Subtitle stream index')
    .option('--max-bitrate <bps>', 'Max streaming bitrate')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const streamParams = {
          mediaSourceId: options.mediaSource,
          audioStreamIndex: parseOptionalInt(options.audioStream),
          subtitleStreamIndex: parseOptionalInt(options.subtitleStream),
          maxStreamingBitrate: parseOptionalInt(options.maxBitrate),
        };
        const url = options.container
          ? client.getVideoStreamByContainerUrl(itemId, options.container, streamParams)
          : client.getStreamUrl(itemId, streamParams);
        console.log(
          toon.formatToon({ url, item_id: itemId, container: options.container ?? null }, 'video_stream_url'),
        );
      } catch (err) { handleError(err, format); }
    });

  cmd.command('audio-stream-url <itemId>').description('Get direct audio stream URL (container or universal)')
    .option('-f, --format <format>', 'Output format')
    .option('--container <container>', 'Container extension (e.g. mp3, aac)')
    .option('--universal', 'Use /Audio/{itemId}/universal endpoint')
    .option('--media-source <id>', 'Media source ID')
    .option('--audio-stream <index>', 'Audio stream index')
    .option('--max-bitrate <bps>', 'Max streaming bitrate')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const streamParams = {
          mediaSourceId: options.mediaSource,
          audioStreamIndex: parseOptionalInt(options.audioStream),
          maxStreamingBitrate: parseOptionalInt(options.maxBitrate),
        };
        const url = options.universal
          ? client.getUniversalAudioStreamUrl(itemId, streamParams)
          : options.container
            ? client.getAudioStreamByContainerUrl(itemId, options.container, streamParams)
            : client.getAudioStreamUrl(itemId, streamParams);
        console.log(
          toon.formatToon(
            {
              url,
              item_id: itemId,
              container: options.container ?? null,
              universal: Boolean(options.universal),
            },
            'audio_stream_url',
          ),
        );
      } catch (err) { handleError(err, format); }
    });

  cmd.command('hls-legacy-url <itemId> <playlistId>').description('Get legacy HLS playlist URL')
    .option('-f, --format <format>', 'Output format')
    .option('--media-source <id>', 'Media source ID')
    .option('--max-bitrate <bps>', 'Max streaming bitrate')
    .action(async (itemId, playlistId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getLegacyHlsVideoPlaylistUrl(itemId, playlistId, {
          mediaSourceId: options.mediaSource,
          maxStreamingBitrate: parseOptionalInt(options.maxBitrate),
        });
        console.log(toon.formatToon({ url, item_id: itemId, playlist_id: playlistId }, 'hls_legacy_url'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('hls-audio-segment-url <itemId> <segmentId>').description('Get legacy HLS audio segment URL')
    .option('-f, --format <format>', 'Output format')
    .option('--media-source <id>', 'Media source ID')
    .option('--max-bitrate <bps>', 'Max streaming bitrate')
    .action(async (itemId, segmentId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getLegacyHlsAudioSegmentUrl(itemId, segmentId, {
          mediaSourceId: options.mediaSource,
          maxStreamingBitrate: parseOptionalInt(options.maxBitrate),
        });
        console.log(toon.formatToon({ url, item_id: itemId, segment_id: segmentId }, 'hls_audio_segment_url'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('item-file-url <itemId>').description('Get direct item file URL')
    .option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getItemFileUrl(itemId);
        console.log(toon.formatToon({ url, item_id: itemId }, 'item_file_url'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('kodi-strm-url <type> <id>').description('Get Kodi sync .strm URL')
    .option('-f, --format <format>', 'Output format')
    .option('--parent-id <parentId>', 'Optional parent ID')
    .action(async (type, id, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getKodiStrmUrl(type, id, options.parentId);
        console.log(toon.formatToon({ url, type, id, parent_id: options.parentId ?? null }, 'kodi_strm_url'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('branding-css-url').description('Get static branding CSS URL (/Branding/Css.css)')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getBrandingCssStaticUrl();
        console.log(toon.formatToon({ url }, 'branding_css_url'));
      } catch (err) { handleError(err, format); }
    });
}
