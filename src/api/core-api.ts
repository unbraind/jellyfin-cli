import type {
  AuthenticationResult, UserDto, SystemInfo, SessionInfo, QueryResult, SearchResult,
  BaseItemDto, ItemsQueryParams, LibraryVirtualFolder, ScheduledTaskInfo,
  PlaybackProgressInfo, PlaybackStopInfo, ActivityLogQueryResult,
} from '../types/index.js';
import { ApiClientBase } from './base.js';
import { JellyfinApiError, ChapterInfo, PlaybackInfoResponse } from './types.js';

export { JellyfinApiError };
export type { ChapterInfo, PlaybackInfoResponse };

/**
 * Provides core api behavior for the Jellyfin client and command runtime.
 */
export class CoreApi extends ApiClientBase {
  /**
   * Authenticates a Jellyfin user and installs the issued token on this client.
   * @param username - The Jellyfin username.
   * @param password - The user's plain-text password sent only to the configured server.
   * @returns The authenticated Jellyfin user.
   * @throws {JellyfinApiError} When the server returns an incomplete authentication result.
   */
  async authenticate(username: string, password: string): Promise<UserDto> {
    const result = await this.request<AuthenticationResult>(
      'POST',
      '/Users/AuthenticateByName',
      undefined,
      { Username: username, Pw: password },
    );
    if (!result.User || !result.AccessToken) {
      throw new JellyfinApiError('Authentication response did not include a user and access token');
    }
    this.apiKey = result.AccessToken;
    if (result.User.Id) this.userId = result.User.Id;
    return result.User;
  }

  /**
   * Retrieves or derives public system info without mutating Jellyfin state.
   * @returns - The typed get public system info result.
   */
  async getPublicSystemInfo(): Promise<SystemInfo> { return this.request<SystemInfo>('GET', '/System/Info/Public'); }
  /**
   * Retrieves or derives system info without mutating Jellyfin state.
   * @returns - The typed get system info result.
   */
  async getSystemInfo(): Promise<SystemInfo> { return this.request<SystemInfo>('GET', '/System/Info'); }
  /**
   * Retrieves or derives health without mutating Jellyfin state.
   * @returns - The normalized string representation.
   */
  async getHealth(): Promise<string> { return this.request<string>('GET', '/Health'); }
  /**
   * Implements restart server for the typed Jellyfin CLI runtime.
   */
  async restartServer(): Promise<void> { await this.request<void>('POST', '/System/Restart'); }
  /**
   * Implements shutdown server for the typed Jellyfin CLI runtime.
   */
  async shutdownServer(): Promise<void> { await this.request<void>('POST', '/System/Shutdown'); }

  /**
   * Retrieves or derives users without mutating Jellyfin state.
   * @returns - The typed get users result.
   */
  async getUsers(): Promise<UserDto[]> { return this.request<UserDto[]>('GET', '/Users'); }
  /**
   * Retrieves or derives user by id without mutating Jellyfin state.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getUserById(userId: string): Promise<UserDto> { return this.request<UserDto>('GET', `/Users/${userId}`); }
  /**
   * Retrieves or derives current user without mutating Jellyfin state.
   * @returns - The typed get current user result.
   */
  async getCurrentUser(): Promise<UserDto> {
    if (!this.userId) throw new JellyfinApiError('No user ID set');
    return this.getUserById(this.userId);
  }

