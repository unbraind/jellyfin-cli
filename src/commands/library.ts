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

  return cmd;
}
