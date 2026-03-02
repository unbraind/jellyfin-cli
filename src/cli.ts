#!/usr/bin/env node

import { Command } from 'commander';
import {
  createConfigCommand,
  createSystemCommand,
  createUsersCommand,
  createItemsCommand,
  createSessionsCommand,
  createLibraryCommand,
  createUserDataCommand,
  createTasksCommand,
  createPlaylistsCommand,
  createLivetvCommand,
  createLivetvAdminCommand,
  createDiscoverCommand,
  createSetupCommand,
  createPluginsCommand,
  createDevicesCommand,
  createBrandingCommand,
  createStatsCommand,
  createApikeysCommand,
  createNotificationsCommand,
  createCollectionsCommand,
  createFavoritesCommand,
  createSyncPlayCommand,
  createQuickConnectCommand,
  createBackupCommand,
  createSubtitlesCommand,
  createMediaCommand,
  createLocalizationCommand,
  createEnvironmentCommand,
  createTvshowsCommand,
  createPackagesCommand,
  createImagesCommand,
  createSuggestionsCommand,
  createYearsCommand,
  createMusicGenresCommand,
  createTrickplayCommand,
  createChannelsCommand,
  createSchemaCommand,
  createArtistsCommand,
  createVideosCommand,
  createAuthCommand,
  createReportsCommand,
  createUsageStatsCommand,
  createFontsCommand,
  createLiveStreamsCommand,
} from './commands/index.js';

const VERSION = '1.0.0';

const program = new Command();

program
  .name('jellyfin-cli')
  .alias('jf')
  .description('Agent-optimized CLI tool for interacting with the Jellyfin API')
  .version(VERSION)
  .option('-f, --format <format>', 'Output format (toon, json, table, raw)', 'toon')
  .option('-s, --server <name>', 'Server name from config');

program.addCommand(createSetupCommand());
program.addCommand(createConfigCommand());
program.addCommand(createSystemCommand());
program.addCommand(createUsersCommand());
program.addCommand(createItemsCommand());
program.addCommand(createSessionsCommand());
program.addCommand(createLibraryCommand());
program.addCommand(createUserDataCommand());
program.addCommand(createTasksCommand());
program.addCommand(createPlaylistsCommand());
program.addCommand(createLivetvCommand());
program.addCommand(createLivetvAdminCommand());
program.addCommand(createDiscoverCommand());
program.addCommand(createPluginsCommand());
program.addCommand(createDevicesCommand());
program.addCommand(createBrandingCommand());
program.addCommand(createStatsCommand());
program.addCommand(createApikeysCommand());
program.addCommand(createNotificationsCommand());
program.addCommand(createCollectionsCommand());
program.addCommand(createFavoritesCommand());
program.addCommand(createSyncPlayCommand());
program.addCommand(createQuickConnectCommand());
program.addCommand(createBackupCommand());
program.addCommand(createSubtitlesCommand());
program.addCommand(createMediaCommand());
program.addCommand(createLocalizationCommand());
program.addCommand(createEnvironmentCommand());
program.addCommand(createTvshowsCommand());
program.addCommand(createPackagesCommand());
program.addCommand(createImagesCommand());
program.addCommand(createSuggestionsCommand());
program.addCommand(createYearsCommand());
program.addCommand(createMusicGenresCommand());
program.addCommand(createTrickplayCommand());
program.addCommand(createChannelsCommand());
program.addCommand(createSchemaCommand());
program.addCommand(createArtistsCommand());
program.addCommand(createVideosCommand());
program.addCommand(createAuthCommand());
program.addCommand(createReportsCommand());
program.addCommand(createUsageStatsCommand());
program.addCommand(createFontsCommand());
program.addCommand(createLiveStreamsCommand());

program.parse();
