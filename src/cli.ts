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
  createDiscoverCommand,
  createSetupCommand,
  createPluginsCommand,
  createDevicesCommand,
  createBrandingCommand,
  createStatsCommand,
  createApikeysCommand,
  createNotificationsCommand,
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
program.addCommand(createDiscoverCommand());
program.addCommand(createPluginsCommand());
program.addCommand(createDevicesCommand());
program.addCommand(createBrandingCommand());
program.addCommand(createStatsCommand());
program.addCommand(createApikeysCommand());
program.addCommand(createNotificationsCommand());

program.parse();