  /**
   * Retrieves or derives sessions without mutating Jellyfin state.
   * @returns - The typed get sessions result.
   */
  async getSessions(): Promise<SessionInfo[]> { return this.request<SessionInfo[]>('GET', '/Sessions'); }
  /**
   * Retrieves or derives session by id without mutating Jellyfin state.
   * @param sessionId - The session id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getSessionById(sessionId: string): Promise<SessionInfo> { return this.request<SessionInfo>('GET', `/Sessions/${sessionId}`); }
  /**
   * Performs the send message command operation through the typed Jellyfin API boundary.
   * @param sessionId - The session id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.header - The header value required by this operation.
   * @param params.text - The text value required by this operation.
   * @param params.timeoutMs - The timeout ms value required by this operation.
   * @returns - The normalized string representation.
   */
  async sendMessageCommand(sessionId: string, params: { header: string; text: string; timeoutMs?: number }): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/Message`, params); }
  /**
   * Implements play command for the typed Jellyfin CLI runtime.
   * @param sessionId - The session id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.itemIds - The item ids value required by this operation.
   * @param params.playCommand - The play command value required by this operation.
   * @param params.startPositionTicks - The start position ticks value required by this operation.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.audioStreamIndex - The audio stream index value required by this operation.
   * @param params.subtitleStreamIndex - The subtitle stream index value required by this operation.
   * @returns - The normalized string representation.
   */
  async playCommand(sessionId: string, params: { itemIds: string[]; playCommand?: string; startPositionTicks?: number; mediaSourceId?: string; audioStreamIndex?: number; subtitleStreamIndex?: number }): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/Playing`, params); }
  /**
   * Implements playstate command for the typed Jellyfin CLI runtime.
   * @param sessionId - The session id value required by this operation.
   * @param command - The Commander command whose path or behavior is inspected.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.seekPositionTicks - The seek position ticks value required by this operation.
   * @returns - The normalized string representation.
   */
  async playstateCommand(sessionId: string, command: string, params?: { seekPositionTicks?: number }): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/Playing/${command}`, params); }
  /**
   * Performs the set repeat mode operation through the typed Jellyfin API boundary.
   * @param sessionId - The session id value required by this operation.
   * @param mode - The mode value required by this operation.
   */
  async setRepeatMode(sessionId: string, mode: string): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/RepeatMode`, { mode }); }
  /**
   * Performs the set shuffle mode operation through the typed Jellyfin API boundary.
   * @param sessionId - The session id value required by this operation.
   * @param mode - The mode value required by this operation.
   */
  async setShuffleMode(sessionId: string, mode: string): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/Shuffle`, { mode }); }
  /**
   * Performs the send system command operation through the typed Jellyfin API boundary.
   * @param sessionId - The session id value required by this operation.
   * @param command - The Commander command whose path or behavior is inspected.
   */
  async sendSystemCommand(sessionId: string, command: string): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/System/${command}`); }
  /**
   * Performs the set volume operation through the typed Jellyfin API boundary.
   * @param sessionId - The session id value required by this operation.
   * @param level - The level value required by this operation.
   */
  async setVolume(sessionId: string, level: number): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/System/SetVolume`, { volume: level }); }

  /**
   * Performs the report playback start operation through the typed Jellyfin API boundary.
   * @param info - The info value required by this operation.
   */
  async reportPlaybackStart(info: PlaybackProgressInfo): Promise<void> { await this.request<void>('POST', '/Sessions/Playing', undefined, info); }
  /**
   * Performs the report playback progress operation through the typed Jellyfin API boundary.
   * @param info - The info value required by this operation.
   */
  async reportPlaybackProgress(info: PlaybackProgressInfo): Promise<void> { await this.request<void>('POST', '/Sessions/Playing/Progress', undefined, info); }
  /**
   * Performs the report playback stopped operation through the typed Jellyfin API boundary.
   * @param info - The info value required by this operation.
   */
  async reportPlaybackStopped(info: PlaybackStopInfo): Promise<void> { await this.request<void>('POST', '/Sessions/Playing/Stopped', undefined, info); }
  /**
   * Implements ping playback session for the typed Jellyfin CLI runtime.
   * @param playSessionId - The play session id value required by this operation.
   */
  async pingPlaybackSession(playSessionId: string): Promise<void> { await this.request<void>('POST', '/Sessions/Playing/Ping', undefined, { PlaySessionId: playSessionId }); }
  /**
   * Performs the report playing item start operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.sessionId - The session id value required by this operation.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.audioStreamIndex - The audio stream index value required by this operation.
   * @param params.subtitleStreamIndex - The subtitle stream index value required by this operation.
   * @param params.positionTicks - The position ticks value required by this operation.
   * @returns - The normalized string representation.
   */
  async reportPlayingItemStart(itemId: string, params?: { sessionId?: string; mediaSourceId?: string; audioStreamIndex?: number; subtitleStreamIndex?: number; positionTicks?: number }): Promise<void> { await this.request<void>('POST', `/PlayingItems/${itemId}`, params); }
  /**
   * Performs the report playing item progress operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.sessionId - The session id value required by this operation.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.positionTicks - The position ticks value required by this operation.
   * @param params.isPaused - The is paused value required by this operation.
   * @param params.isMuted - The is muted value required by this operation.
   * @param params.playbackRate - The playback rate value required by this operation.
   * @returns - The normalized string representation.
   */
  async reportPlayingItemProgress(itemId: string, params?: { sessionId?: string; mediaSourceId?: string; positionTicks?: number; isPaused?: boolean; isMuted?: boolean; playbackRate?: number }): Promise<void> { await this.request<void>('POST', `/PlayingItems/${itemId}/Progress`, params); }
  /**
   * Performs the report playing item stopped operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.sessionId - The session id value required by this operation.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.positionTicks - The position ticks value required by this operation.
   * @returns - The normalized string representation.
   */
  async reportPlayingItemStopped(itemId: string, params?: { sessionId?: string; mediaSourceId?: string; positionTicks?: number }): Promise<void> { await this.request<void>('DELETE', `/PlayingItems/${itemId}`, params); }

  /**
   * Retrieves or derives items without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @returns - The typed get items result.
   */
  async getItems(params?: ItemsQueryParams & { userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    const path = userId ? `/Users/${userId}/Items` : '/Items';
    return this.request<QueryResult<BaseItemDto>>('GET', path, params as Record<string, unknown>);
  }
  /**
   * Retrieves or derives item without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getItem(itemId: string, userId?: string): Promise<BaseItemDto> {
    const uid = userId ?? this.userId;
    if (uid) return this.request<BaseItemDto>('GET', `/Users/${uid}/Items/${itemId}`);
    return this.request<BaseItemDto>('GET', `/Items/${itemId}`);
  }
  /**
   * Retrieves or derives latest items without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.fields - The fields value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @returns - The typed get latest items result.
   */
  async getLatestItems(params?: { parentId?: string; limit?: number; fields?: string[]; userId?: string }): Promise<BaseItemDto[]> {
    const userId = params?.userId ?? this.userId;
    if (!userId) throw new JellyfinApiError('User ID required');
    return this.request<BaseItemDto[]>('GET', `/Users/${userId}/Items/Latest`, params as Record<string, unknown>);
  }
  /**
   * Retrieves or derives resume items without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.fields - The fields value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @returns - The typed get resume items result.
   */
  async getResumeItems(params?: { parentId?: string; limit?: number; fields?: string[]; userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    if (!userId) throw new JellyfinApiError('User ID required');
    return this.request<QueryResult<BaseItemDto>>('GET', `/Users/${userId}/Items/Resume`, params as Record<string, unknown>);
  }
  /**
   * Retrieves or derives search hints without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.searchTerm - The search term value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.includeItemTypes - The include item types value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @returns - The typed get search hints result.
   */
  async getSearchHints(params: { searchTerm: string; limit?: number; includeItemTypes?: string[]; userId?: string }): Promise<SearchResult> {
    const userId = params.userId ?? this.userId;
    return this.request<SearchResult>('GET', '/Search/Hints', { ...params, userId });
  }

  /**
   * Retrieves or derives libraries without mutating Jellyfin state.
   * @returns - The typed get libraries result.
   */
  async getLibraries(): Promise<LibraryVirtualFolder[]> { return this.request<LibraryVirtualFolder[]>('GET', '/Library/VirtualFolders'); }
  /**
   * Implements refresh library for the typed Jellyfin CLI runtime.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.recursive - The recursive value required by this operation.
   * @param params.metadataRefreshMode - The metadata refresh mode value required by this operation.
   * @param params.replaceAllMetadata - The replace all metadata value required by this operation.
   * @param params.replaceAllImages - The replace all images value required by this operation.
   * @returns - The typed refresh library result.
   */
  async refreshLibrary(params?: { recursive?: boolean; metadataRefreshMode?: string; replaceAllMetadata?: boolean; replaceAllImages?: boolean }): Promise<void> { await this.request<void>('POST', '/Library/Refresh', params); }
  /**
   * Retrieves or derives scheduled tasks without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.isHidden - The is hidden value required by this operation.
   * @returns - The typed get scheduled tasks result.
   */
  async getScheduledTasks(params?: { isHidden?: boolean }): Promise<ScheduledTaskInfo[]> { return this.request<ScheduledTaskInfo[]>('GET', '/ScheduledTasks', params); }
  /**
   * Retrieves or derives scheduled task without mutating Jellyfin state.
   * @param taskId - The task id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getScheduledTask(taskId: string): Promise<ScheduledTaskInfo> { return this.request<ScheduledTaskInfo>('GET', `/ScheduledTasks/${taskId}`); }
  /**
   * Performs the start task operation through the typed Jellyfin API boundary.
   * @param taskId - The task id value required by this operation.
   */
  async startTask(taskId: string): Promise<void> { await this.request<void>('POST', `/ScheduledTasks/Running/${taskId}`); }
  /**
   * Performs the stop task operation through the typed Jellyfin API boundary.
   * @param taskId - The task id value required by this operation.
   */
  async stopTask(taskId: string): Promise<void> { await this.request<void>('DELETE', `/ScheduledTasks/Running/${taskId}`); }
  /**
   * Retrieves or derives activity log without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.minDate - The min date value required by this operation.
   * @param params.hasUserId - The has user id value required by this operation.
   * @returns - The typed get activity log result.
   */
  async getActivityLog(params?: { startIndex?: number; limit?: number; minDate?: string; hasUserId?: boolean }): Promise<ActivityLogQueryResult> { return this.request<ActivityLogQueryResult>('GET', '/System/ActivityLog/Entries', params); }
}
