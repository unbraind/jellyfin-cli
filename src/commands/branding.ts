import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { formatSuccess, toon } from '../formatters/index.js';

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

  cmd
    .command('css')
    .description('Get the server custom CSS')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const css = await client.getBrandingCss();
        if (format === 'raw' || format === 'json') {
          console.log(css);
        } else {
          console.log(toon.formatToon({ css: css || '(no custom CSS)' }, 'branding_css'));
        }
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('splashscreen-url')
    .description('Get the URL of the server splashscreen image')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const url = await client.getSplashscreenUrl();
        console.log(toon.formatToon({ url }, 'splashscreen'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('delete-splashscreen')
    .description('Delete the server splashscreen image')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm deletion of the splashscreen');
        process.exit(1);
      }
      try {
        await client.deleteSplashscreen();
        console.log(formatSuccess('Splashscreen deleted', format));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('update-config')
    .description('Update branding configuration (login disclaimer, custom CSS, splashscreen)')
    .option('-f, --format <format>', 'Output format')
    .option('--disclaimer <text>', 'Login disclaimer text')
    .option('--custom-css <css>', 'Custom CSS string')
    .option('--splashscreen-enabled <bool>', 'Enable splashscreen (true/false)')
    .option('--data <json>', 'Full branding config as JSON string')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        let config: Record<string, unknown> = {};
        if (options.data) {
          config = JSON.parse(options.data) as Record<string, unknown>;
        } else {
          if (options.disclaimer !== undefined) config['LoginDisclaimer'] = options.disclaimer;
          if (options.customCss !== undefined) config['CustomCss'] = options.customCss;
          if (options.splashscreenEnabled !== undefined) {
            config['SplashscreenEnabled'] = options.splashscreenEnabled === 'true';
          }
        }
        await client.updateBrandingConfiguration(config);
        console.log(formatSuccess('Branding configuration updated', format));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
