import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createSyncPlayCommand(): Command {
  const cmd = new Command('syncplay');

  cmd.command('list').description('List SyncPlay groups')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const groups = await client.getSyncPlayGroups();
        console.log(toon.formatToon(groups.map((g) => ({
          group_id: g.GroupId,
          playing_item: g.PlayingItemName,
          position_ticks: g.PositionTicks,
          is_paused: g.IsPaused,
          participants: g.Participants?.map((p) => ({
            user_id: p.UserId,
            user_name: p.UserName,
            is_in_group: p.IsInGroup,
          })),
        })), 'syncplay_groups'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('join <groupId>').description('Join a SyncPlay group')
    .option('-f, --format <format>', 'Output format')
    .action(async (groupId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.syncPlayJoin(groupId);
        console.log(toon.formatMessage(`Joined SyncPlay group ${groupId}`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('leave').description('Leave current SyncPlay group')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.syncPlayLeave();
        console.log(toon.formatMessage('Left SyncPlay group', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('pause').description('Pause SyncPlay group playback')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.syncPlayPause();
        console.log(toon.formatMessage('SyncPlay playback paused', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('unpause').description('Resume SyncPlay group playback')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.syncPlayUnpause();
        console.log(toon.formatMessage('SyncPlay playback resumed', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('stop').description('Stop SyncPlay group playback')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.syncPlayStop();
        console.log(toon.formatMessage('SyncPlay playback stopped', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('create').description('Create a new SyncPlay group')
    .option('-f, --format <format>', 'Output format')
    .option('--name <name>', 'Group name')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.syncPlayCreate(options.name);
        console.log(toon.formatMessage('SyncPlay group created', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('get <groupId>').description('Get SyncPlay group details')
    .option('-f, --format <format>', 'Output format')
    .action(async (groupId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const group = await client.syncPlayGetGroup(groupId);
        console.log(toon.formatToon({
          group_id: group.GroupId,
          playing_item: group.PlayingItemName,
          position_ticks: group.PositionTicks,
          is_paused: group.IsPaused,
          participants: group.Participants?.map((p) => ({ user_id: p.UserId, user_name: p.UserName })),
        }, 'syncplay_group'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('seek <ticks>').description('Seek to position (in ticks, 10M ticks = 1 second)')
    .option('-f, --format <format>', 'Output format')
    .action(async (ticks, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.syncPlaySeek(parseInt(ticks, 10));
        console.log(toon.formatMessage(`SyncPlay seeked to ${ticks} ticks`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('next').description('Skip to next item in SyncPlay queue')
    .option('-f, --format <format>', 'Output format')
    .option('--playlist-item <id>', 'Playlist item ID')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.syncPlayNextItem(options.playlistItem);
        console.log(toon.formatMessage('SyncPlay skipped to next item', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('previous').description('Go to previous item in SyncPlay queue')
    .option('-f, --format <format>', 'Output format')
    .option('--playlist-item <id>', 'Playlist item ID')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.syncPlayPreviousItem(options.playlistItem);
        console.log(toon.formatMessage('SyncPlay went to previous item', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('set-repeat <mode>').description('Set repeat mode (RepeatNone, RepeatAll, RepeatOne)')
    .option('-f, --format <format>', 'Output format')
    .action(async (mode, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.syncPlaySetRepeatMode(mode);
        console.log(toon.formatMessage(`SyncPlay repeat mode set to ${mode}`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('set-shuffle <mode>').description('Set shuffle mode (Sorted, Shuffle)')
    .option('-f, --format <format>', 'Output format')
    .action(async (mode, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.syncPlaySetShuffleMode(mode);
        console.log(toon.formatMessage(`SyncPlay shuffle mode set to ${mode}`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('queue <itemIds...>').description('Queue items in SyncPlay group')
    .option('-f, --format <format>', 'Output format')
    .action(async (itemIds, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.syncPlayQueue(itemIds);
        console.log(toon.formatMessage(`Queued ${itemIds.length} item(s) in SyncPlay`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('set-queue <itemIds...>').description('Set a new SyncPlay queue (replaces current)')
    .option('-f, --format <format>', 'Output format')
    .option('--start-ticks <ticks>', 'Start position in ticks')
    .action(async (itemIds, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.syncPlaySetNewQueue(itemIds, options.startTicks ? parseInt(options.startTicks, 10) : undefined);
        console.log(toon.formatMessage(`SyncPlay queue set with ${itemIds.length} item(s)`, true));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
