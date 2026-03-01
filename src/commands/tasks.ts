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
        console.log(toon.formatMessage('Task started'));
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
        console.log(toon.formatMessage('Task stopped'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('triggers <taskId>')
    .description('List task triggers')
    .option('-f, --format <format>', 'Output format')
    .action(async (taskId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        const triggers = await client.getTaskTriggers(taskId);
        console.log(toon.formatTaskTriggers(triggers));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('add-trigger <taskId>')
    .description('Add a task trigger')
    .option('-f, --format <format>', 'Output format')
    .requiredOption('--type <type>', 'Trigger type (DailyTrigger, WeeklyTrigger, IntervalTrigger, StartupTrigger)')
    .option('--interval <ticks>', 'Interval in ticks (for IntervalTrigger)')
    .option('--time <ticks>', 'Time of day in ticks (for DailyTrigger/WeeklyTrigger)')
    .option('--days <days>', 'Days of week (comma-separated, for WeeklyTrigger)')
    .action(async (taskId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.createTaskTrigger(taskId, {
          type: options.type,
          intervalTicks: options.interval ? parseInt(options.interval, 10) : undefined,
          timeOfDayTicks: options.time ? parseInt(options.time, 10) : undefined,
          dayOfWeek: options.days?.split(','),
        });
        console.log(toon.formatMessage('Task trigger added'));
      } catch (err) {
        handleError(err, format);
      }
    });

  cmd
    .command('delete-trigger <taskId> <triggerId>')
    .description('Delete a task trigger')
    .option('-f, --format <format>', 'Output format')
    .action(async (taskId, triggerId, options) => {
      const { client, format } = await createApiClient(options);
      try {
        await client.deleteTaskTrigger(taskId, triggerId);
        console.log(toon.formatMessage('Task trigger deleted'));
      } catch (err) {
        handleError(err, format);
      }
    });

  return cmd;
}
