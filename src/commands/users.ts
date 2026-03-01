import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createUsersCommand(): Command {
  const cmd = new Command('users');

  cmd
    .command('list')
    .description('List all users')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const users = await client.getUsers();
        console.log(toon.formatUsers(users));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('get <userId>')
    .description('Get user by ID')
    .option('-f, --format <format>', 'Output format')
    .action(async (userId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const user = await client.getUserById(userId);
        console.log(toon.formatUser(user));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('me')
    .description('Get current user info')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const user = await client.getCurrentUser();
        console.log(toon.formatUser(user));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('by-name <username>')
    .description('Get user by username')
    .option('-f, --format <format>', 'Output format')
    .action(async (username, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const users = await client.getUsers();
        const user = users.find((u) => u.Name?.toLowerCase() === username.toLowerCase());
        if (!user) {
          console.error(toon.formatError(`User '${username}' not found`));
          process.exit(1);
        }
        console.log(toon.formatUser(user));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('create <username>')
    .description('Create a new user')
    .option('-f, --format <format>', 'Output format')
    .option('--password <password>', 'User password')
    .action(async (username, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.createUser({ Name: username, Password: options.password });
        console.log(toon.formatToon({
          id: result.Id,
          name: result.Name,
          server_id: result.ServerId,
          created: true,
        }, 'user_created'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('update-password <userId>')
    .description('Update user password')
    .option('-f, --format <format>', 'Output format')
    .option('--current <password>', 'Current password')
    .option('--new <password>', 'New password')
    .action(async (userId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.updateUserPassword(userId, {
          CurrentPw: options.current,
          NewPw: options.new,
        });
        console.log(toon.formatMessage(`Password updated for user ${userId}`, true));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('delete <userId>')
    .description('Delete a user')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (userId, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm deletion');
        process.exit(1);
      }
      try {
        await client.deleteUser(userId);
        console.log(toon.formatMessage(`User ${userId} deleted`, true));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('policy <userId>')
    .description('Get user policy')
    .option('-f, --format <format>', 'Output format')
    .action(async (userId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const user = await client.getUserById(userId);
        console.log(toon.formatToon(user.Policy ?? {}, 'user_policy'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('update-policy <userId>')
    .description('Update user policy')
    .option('-f, --format <format>', 'Output format')
    .option('--admin <boolean>', 'Is administrator (true/false)')
    .option('--hidden <boolean>', 'Is hidden (true/false)')
    .option('--disabled <boolean>', 'Is disabled (true/false)')
    .option('--remote-access <boolean>', 'Enable remote access (true/false)')
    .option('--live-tv <boolean>', 'Enable Live TV access (true/false)')
    .option('--live-tv-manage <boolean>', 'Enable Live TV management (true/false)')
    .option('--playback <boolean>', 'Enable media playback (true/false)')
    .option('--transcoding <boolean>', 'Enable transcoding (true/false)')
    .option('--delete-content <boolean>', 'Enable content deletion (true/false)')
    .action(async (userId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const user = await client.getUserById(userId);
        const policy = user.Policy ?? {};
        
        if (options.admin !== undefined) policy.IsAdministrator = options.admin === 'true';
        if (options.hidden !== undefined) policy.IsHidden = options.hidden === 'true';
        if (options.disabled !== undefined) policy.IsDisabled = options.disabled === 'true';
        if (options.remoteAccess !== undefined) policy.EnableRemoteAccess = options.remoteAccess === 'true';
        if (options.liveTv !== undefined) policy.EnableLiveTvAccess = options.liveTv === 'true';
        if (options.liveTvManage !== undefined) policy.EnableLiveTvManagement = options.liveTvManage === 'true';
        if (options.playback !== undefined) policy.EnableMediaPlayback = options.playback === 'true';
        if (options.transcoding !== undefined) policy.EnableVideoPlaybackTranscoding = options.transcoding === 'true';
        if (options.deleteContent !== undefined) policy.EnableContentDeletion = options.deleteContent === 'true';

        await client.updateUserPolicy(userId, policy as Record<string, unknown>);
        console.log(toon.formatMessage(`Policy updated for user ${userId}`, true));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('config <userId>')
    .description('Get user configuration')
    .option('-f, --format <format>', 'Output format')
    .action(async (userId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const user = await client.getUserById(userId);
        console.log(toon.formatToon(user.Configuration ?? {}, 'user_config'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('update-config <userId>')
    .description('Update user configuration')
    .option('-f, --format <format>', 'Output format')
    .option('--subtitle-lang <lang>', 'Subtitle language preference')
    .option('--subtitle-mode <mode>', 'Subtitle playback mode (Default, Always, OnlyForced, None, Smart)')
    .option('--play-default-audio <boolean>', 'Play default audio track (true/false)')
    .option('--hide-played <boolean>', 'Hide played items in latest (true/false)')
    .option('--auto-play-next <boolean>', 'Auto-play next episode (true/false)')
    .action(async (userId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const user = await client.getUserById(userId);
        const config = user.Configuration ?? {};

        if (options.subtitleLang !== undefined) config.SubtitleLanguagePreference = options.subtitleLang;
        if (options.subtitleMode !== undefined) config.SubtitleMode = options.subtitleMode;
        if (options.playDefaultAudio !== undefined) config.PlayDefaultAudioTrack = options.playDefaultAudio === 'true';
        if (options.hidePlayed !== undefined) config.HidePlayedInLatest = options.hidePlayed === 'true';
        if (options.autoPlayNext !== undefined) config.EnableNextEpisodeAutoPlay = options.autoPlayNext === 'true';

        await client.updateUserConfiguration(userId, config as Record<string, unknown>);
        console.log(toon.formatMessage(`Configuration updated for user ${userId}`, true));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('views')
    .description('Get library views for the current user')
    .option('-f, --format <format>', 'Output format')
    .option('--user <userId>', 'User ID (defaults to current user)')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getUserViews(options.user);
        console.log(toon.formatToon((result.Items ?? []).map((v) => ({
          id: v.Id,
          name: v.Name,
          type: v.CollectionType ?? v.Type,
        })), 'user_views'));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('display-prefs <prefsId>')
    .description('Get display preferences for a view (use "usersettings" for general prefs)')
    .option('-f, --format <format>', 'Output format')
    .option('--client <client>', 'Client name', 'emby')
    .option('--user <userId>', 'User ID (defaults to current user)')
    .action(async (prefsId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const prefs = await client.getDisplayPreferences(prefsId, options.user, options.client);
        console.log(toon.formatToon({
          id: prefs.Id,
          client: prefs.Client,
          sort_by: prefs.SortBy,
          sort_order: prefs.SortOrder,
          view_type: prefs.ViewType,
          index_by: prefs.IndexBy,
          remember_indexing: prefs.RememberIndexing,
          remember_sorting: prefs.RememberSorting,
        }, 'display_prefs'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('public').description('List public (non-hidden) users (no auth required)')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const users = await client.getPublicUsers();
        console.log(toon.formatUsers(users));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
