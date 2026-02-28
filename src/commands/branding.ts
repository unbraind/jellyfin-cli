import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createBrandingCommand(): Command {
  const cmd = new Command('branding');

  cmd
    .command('get')
    .description('Get branding configuration')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const branding = await client.getBranding();
        const simplified = {
          login_disclaimer: branding.LoginDisclaimer,
          custom_css: branding.CustomCss?.slice(0, 500),
          splashscreen_enabled: branding.SplashscreenEnabled,
        };
        console.log(toon.formatToon(simplified, 'branding'));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
