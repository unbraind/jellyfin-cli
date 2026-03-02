import { Command } from 'commander';
import { writeFile } from 'node:fs/promises';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createFontsCommand(): Command {
  const cmd = new Command('fonts');
  cmd.description('Manage fallback subtitle fonts');

  cmd.command('list').description('List all installed fallback fonts')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const fonts = await client.getFallbackFonts();
        console.log(toon.formatToon(fonts.map((f) => ({
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
      const { client, format } = await createApiClient(options);
      try {
        const data = await client.getFallbackFont(name);
        const outPath = options.output ?? name;
        await writeFile(outPath, Buffer.from(data));
        console.log(toon.formatToon({ name, saved_to: outPath }, 'font_downloaded'));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
