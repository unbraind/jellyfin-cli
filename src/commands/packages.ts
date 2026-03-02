import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createPackagesCommand(): Command {
  const cmd = new Command('packages');

  cmd
    .command('list')
    .description('List available packages (plugins)')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const packages = await client.getPackages();
        const simplified = packages.map((p) => ({
          id: p.guid,
          name: p.name,
          category: p.category,
          description: p.description?.slice(0, 100),
          image_url: p.imageUrl,
          versions: (p.versions ?? []).slice(0, 3).map((v) => v.version),
        }));
        console.log(toon.formatToon(simplified, 'packages'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('get <packageId>')
    .description('Get package details')
    .option('-f, --format <format>', 'Output format')
    .action(async (packageId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const pkg = await client.getPackageInfo(packageId);
        const simplified = {
          id: pkg.guid,
          name: pkg.name,
          category: pkg.category,
          description: pkg.description ?? pkg.overview,
          owner: pkg.owner,
          image_url: pkg.imageUrl,
          versions: (pkg.versions ?? []).map((v) => ({
            version: v.version,
            changelog: v.changelog,
            target_abi: v.targetAbi,
            timestamp: v.timestamp,
          })),
        };
        console.log(toon.formatToon(simplified, 'package'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('install <packageId>')
    .description('Install a package')
    .option('-f, --format <format>', 'Output format')
    .option('--version <version>', 'Version to install')
    .option('--repository <url>', 'Repository URL')
    .action(async (packageId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.installPackage(packageId, options.version, options.repository);
        console.log(toon.formatMessage(`Package ${packageId} installation initiated`, true));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('cancel <installationId>')
    .description('Cancel a package installation')
    .option('-f, --format <format>', 'Output format')
    .action(async (installationId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.cancelPackageInstallation(installationId);
        console.log(toon.formatMessage(`Installation ${installationId} cancelled`, true));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('installing')
    .description('List currently installing packages')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const installing = await client.getInstallingPackages();
        const simplified = installing.map((i) => ({
          id: i.Id,
          name: i.Name,
          version: i.Version,
          status: i.Status,
        }));
        console.log(toon.formatToon(simplified, 'installing_packages'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('repositories')
    .description('List plugin repositories')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const repos = await client.getRepositories();
        const simplified = repos.map((r) => ({
          name: r.Name,
          url: r.Url,
          enabled: r.Enabled,
        }));
        console.log(toon.formatToon(simplified, 'repositories'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('set-repositories')
    .description('Set/replace the list of plugin repositories (JSON array on stdin or --data)')
    .option('-f, --format <format>', 'Output format')
    .option('--data <json>', 'JSON array of repositories: [{"Name":"x","Url":"y","Enabled":true}]')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        let repos: { Name?: string; Url?: string; Enabled?: boolean }[];
        if (options.data) {
          repos = JSON.parse(options.data);
        } else {
          // Read from stdin (works on bun and node)
          const chunks: Buffer[] = [];
          for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
          repos = JSON.parse(Buffer.concat(chunks).toString('utf8').trim());
        }
        await client.setRepositories(repos);
        console.log(toon.formatMessage(`Set ${repos.length} repository/repositories`, true));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
