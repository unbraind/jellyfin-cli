import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createLibraryCommand(): Command {
  const cmd = new Command('library');

  cmd
    .command('list')
    .description('List all libraries')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const libraries = await client.getLibraries();
        console.log(toon.formatLibraries(libraries));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('refresh')
    .description('Refresh all libraries')
    .option('-f, --format <format>', 'Output format')
    .option('--recursive', 'Refresh recursively')
    .option('--replace-metadata', 'Replace all metadata')
    .option('--replace-images', 'Replace all images')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.refreshLibrary({
          recursive: options.recursive,
          replaceAllMetadata: options.replaceMetadata,
          replaceAllImages: options.replaceImages,
        });
        console.log(toon.formatMessage('Refresh started'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('genres')
    .description('List all genres')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID')
    .option('--limit <number>', 'Limit', '100')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getGenres({
          parentId: options.parent,
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('studios')
    .description('List all studios')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getStudios({
          parentId: options.parent,
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('persons')
    .description('List all persons (actors, directors, etc.)')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID')
    .option('--limit <number>', 'Limit', '100')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getPersons({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('artists')
    .description('List all artists')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID')
    .option('--limit <number>', 'Limit', '100')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getArtists({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('album-artists')
    .description('List all album artists')
    .option('-f, --format <format>', 'Output format')
    .option('--parent <id>', 'Parent ID')
    .option('--limit <number>', 'Limit', '100')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getAlbumArtists({
          parentId: options.parent,
          limit: parseInt(options.limit, 10),
        });
        console.log(toon.formatItems(result.Items ?? []));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('virtual-folders')
    .description('List all virtual folders (library sources with paths)')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const folders = await client.getVirtualFolders();
        console.log(toon.formatToon(folders.map((f) => ({
          id: f.ItemId,
          name: f.Name,
          type: f.CollectionType,
          paths: f.Locations,
          refresh_progress: f.RefreshProgress,
          refresh_status: f.RefreshStatus,
        })), 'virtual_folders'));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('add-folder')
    .description('Add a new virtual folder (library source)')
    .option('-f, --format <format>', 'Output format')
    .requiredOption('--name <name>', 'Library name')
    .option('--type <type>', 'Collection type (movies, tvshows, music, books, photos, mixed)', 'mixed')
    .option('--paths <paths>', 'Comma-separated media paths')
    .option('--refresh', 'Refresh library after adding')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.addVirtualFolder({
          name: options.name,
          collectionType: options.type,
          paths: options.paths?.split(',').map((p: string) => p.trim()),
          refreshLibrary: options.refresh,
        });
        console.log(toon.formatMessage(`Virtual folder '${options.name}' added`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('remove-folder <name>')
    .description('Remove a virtual folder by name')
    .option('-f, --format <format>', 'Output format')
    .option('--refresh', 'Refresh library after removing')
    .option('--force', 'Skip confirmation')
    .action(async (name, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) { console.error('Use --force to confirm removal'); process.exit(1); }
      try {
        await client.removeVirtualFolder(name, options.refresh);
        console.log(toon.formatMessage(`Virtual folder '${name}' removed`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('rename-folder <name> <newName>')
    .description('Rename a virtual folder')
    .option('-f, --format <format>', 'Output format')
    .option('--refresh', 'Refresh library after renaming')
    .action(async (name, newName, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.renameVirtualFolder(name, newName, options.refresh);
        console.log(toon.formatMessage(`Virtual folder renamed from '${name}' to '${newName}'`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('add-path <folderName> <path>')
    .description('Add a media path to an existing virtual folder')
    .option('-f, --format <format>', 'Output format')
    .option('--network-path <path>', 'Network path override')
    .option('--refresh', 'Refresh library after adding')
    .action(async (folderName, path, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.addMediaPath({ name: folderName, path, networkPath: options.networkPath, refreshLibrary: options.refresh });
        console.log(toon.formatMessage(`Path '${path}' added to '${folderName}'`, true));
      } catch (err) { handleError(err, format); }
    });

  cmd
    .command('remove-path <folderName> <path>')
    .description('Remove a media path from a virtual folder')
    .option('-f, --format <format>', 'Output format')
    .option('--refresh', 'Refresh library after removing')
    .action(async (folderName, path, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.removeMediaPath(folderName, path, options.refresh);
        console.log(toon.formatMessage(`Path '${path}' removed from '${folderName}'`, true));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
