import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createLiveStreamsCommand(): Command {
  const cmd = new Command('live-streams');
  cmd.description('Manage live media streams (open/close direct media sources)');

  cmd.command('open').description('Open a live stream for a media source')
    .option('-f, --format <format>', 'Output format')
    .option('--token <token>', 'Open token (from playback info)')
    .option('--item <itemId>', 'Item ID')
    .option('--session <id>', 'Play session ID')
    .option('--bitrate <bps>', 'Max streaming bitrate')
    .option('--direct-play', 'Enable direct play')
    .option('--direct-stream', 'Enable direct stream')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.openLiveStream({
          openToken: options.token,
          itemId: options.item,
          playSessionId: options.session,
          maxStreamingBitrate: options.bitrate ? parseInt(options.bitrate, 10) : undefined,
          enableDirectPlay: options.directPlay,
          enableDirectStream: options.directStream,
        });
        console.log(toon.formatToon({
          media_source_id: result.MediaSourceId,
          media_source: result.MediaSource,
        }, 'live_stream_opened'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('close <liveStreamId>').description('Close an open live stream by its ID')
    .option('-f, --format <format>', 'Output format')
    .action(async (liveStreamId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.closeLiveStream(liveStreamId);
        console.log(toon.formatMessage(`Live stream ${liveStreamId} closed`, true));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
