import { Command } from 'commander';
import { createApiClient, handleError } from './utils.js';
import { toon } from '../formatters/index.js';

export function createTasksCommand(): Command {
  const cmd = new Command('tasks');

  cmd
    .command('list')
    .description('List all scheduled tasks')
    .option('-f, --format <format>', 'Output format')
    .option('--hidden', 'Include hidden tasks')
    .action(async (options) => {
      const { client, format } = await createApiClient(options);
      try {
        const tasks = await client.getScheduledTasks({ isHidden: options.hidden });
        console.log(toon.formatTasks(tasks));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('get <taskId>')
    .description('Get task by ID')
    .option('-f, --format <format>', 'Output format')
    .action(async (taskId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const task = await client.getScheduledTask(taskId);
        console.log(toon.formatTask(task));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('run <taskId>')
    .description('Start a scheduled task')
    .option('-f, --format <format>', 'Output format')
    .action(async (taskId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.startTask(taskId);
        console.log(`type: message\ndata:\n  message: Task started\n  success: true`);
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('stop <taskId>')
    .description('Stop a running task')
    .option('-f, --format <format>', 'Output format')
    .action(async (taskId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.stopTask(taskId);
        console.log(`type: message\ndata:\n  message: Task stopped\n  success: true`);
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
