import { Command } from 'commander';
import { formatOutput } from '../formatters/index.js';
import { createApiClient, handleError } from './utils.js';

type ImageUrlOptions = {
  format?: string | undefined;
  maxWidth?: string | undefined;
  maxHeight?: string | undefined;
  quality?: string | undefined;
  index?: string | undefined;
};

function parseOptionalInt(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  return parseInt(value, 10);
}

function parseBaseImageOptions(options: ImageUrlOptions): {
  maxWidth?: number;
  maxHeight?: number;
  imageIndex?: number;
} {
  return {
    maxWidth: parseOptionalInt(options.maxWidth),
    maxHeight: parseOptionalInt(options.maxHeight),
    imageIndex: parseOptionalInt(options.index),
  };
}

function addNamedImageUrlCommand(
  cmd: Command,
  name: string,
  description: string,
  resolver: (
    client: Awaited<ReturnType<typeof createApiClient>>['client'],
    entityName: string,
    imageType: string,
    options: { maxWidth?: number; maxHeight?: number; imageIndex?: number },
  ) => string,
  typeHint: string,
): void {
  cmd
    .command(`${name} <entityName> <imageType>`)
    .description(description)
    .option('-f, --format <format>', 'Output format')
    .option('--max-width <pixels>', 'Max width')
    .option('--max-height <pixels>', 'Max height')
    .option('--index <number>', 'Image index (for multiple images of same type)')
    .action(async (entityName: string, imageType: string, options: ImageUrlOptions) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = resolver(client, entityName, imageType, parseBaseImageOptions(options));
        console.log(formatOutput({ url, entity_name: entityName, image_type: imageType }, format, typeHint));
      } catch (err) {
        handleError(err, format);
      }
    });
}

export function createImagesCommand(): Command {
  const cmd = new Command('images');

  cmd
    .command('list <itemId>')
    .description('List images for an item')
    .option('-f, --format <format>', 'Output format')
    .action(async (itemId: string, options: ImageUrlOptions) => {
      const { client, format } = await createApiClient(options);
      try {
        const images = await client.getItemImages(itemId);
        const simplified = images.map((img) => ({
          type: img.Type,
          width: img.Width,
          height: img.Height,
          size: img.Size,
          date_modified: img.DateModified,
          blur_hash: img.BlurHash,
        }));
        console.log(formatOutput(simplified, format, 'item_images'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('url <itemId> <imageType>')
    .description('Get item image URL')
    .option('-f, --format <format>', 'Output format')
    .option('--max-width <pixels>', 'Max width')
    .option('--max-height <pixels>', 'Max height')
    .option('--quality <number>', 'Quality (0-100)')
    .option('--index <number>', 'Image index (for multiple images of same type)')
    .action(async (itemId: string, imageType: string, options: ImageUrlOptions) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getItemImage(itemId, imageType, {
          ...parseBaseImageOptions(options),
          quality: parseOptionalInt(options.quality),
        });
        console.log(formatOutput({ url, item_id: itemId, image_type: imageType }, format, 'image_url'));
      } catch (err) {
        handleError(err, format);
      }
    });

  addNamedImageUrlCommand(
    cmd,
    'artist-url',
    'Get artist image URL by artist name',
    (client, entityName, imageType, options) => client.getArtistImage(entityName, imageType, options),
    'artist_image_url',
  );

  addNamedImageUrlCommand(
    cmd,
    'genre-url',
    'Get genre image URL by genre name',
    (client, entityName, imageType, options) => client.getGenreImage(entityName, imageType, options),
    'genre_image_url',
  );

  addNamedImageUrlCommand(
    cmd,
    'music-genre-url',
    'Get music genre image URL by genre name',
    (client, entityName, imageType, options) => client.getMusicGenreImage(entityName, imageType, options),
    'music_genre_image_url',
  );

  addNamedImageUrlCommand(
    cmd,
    'person-url',
    'Get person image URL by person name',
    (client, entityName, imageType, options) => client.getPersonImage(entityName, imageType, options),
    'person_image_url',
  );

  addNamedImageUrlCommand(
    cmd,
    'studio-url',
    'Get studio image URL by studio name',
    (client, entityName, imageType, options) => client.getStudioImage(entityName, imageType, options),
    'studio_image_url',
  );

  cmd
    .command('delete <itemId> <imageType>')
    .description('Delete an image from an item')
    .option('-f, --format <format>', 'Output format')
    .option('--index <number>', 'Image index (for multiple images of same type)')
    .option('--force', 'Skip confirmation')
    .action(async (itemId: string, imageType: string, options: ImageUrlOptions & { force?: boolean }) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error(formatOutput({ error: 'Use --force to confirm deletion' }, format, 'error'));
        process.exit(1);
      }
      try {
        await client.deleteItemImage(itemId, imageType, parseOptionalInt(options.index));
        console.log(
          formatOutput({ success: true, message: `Image ${imageType} deleted from item ${itemId}` }, format, 'success'),
        );
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('user <userId>')
    .description('Get user profile image URL')
    .option('-f, --format <format>', 'Output format')
    .option('--max-width <pixels>', 'Max width')
    .option('--max-height <pixels>', 'Max height')
    .option('--index <number>', 'Image index (for multiple images of same type)')
    .action(async (userId: string, options: ImageUrlOptions) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getUserImage(userId, 'Primary', parseBaseImageOptions(options));
        console.log(formatOutput({ url, user_id: userId }, format, 'user_image_url'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('delete-user <userId>')
    .description('Delete user profile image')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (userId: string, options: { format?: string | undefined; force?: boolean }) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error(formatOutput({ error: 'Use --force to confirm deletion' }, format, 'error'));
        process.exit(1);
      }
      try {
        await client.deleteUserImage(userId, 'Primary');
        console.log(
          formatOutput({ success: true, message: `Profile image deleted for user ${userId}` }, format, 'success'),
        );
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
