import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createLocalizationCommand(): Command {
  const cmd = new Command('localization');

  cmd.command('options').description('Get localization options')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const opts = await client.getLocalizationOptions();
        console.log(toon.formatToon(opts.map((o) => ({ name: o.Name, value: o.Value })), 'localization_options'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('countries').description('Get available countries')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit results')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        let countries = await client.getCountries();
        if (options.limit) countries = countries.slice(0, parseInt(options.limit, 10));
        console.log(toon.formatToon(countries.map((c) => ({
          name: c.Name,
          display_name: c.DisplayName,
          code_3: c.ThreeLetterISORegionName,
          code_2: c.TwoLetterISORegionName,
        })), 'countries'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('cultures').description('Get available cultures/languages')
    .option('-f, --format <format>', 'Output format')
    .option('--limit <number>', 'Limit results')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        let cultures = await client.getCultures();
        if (options.limit) cultures = cultures.slice(0, parseInt(options.limit, 10));
        console.log(toon.formatToon(cultures.map((c) => ({
          name: c.Name,
          display_name: c.DisplayName,
          code_3: c.ThreeLetterISOLanguageName,
          code_2: c.TwoLetterISOLanguageName,
        })), 'cultures'));
      } catch (err) { handleError(err, format); }
    });

  cmd.command('ratings').description('Get parental rating systems')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const systems = await client.getRatingSystems();
        console.log(toon.formatToon(systems.map((s) => ({
          name: s.Name,
          country_code: s.CountryCode,
        })), 'rating_systems'));
      } catch (err) { handleError(err, format); }
    });

  return cmd;
}
