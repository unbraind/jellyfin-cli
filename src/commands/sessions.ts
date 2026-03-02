import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';
import { addReportingCommands } from './sessions-reporting.js';

export function createSessionsCommand(): Command {
  const cmd = new Command('sessions');

  cmd
    .command('list')
    .description('List all active sessions')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const sessions = await client.getSessions();
        console.log(toon.formatSessions(sessions));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('get <sessionId>')
    .description('Get session by ID')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const session = await client.getSessionById(sessionId);
        console.log(toon.formatSession(session));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('play')
    .description('Send play command to session')
    .argument('<sessionId>', 'Session ID')
    .argument('<itemIds...>', 'Item IDs to play')
    .option('--next', 'Add to play next')
    .option('--last', 'Add to play last')
    .option('--shuffle', 'Shuffle and play')
    .option('--position <ticks>', 'Start position in ticks')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, itemIds, options) => {
      const { client, format } = await createApiClient(options);
      try {
        let playCommand: 'PlayNow' | 'PlayNext' | 'PlayLast' | 'PlayInstantMix' | 'PlayShuffle' = 'PlayNow';
        if (options.next) playCommand = 'PlayNext';
        else if (options.last) playCommand = 'PlayLast';
        else if (options.shuffle) playCommand = 'PlayShuffle';

        await client.playCommand(sessionId, {
          itemIds,
          playCommand,
          startPositionTicks: options.position ? parseInt(options.position, 10) : undefined,
        });
        console.log(toon.formatMessage('Play command sent'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('pause <sessionId>')
    .description('Pause playback')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.playstateCommand(sessionId, 'Pause');
        console.log(toon.formatMessage('Paused'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('unpause <sessionId>')
    .description('Resume playback')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.playstateCommand(sessionId, 'Unpause');
        console.log(toon.formatMessage('Unpaused'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('stop <sessionId>')
    .description('Stop playback')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.playstateCommand(sessionId, 'Stop');
        console.log(toon.formatMessage('Stopped'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('next <sessionId>')
    .description('Skip to next track')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.playstateCommand(sessionId, 'NextTrack');
        console.log(toon.formatMessage('Next track'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('previous <sessionId>')
    .description('Go to previous track')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.playstateCommand(sessionId, 'PreviousTrack');
        console.log(toon.formatMessage('Previous track'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('seek <sessionId> <ticks>')
    .description('Seek to position (in ticks)')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, ticks, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.playstateCommand(sessionId, 'Seek', { seekPositionTicks: parseInt(ticks, 10) });
        console.log(toon.formatMessage('Seeked'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('mute <sessionId>')
    .description('Mute audio')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.sendSystemCommand(sessionId, 'Mute');
        console.log(toon.formatMessage('Muted'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('unmute <sessionId>')
    .description('Unmute audio')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.sendSystemCommand(sessionId, 'Unmute');
        console.log(toon.formatMessage('Unmuted'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('volume <sessionId> <level>')
    .description('Set volume level (0-100)')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, level, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const volumeLevel = parseInt(level, 10);
        if (Number.isNaN(volumeLevel) || volumeLevel < 0 || volumeLevel > 100) {
          throw new Error('Volume level must be a number between 0 and 100');
        }
        await client.setVolume(sessionId, volumeLevel);
        console.log(toon.formatMessage(`Volume: ${volumeLevel}`));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('message <sessionId>')
    .description('Send message to session')
    .requiredOption('--header <text>', 'Message header')
    .requiredOption('--text <text>', 'Message text')
    .option('--timeout <ms>', 'Message timeout in ms')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.sendMessageCommand(sessionId, {
          header: options.header,
          text: options.text,
          timeoutMs: options.timeout ? parseInt(options.timeout, 10) : undefined,
        });
        console.log(toon.formatMessage('Message sent'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd.command('user-add <sessionId> <userId>').description('Add user to a session')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, userId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.addSessionUser(sessionId, userId);
        console.log(toon.formatMessage(`User ${userId} added to session`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('user-remove <sessionId> <userId>').description('Remove user from a session')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, userId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.removeSessionUser(sessionId, userId);
        console.log(toon.formatMessage(`User ${userId} removed from session`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('logout').description('Log out the current API session')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.logoutSession();
        console.log(toon.formatMessage('Session logged out', true));
      } catch (err) { handleError(err, format); }
    });

  addReportingCommands(cmd);

  cmd.command('set-viewing <sessionId> <itemId>').description('Set the currently-viewing item for a remote session')
    .option('-f, --format <format>', 'Output format')
    .action(async (sessionId, itemId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.setNowViewing(sessionId, itemId);
        console.log(toon.formatMessage(`Session ${sessionId} now viewing item ${itemId}`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('general-command <sessionId> <command>').description('Send a general client command to a session (e.g. GoHome, GoToSettings, MoveUp)')
    .option('-f, --format <format>', 'Output format')
    .option('--args <json>', 'Command arguments as JSON object (e.g. \'{"key":"value"}\')')
    .action(async (sessionId, command, options) => {
      const { client, format } = await createApiClient(options);
      try {
        let args: Record<string, string> | undefined;
        if (options.args) {
          args = JSON.parse(options.args) as Record<string, string>;
        }
        await client.sendGeneralCommand(sessionId, command, args);
        console.log(toon.formatMessage(`Command '${command}' sent to session ${sessionId}`, true));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
