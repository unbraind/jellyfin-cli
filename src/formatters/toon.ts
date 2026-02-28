import type { BaseItemDto, SessionInfo, UserDto, SystemInfo, JellyfinConfig, QueryResult, SearchResult, ActivityLogEntry, ScheduledTaskInfo, LibraryVirtualFolder, LiveTvInfo } from '../types/index.js';

export { formatToon, formatMessage, formatError, createToonOutput } from './base.js';
export type { ToonOutput } from './base.js';
export { formatSystemInfo, formatUsers, formatUser, formatConfig, formatServers } from './system.js';
export { formatItems, formatItem, formatQueryResult, formatSearchResult, formatLibraries, formatActivityLog, formatLiveTvInfo } from './items.js';
export { formatSessions, formatSession, formatTasks, formatTask } from './sessions.js';

import { formatToon as _formatToon, formatMessage as _formatMessage, formatError as _formatError } from './base.js';
import { formatSystemInfo as _formatSystemInfo, formatUsers as _formatUsers, formatUser as _formatUser, formatConfig as _formatConfig, formatServers as _formatServers } from './system.js';
import { formatItems as _formatItems, formatItem as _formatItem, formatQueryResult as _formatQueryResult, formatSearchResult as _formatSearchResult, formatLibraries as _formatLibraries, formatActivityLog as _formatActivityLog, formatLiveTvInfo as _formatLiveTvInfo } from './items.js';
import { formatSessions as _formatSessions, formatSession as _formatSession, formatTasks as _formatTasks, formatTask as _formatTask } from './sessions.js';

export const toon = {
  formatToon: _formatToon,
  formatMessage: _formatMessage,
  formatError: _formatError,
  formatSystemInfo: _formatSystemInfo,
  formatUsers: _formatUsers,
  formatUser: _formatUser,
  formatConfig: _formatConfig,
  formatServers: _formatServers,
  formatItems: _formatItems,
  formatItem: _formatItem,
  formatQueryResult: _formatQueryResult,
  formatSearchResult: _formatSearchResult,
  formatLibraries: _formatLibraries,
  formatActivityLog: _formatActivityLog,
  formatLiveTvInfo: _formatLiveTvInfo,
  formatSessions: _formatSessions,
  formatSession: _formatSession,
  formatTasks: _formatTasks,
  formatTask: _formatTask,
};
