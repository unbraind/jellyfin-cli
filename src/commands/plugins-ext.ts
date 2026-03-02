import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

// Plugin-specific commands for optional Jellyfin plugins.
// Commands silently fail if the plugin is not installed (404/500 from server).

export function createPluginsExtCommand(): Command {
  const cmd = new Command('plugins-ext');
  cmd.description('Commands for optional Jellyfin plugins (Meilisearch, TMDb, InfuseSync, Telegram)');

  // --- Meilisearch plugin ---
  const meilisearch = new Command('meilisearch');
  meilisearch.description('Meilisearch search plugin management');

  meilisearch.command('status').description('Get Meilisearch plugin status')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const status = await client.getMeilisearchStatus();
        console.log(toon.formatToon(status, 'meilisearch_status'));
      } catch (err) { handleError(err, format); }
    });

  meilisearch.command('reconnect').description('Reconnect to Meilisearch')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.reconnectMeilisearch();
        console.log(toon.formatToon(result, 'meilisearch_reconnect'));
      } catch (err) { handleError(err, format); }
    });

  meilisearch.command('reindex').description('Trigger a full Meilisearch reindex')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.reindexMeilisearch();
        console.log(toon.formatToon(result, 'meilisearch_reindex'));
      } catch (err) { handleError(err, format); }
    });

  cmd.addCommand(meilisearch);

  // --- TMDb plugin ---
  const tmdb = new Command('tmdb');
  tmdb.description('TMDb (The Movie Database) plugin commands');

  tmdb.command('config').description('Get TMDb client configuration')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const config = await client.getTmdbClientConfiguration();
        console.log(toon.formatToon(config, 'tmdb_config'));
      } catch (err) { handleError(err, format); }
    });

  tmdb.command('refresh-boxsets').description('Trigger a TMDb box set refresh')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.refreshTmdbBoxSets();
        console.log(toon.formatMessage('TMDb box sets refresh triggered', true));
      } catch (err) { handleError(err, format); }
    });

  cmd.addCommand(tmdb);

  // --- Telegram notifier plugin ---
  const telegram = new Command('telegram');
  telegram.description('Telegram notifier plugin commands');

  telegram.command('test').description('Send a test notification via Telegram')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.testTelegramNotifier();
        console.log(toon.formatToon(result, 'telegram_test'));
      } catch (err) { handleError(err, format); }
    });

  cmd.addCommand(telegram);

  // --- InfuseSync plugin ---
  const infuse = new Command('infusesync');
  infuse.description('InfuseSync plugin commands (for Infuse iOS/tvOS client)');

  infuse.command('checkpoint-create').description('Create a new InfuseSync checkpoint')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.createInfuseSyncCheckpoint();
        console.log(toon.formatToon({ checkpoint_id: result.CheckpointId }, 'infusesync_checkpoint'));
      } catch (err) { handleError(err, format); }
    });

  infuse.command('checkpoint-sync <checkpointId>').description('Start syncing an InfuseSync checkpoint')
    .option('-f, --format <format>', 'Output format')
    .action(async (checkpointId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.startInfuseSyncCheckpoint(checkpointId);
        console.log(toon.formatToon(result, 'infusesync_sync'));
      } catch (err) { handleError(err, format); }
    });

  infuse.command('checkpoint-removed <checkpointId>').description('Get removed items from an InfuseSync checkpoint')
    .option('-f, --format <format>', 'Output format')
    .action(async (checkpointId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getInfuseSyncRemovedItems(checkpointId);
        console.log(toon.formatToon(result, 'infusesync_removed'));
      } catch (err) { handleError(err, format); }
    });

  infuse.command('checkpoint-updated <checkpointId>').description('Get updated items from an InfuseSync checkpoint')
    .option('-f, --format <format>', 'Output format')
    .action(async (checkpointId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getInfuseSyncUpdatedItems(checkpointId);
        console.log(toon.formatToon(result, 'infusesync_updated'));
      } catch (err) { handleError(err, format); }
    });

  infuse.command('checkpoint-userdata <checkpointId>').description('Get user data from an InfuseSync checkpoint')
    .option('-f, --format <format>', 'Output format')
    .action(async (checkpointId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getInfuseSyncUserData(checkpointId);
        console.log(toon.formatToon(result, 'infusesync_userdata'));
      } catch (err) { handleError(err, format); }
    });

  infuse.command('user-folders [userId]').description('Get user folders for InfuseSync (defaults to current user)')
    .option('-f, --format <format>', 'Output format')
    .action(async (userId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getInfuseSyncUserFolders(userId);
        console.log(toon.formatToon(result, 'infusesync_folders'));
      } catch (err) { handleError(err, format); }
    });

  cmd.addCommand(infuse);

  return cmd;
}
