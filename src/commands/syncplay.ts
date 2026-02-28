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

  return cmd;
}
