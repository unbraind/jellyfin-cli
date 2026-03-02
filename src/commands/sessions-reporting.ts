import type { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function addReportingCommands(cmd: Command): void {
  cmd.command('report-capabilities').description('Report session capabilities to the server')
    .option('-f, --format <format>', 'Output format')
    .option('--media-types <types>', 'Playable media types (comma-separated, e.g. Video,Audio)', 'Video,Audio')
    .option('--commands <cmds>', 'Supported commands (comma-separated, e.g. Play,Stop)')
    .option('--media-control', 'Indicate this client supports media control')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.reportSessionCapabilities({
          playableMediaTypes: options.mediaTypes?.split(','),
          supportedCommands: options.commands?.split(','),
          supportsMediaControl: !!options.mediaControl,
        });
        console.log(toon.formatMessage('Session capabilities reported', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('report-full-capabilities').description('Report full session capabilities (Capabilities/Full endpoint)')
    .option('-f, --format <format>', 'Output format')
    .option('--media-types <types>', 'Playable media types (comma-separated, e.g. Video,Audio)', 'Video,Audio')
    .option('--commands <cmds>', 'Supported commands (comma-separated)')
    .option('--media-control', 'Supports media control')
    .option('--content-uploading', 'Supports content uploading')
    .option('--sync', 'Supports sync')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.reportFullSessionCapabilities({
          playableMediaTypes: options.mediaTypes?.split(','),
          supportedCommands: options.commands?.split(','),
          supportsMediaControl: !!options.mediaControl,
          supportsContentUploading: !!options.contentUploading,
          supportsSync: !!options.sync,
        });
        console.log(toon.formatMessage('Full session capabilities reported', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('report-start <itemId>').description('Report that playback has started for an item')
    .option('-f, --format <format>', 'Output format')
    .option('--media-source <id>', 'Media source ID')
    .option('--audio-stream <index>', 'Audio stream index')
    .option('--subtitle-stream <index>', 'Subtitle stream index')
    .option('--position <ticks>', 'Start position in ticks')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.reportPlayingItemStart(itemId, {
          mediaSourceId: options.mediaSource,
          audioStreamIndex: options.audioStream !== undefined ? parseInt(options.audioStream, 10) : undefined,
          subtitleStreamIndex: options.subtitleStream !== undefined ? parseInt(options.subtitleStream, 10) : undefined,
          positionTicks: options.position !== undefined ? parseInt(options.position, 10) : undefined,
        });
        console.log(toon.formatMessage(`Playback started reported for item ${itemId}`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('report-progress <itemId>').description('Report playback progress for an item')
    .option('-f, --format <format>', 'Output format')
    .option('--media-source <id>', 'Media source ID')
    .option('--position <ticks>', 'Current position in ticks')
    .option('--paused', 'Mark as paused')
    .option('--muted', 'Mark as muted')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.reportPlayingItemProgress(itemId, {
          mediaSourceId: options.mediaSource,
          positionTicks: options.position !== undefined ? parseInt(options.position, 10) : undefined,
          isPaused: !!options.paused,
          isMuted: !!options.muted,
        });
        console.log(toon.formatMessage(`Playback progress reported for item ${itemId}`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('report-stopped <itemId>').description('Report that playback has stopped for an item')
    .option('-f, --format <format>', 'Output format')
    .option('--media-source <id>', 'Media source ID')
    .option('--position <ticks>', 'Final position in ticks')
    .action(async (itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.reportPlayingItemStopped(itemId, {
          mediaSourceId: options.mediaSource,
          positionTicks: options.position !== undefined ? parseInt(options.position, 10) : undefined,
        });
        console.log(toon.formatMessage(`Playback stopped reported for item ${itemId}`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('ping-playback <playSessionId>').description('Ping an active playback session to keep it alive')
    .option('-f, --format <format>', 'Output format')
    .action(async (playSessionId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.pingPlaybackSession(playSessionId);
        console.log(toon.formatMessage(`Playback session ${playSessionId} pinged`, true));
      } catch (err) { handleError(err, format); }
    });
}
