import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createDevicesCommand(): Command {
  const cmd = new Command('devices');

  cmd
    .command('list')
    .description('List all devices')
    .option('-f, --format <format>', 'Output format')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const result = await client.getDevices();
        const simplified = (result.Items ?? []).map((d) => ({
          id: d.Id,
          name: d.Name,
          custom_name: d.CustomName,
          app_name: d.AppName,
          app_version: d.AppVersion,
          last_user: d.LastUserName,
          last_user_id: d.LastUserId,
          last_activity: d.DateLastActivity,
        }));
        console.log(toon.formatToon(simplified, 'devices'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('get <deviceId>')
    .description('Get device details')
    .option('-f, --format <format>', 'Output format')
    .action(async (deviceId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const device = await client.getDevice(deviceId);
        const simplified = {
          id: device.Id,
          name: device.Name,
          custom_name: device.CustomName,
          app_name: device.AppName,
          app_version: device.AppVersion,
          last_user: device.LastUserName,
          last_user_id: device.LastUserId,
          last_activity: device.DateLastActivity,
          capabilities: device.Capabilities ? {
            playable_media_types: device.Capabilities.PlayableMediaTypes,
            supports_media_control: device.Capabilities.SupportsMediaControl,
            supports_sync: device.Capabilities.SupportsSync,
          } : null,
        };
        console.log(toon.formatToon(simplified, 'device'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('rename <deviceId> <name>')
    .description('Set custom device name')
    .option('-f, --format <format>', 'Output format')
    .action(async (deviceId, name, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.updateDeviceOptions(deviceId, { customName: name });
        console.log(toon.formatMessage('Device name updated', true));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('delete <deviceId>')
    .description('Delete a device')
    .option('-f, --format <format>', 'Output format')
    .option('--force', 'Skip confirmation')
    .action(async (deviceId, options) => {
      const { client, format } = await createApiClient(options);
      if (!options.force) {
        console.error('Use --force to confirm deletion');
        process.exit(1);
      }
      try {
        await client.deleteDevice(deviceId);
        console.log(toon.formatMessage('Device deleted', true));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
