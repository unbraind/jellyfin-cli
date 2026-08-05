import { Command } from 'commander';
import { writeFile } from 'node:fs/promises';
import { createApiClient, handleError } from './utils.js';

/**
 * Builds the fonts command tree with validated options and actions.
 * @returns - The configured Commander command tree.
 */
export function createFontsCommand(): Command {
  const cmd = new Command('fonts');
  cmd.description('Manage fallback subtitle fonts');

  cmd.command('list').description('List all installed fallback fonts')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format, formatter } = await createApiClient(options);
      try {
        const fonts = await client.getFallbackFonts();
        console.log(formatter.formatToon(fonts.map((f) => ({
          name: f.Name,
          filename: f.Filename,
          size: f.FileSize,
          created: f.DateCreated,
        })), 'fallback_fonts'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('get <name>').description('Download a fallback font file by name')
    .option('-f, --format <format>', 'Output format')
    .option('--output <path>', 'Output file path (defaults to font name)')
    .action(async (name, options) => {
      const { client, format, formatter } = await createApiClient(options);
      try {
        const data = await client.getFallbackFont(name);
        const outPath = options.output ?? name;
        await writeFile(outPath, Buffer.from(data));
        console.log(formatter.formatToon({ name, saved_to: outPath }, 'font_downloaded'));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
