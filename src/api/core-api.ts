import type {
  UserDto, SystemInfo, SessionInfo, QueryResult, SearchResult,
  BaseItemDto, ItemsQueryParams, LibraryVirtualFolder, ScheduledTaskInfo,
  PlaybackProgressInfo, PlaybackStopInfo, ActivityLogQueryResult,
} from '../types/index.js';
import { ApiClientBase } from './base.js';
import { JellyfinApiError, ChapterInfo, PlaybackInfoResponse } from './types.js';

export { JellyfinApiError };
export type { ChapterInfo, PlaybackInfoResponse };

export class CoreApi extends ApiClientBase {
  async authenticate(username: string, password: string): Promise<UserDto> {
    const result = await this.request<UserDto>('POST', '/Users/AuthenticateByName', undefined, { Username: username, Pw: password });
    if (result.Id) this.userId = result.Id;
    return result;
  }

  async getPublicSystemInfo(): Promise<SystemInfo> { return this.request<SystemInfo>('GET', '/System/Info/Public'); }
  async getSystemInfo(): Promise<SystemInfo> { return this.request<SystemInfo>('GET', '/System/Info'); }
  async getHealth(): Promise<string> { return this.request<string>('GET', '/Health'); }
  async restartServer(): Promise<void> { await this.request<void>('POST', '/System/Restart'); }
  async shutdownServer(): Promise<void> { await this.request<void>('POST', '/System/Shutdown'); }

  async getUsers(): Promise<UserDto[]> { return this.request<UserDto[]>('GET', '/Users'); }
  async getUserById(userId: string): Promise<UserDto> { return this.request<UserDto>('GET', `/Users/${userId}`); }
  async getCurrentUser(): Promise<UserDto> {
    if (!this.userId) throw new JellyfinApiError('No user ID set');
    return this.getUserById(this.userId);
  }

  async getSessions(): Promise<SessionInfo[]> { return this.request<SessionInfo[]>('GET', '/Sessions'); }
  async getSessionById(sessionId: string): Promise<SessionInfo> { return this.request<SessionInfo>('GET', `/Sessions/${sessionId}`); }
  async sendMessageCommand(sessionId: string, params: { header: string; text: string; timeoutMs?: number }): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/Message`, params); }
  async playCommand(sessionId: string, params: { itemIds: string[]; playCommand?: string; startPositionTicks?: number; mediaSourceId?: string; audioStreamIndex?: number; subtitleStreamIndex?: number }): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/Playing`, params); }
  async playstateCommand(sessionId: string, command: string, params?: { seekPositionTicks?: number }): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/Playing/${command}`, params); }
  async setRepeatMode(sessionId: string, mode: string): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/RepeatMode`, { mode }); }
  async setShuffleMode(sessionId: string, mode: string): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/Shuffle`, { mode }); }
  async sendSystemCommand(sessionId: string, command: string): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/System/${command}`); }
  async setVolume(sessionId: string, level: number): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/System/SetVolume`, { volume: level }); }

  async reportPlaybackStart(info: PlaybackProgressInfo): Promise<void> { await this.request<void>('POST', '/Sessions/Playing', undefined, info); }
  async reportPlaybackProgress(info: PlaybackProgressInfo): Promise<void> { await this.request<void>('POST', '/Sessions/Playing/Progress', undefined, info); }
  async reportPlaybackStopped(info: PlaybackStopInfo): Promise<void> { await this.request<void>('POST', '/Sessions/Playing/Stopped', undefined, info); }
  async pingPlaybackSession(playSessionId: string): Promise<void> { await this.request<void>('POST', '/Sessions/Playing/Ping', undefined, { PlaySessionId: playSessionId }); }
  async reportPlayingItemStart(itemId: string, params?: { sessionId?: string; mediaSourceId?: string; audioStreamIndex?: number; subtitleStreamIndex?: number; positionTicks?: number }): Promise<void> { await this.request<void>('POST', `/PlayingItems/${itemId}`, params); }
  async reportPlayingItemProgress(itemId: string, params?: { sessionId?: string; mediaSourceId?: string; positionTicks?: number; isPaused?: boolean; isMuted?: boolean; playbackRate?: number }): Promise<void> { await this.request<void>('POST', `/PlayingItems/${itemId}/Progress`, params); }
  async reportPlayingItemStopped(itemId: string, params?: { sessionId?: string; mediaSourceId?: string; positionTicks?: number }): Promise<void> { await this.request<void>('DELETE', `/PlayingItems/${itemId}`, params); }

  async getItems(params?: ItemsQueryParams & { userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    const path = userId ? `/Users/${userId}/Items` : '/Items';
    return this.request<QueryResult<BaseItemDto>>('GET', path, params as Record<string, unknown>);
  }
  async getItem(itemId: string, userId?: string): Promise<BaseItemDto> {
    const uid = userId ?? this.userId;
    if (uid) return this.request<BaseItemDto>('GET', `/Users/${uid}/Items/${itemId}`);
    return this.request<BaseItemDto>('GET', `/Items/${itemId}`);
  }
  async getLatestItems(params?: { parentId?: string; limit?: number; fields?: string[]; userId?: string }): Promise<BaseItemDto[]> {
    const userId = params?.userId ?? this.userId;
    if (!userId) throw new JellyfinApiError('User ID required');
    return this.request<BaseItemDto[]>('GET', `/Users/${userId}/Items/Latest`, params as Record<string, unknown>);
  }
  async getResumeItems(params?: { parentId?: string; limit?: number; fields?: string[]; userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    if (!userId) throw new JellyfinApiError('User ID required');
    return this.request<QueryResult<BaseItemDto>>('GET', `/Users/${userId}/Items/Resume`, params as Record<string, unknown>);
  }
  async getSearchHints(params: { searchTerm: string; limit?: number; includeItemTypes?: string[]; userId?: string }): Promise<SearchResult> {
    const userId = params.userId ?? this.userId;
    return this.request<SearchResult>('GET', '/Search/Hints', { ...params, userId });
  }

  async getLibraries(): Promise<LibraryVirtualFolder[]> { return this.request<LibraryVirtualFolder[]>('GET', '/Library/VirtualFolders'); }
  async refreshLibrary(params?: { recursive?: boolean; metadataRefreshMode?: string; replaceAllMetadata?: boolean; replaceAllImages?: boolean }): Promise<void> { await this.request<void>('POST', '/Library/Refresh', params); }
  async getScheduledTasks(params?: { isHidden?: boolean }): Promise<ScheduledTaskInfo[]> { return this.request<ScheduledTaskInfo[]>('GET', '/ScheduledTasks', params); }
  async getScheduledTask(taskId: string): Promise<ScheduledTaskInfo> { return this.request<ScheduledTaskInfo>('GET', `/ScheduledTasks/${taskId}`); }
  async startTask(taskId: string): Promise<void> { await this.request<void>('POST', `/ScheduledTasks/Running/${taskId}`); }
  async stopTask(taskId: string): Promise<void> { await this.request<void>('DELETE', `/ScheduledTasks/Running/${taskId}`); }
  async getActivityLog(params?: { startIndex?: number; limit?: number; minDate?: string; hasUserId?: boolean }): Promise<ActivityLogQueryResult> { return this.request<ActivityLogQueryResult>('GET', '/System/ActivityLog/Entries', params); }
}
