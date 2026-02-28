import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createImagesCommand(): Command {
  const cmd = new Command('images');

  cmd
    .command('list <itemId>')
    .description('List images for an item')
    .option('-f, --format <format>', 'Output format')
    .action(async (itemId, options) => {
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
        console.log(toon.formatToon(simplified, 'item_images'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('url <itemId> <imageType>')
    .description('Get image URL')
    .option('-f, --format <format>', 'Output format')
    .option('--max-width <pixels>', 'Max width')
    .option('--max-height <pixels>', 'Max height')
    .option('--quality <number>', 'Quality (0-100)')
    .option('--index <number>', 'Image index (for multiple images of same type)')
    .action(async (itemId, imageType, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getItemImage(itemId, imageType, {
          maxWidth: options.maxWidth ? parseInt(options.maxWidth, 10) : undefined,
          maxHeight: options.maxHeight ? parseInt(options.maxHeight, 10) : undefined,
          quality: options.quality ? parseInt(options.quality, 10) : undefined,
          imageIndex: options.index ? parseInt(options.index, 10) : undefined,
        });
        console.log(toon.formatToon({ url, item_id: itemId, image_type: imageType }, 'image_url'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('delete <itemId> <imageType>')
    .description('Delete an image from an item')
    .option('-f, --format <format>', 'Output format')
    .option('--index <number>', 'Image index (for multiple images of same type)')
    .option('--force', 'Skip confirmation')
    .action(async (itemId, imageType, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm deletion');
        process.exit(1);
      }
      try {
        await client.deleteItemImage(itemId, imageType, options.index ? parseInt(options.index, 10) : undefined);
        console.log(toon.formatMessage(`Image ${imageType} deleted from item ${itemId}`, true));
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
    .action(async (userId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = client.getUserImage(userId, 'Primary', {
          maxWidth: options.maxWidth ? parseInt(options.maxWidth, 10) : undefined,
          maxHeight: options.maxHeight ? parseInt(options.maxHeight, 10) : undefined,
        });
        console.log(toon.formatToon({ url, user_id: userId }, 'user_image_url'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('delete-user <userId>')
    .description('Delete user profile image')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (userId, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm deletion');
        process.exit(1);
      }
      try {
        await client.deleteUserImage(userId, 'Primary');
        console.log(toon.formatMessage(`Profile image deleted for user ${userId}`, true));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
