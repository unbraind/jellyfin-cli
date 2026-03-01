import { formatToon, formatMessage, formatError } from './base.js';
import { formatSystemInfo, formatUsers, formatUser, formatConfig, formatServers } from './system.js';
import { formatItems, formatItem, formatQueryResult, formatSearchResult, formatLibraries, formatActivityLog, formatLiveTvInfo } from './items.js';
import { formatSessions, formatSession, formatTasks, formatTask, formatTaskTriggers } from './sessions.js';

export interface ToonOutput {
  type: string;
  data: unknown;
}

export { formatToon, formatMessage, formatError };
export { formatSystemInfo, formatUsers, formatUser, formatConfig, formatServers };
export { formatItems, formatItem, formatQueryResult, formatSearchResult, formatLibraries, formatActivityLog, formatLiveTvInfo };
export { formatSessions, formatSession, formatTasks, formatTask, formatTaskTriggers };

export const toon = {
  formatToon,
  formatMessage,
  formatError,
  formatSystemInfo,
  formatUsers,
  formatUser,
  formatConfig,
  formatServers,
  formatItems,
  formatItem,
  formatQueryResult,
  formatSearchResult,
  formatLibraries,
  formatActivityLog,
  formatLiveTvInfo,
  formatSessions,
  formatSession,
  formatTasks,
  formatTask,
  formatTaskTriggers,
};
