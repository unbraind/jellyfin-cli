import type { JellyfinConfig, SystemInfo, UserDto, BaseItemDto, SessionInfo, QueryResult, SearchResult, ItemsQueryParams, LibraryVirtualFolder, ScheduledTaskInfo, PlaybackProgressInfo, PlaybackStopInfo, ActivityLogQueryResult, LiveTvInfo, PlaylistCreationResult, RecommendationDto, SimilarItemResult } from '../types/index.js';
import type { PluginInfo, DeviceInfo, BrandingOptions, ServerConfiguration, ItemCounts, ApiKeyInfo, NotificationTypeInfo, NotificationResult } from '../types/index.js';
import { ApiClientBase } from './base.js';
import { JellyfinApiError, ChapterInfo, PlaybackInfoResponse } from './types.js';

export { JellyfinApiError } from './types.js';
export type { ChapterInfo, PlaybackInfoResponse } from './types.js';

export class JellyfinApiClient extends ApiClientBase {
  constructor(config: JellyfinConfig) {
    super(config);
  }

  async authenticate(username: string, password: string): Promise<UserDto> {
    const result = await this.request<UserDto>('POST', '/Users/AuthenticateByName', undefined, {
      Username: username,
      Pw: password,
    });
    if (result.Id) {
      this.userId = result.Id;
    }
    return result;
  }

  async getPublicSystemInfo(): Promise<SystemInfo> {
    return this.request<SystemInfo>('GET', '/System/Info/Public');
  }

  async getSystemInfo(): Promise<SystemInfo> {
    return this.request<SystemInfo>('GET', '/System/Info');
  }

  async getUsers(): Promise<UserDto[]> {
    return this.request<UserDto[]>('GET', '/Users');
  }

  async getUserById(userId: string): Promise<UserDto> {
    return this.request<UserDto>('GET', `/Users/${userId}`);
  }

  async getCurrentUser(): Promise<UserDto> {
    if (!this.userId) {
      throw new JellyfinApiError('No user ID set');
    }
    return this.getUserById(this.userId);
  }

  async getItems(params?: ItemsQueryParams & { userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    const path = userId ? `/Users/${userId}/Items` : '/Items';
    return this.request<QueryResult<BaseItemDto>>('GET', path, params as Record<string, unknown>);
  }

  async getItem(itemId: string, userId?: string): Promise<BaseItemDto> {
    const uid = userId ?? this.userId;
    if (uid) {
      return this.request<BaseItemDto>('GET', `/Users/${uid}/Items/${itemId}`);
    }
    return this.request<BaseItemDto>('GET', `/Items/${itemId}`);
  }

  async getLatestItems(params?: { parentId?: string; limit?: number; fields?: string[]; userId?: string }): Promise<BaseItemDto[]> {
    const userId = params?.userId ?? this.userId;
    if (!userId) {
      throw new JellyfinApiError('User ID required for latest items');
    }
    return this.request<BaseItemDto[]>('GET', `/Users/${userId}/Items/Latest`, params as Record<string, unknown>);
  }

  async getResumeItems(params?: { parentId?: string; limit?: number; fields?: string[]; userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    if (!userId) {
      throw new JellyfinApiError('User ID required for resume items');
    }
    return this.request<QueryResult<BaseItemDto>>('GET', `/Users/${userId}/Items/Resume`, params as Record<string, unknown>);
  }

  async getSearchHints(params: { searchTerm: string; limit?: number; includeItemTypes?: string[]; userId?: string }): Promise<SearchResult> {
    const userId = params.userId ?? this.userId;
    return this.request<SearchResult>('GET', '/Search/Hints', { ...params, userId });
  }

  async getSessions(): Promise<SessionInfo[]> {
    return this.request<SessionInfo[]>('GET', '/Sessions');
  }

  async getSessionById(sessionId: string): Promise<SessionInfo> {
    return this.request<SessionInfo>('GET', `/Sessions/${sessionId}`);
  }

  async sendMessageCommand(sessionId: string, params: { header: string; text: string; timeoutMs?: number }): Promise<void> {
    await this.request<void>('POST', `/Sessions/${sessionId}/Message`, params);
  }

  async playCommand(sessionId: string, params: { itemIds: string[]; playCommand?: 'PlayNow' | 'PlayNext' | 'PlayLast' | 'PlayInstantMix' | 'PlayShuffle'; startPositionTicks?: number; mediaSourceId?: string; audioStreamIndex?: number; subtitleStreamIndex?: number }): Promise<void> {
    await this.request<void>('POST', `/Sessions/${sessionId}/Playing`, params);
  }

  async playstateCommand(sessionId: string, command: 'Stop' | 'Pause' | 'Unpause' | 'NextTrack' | 'PreviousTrack' | 'Seek' | 'Rewind' | 'FastForward' | 'PlayPause', params?: { seekPositionTicks?: number }): Promise<void> {
    await this.request<void>('POST', `/Sessions/${sessionId}/Playing/${command}`, params);
  }

  async setRepeatMode(sessionId: string, mode: string): Promise<void> {
    await this.request<void>('POST', `/Sessions/${sessionId}/RepeatMode`, { mode });
  }

  async setShuffleMode(sessionId: string, mode: 'Shuffle' | 'Sorted'): Promise<void> {
    await this.request<void>('POST', `/Sessions/${sessionId}/Shuffle`, { mode });
  }

  async sendSystemCommand(sessionId: string, command: 'GoHome' | 'GoToSettings' | 'VolumeUp' | 'VolumeDown' | 'Mute' | 'Unmute' | 'ToggleMute' | 'SetVolume' | 'SetAudioStreamIndex' | 'SetSubtitleStreamIndex' | 'DisplayContent' | 'GoToSearch' | 'DisplayMessage' | 'SetRepeatMode' | 'SetShuffleQueue' | 'ChannelUp' | 'ChannelDown' | 'PlayMediaSource' | 'PlayTrailers'): Promise<void> {
    await this.request<void>('POST', `/Sessions/${sessionId}/System/${command}`);
  }

  async reportPlaybackStart(info: PlaybackProgressInfo): Promise<void> {
    await this.request<void>('POST', '/Sessions/Playing', undefined, info);
  }

  async reportPlaybackProgress(info: PlaybackProgressInfo): Promise<void> {
    await this.request<void>('POST', '/Sessions/Playing/Progress', undefined, info);
  }

  async reportPlaybackStopped(info: PlaybackStopInfo): Promise<void> {
    await this.request<void>('POST', '/Sessions/Playing/Stopped', undefined, info);
  }

  async getLibraries(): Promise<LibraryVirtualFolder[]> {
    return this.request<LibraryVirtualFolder[]>('GET', '/Library/VirtualFolders');
  }

  async refreshLibrary(params?: { recursive?: boolean; metadataRefreshMode?: string; replaceAllMetadata?: boolean; replaceAllImages?: boolean }): Promise<void> {
    await this.request<void>('POST', '/Library/Refresh', params);
  }

  async refreshItem(itemId: string, params?: { recursive?: boolean; metadataRefreshMode?: string; replaceAllMetadata?: boolean; replaceAllImages?: boolean }): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}/Refresh`, params);
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.request<void>('DELETE', `/Items/${itemId}`);
  }

  async updateItem(itemId: string, item: Partial<BaseItemDto>): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}`, undefined, item);
  }

  async getGenres(params?: { parentId?: string; userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/Genres', { ...params, userId });
  }

  async getStudios(params?: { parentId?: string; userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/Studios', { ...params, userId });
  }

  async getPersons(params?: { parentId?: string; userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/Persons', { ...params, userId });
  }

  async getArtists(params?: { parentId?: string; userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    if (!userId) {
      throw new JellyfinApiError('User ID required for artists');
    }
    return this.request<QueryResult<BaseItemDto>>('GET', `/Artists`, { ...params, userId });
  }

  async getAlbumArtists(params?: { parentId?: string; userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    if (!userId) {
      throw new JellyfinApiError('User ID required for album artists');
    }
    return this.request<QueryResult<BaseItemDto>>('GET', `/Artists/AlbumArtists`, { ...params, userId });
  }

  async getSimilarItems(itemId: string, params?: { userId?: string; limit?: number }): Promise<SimilarItemResult> {
    const userId = params?.userId ?? this.userId;
    return this.request<SimilarItemResult>('GET', `/Items/${itemId}/Similar`, { ...params, userId });
  }

  async getRecommendations(params?: { userId?: string; categoryLimit?: number; itemLimit?: number }): Promise<RecommendationDto[]> {
    const userId = params?.userId ?? this.userId;
    if (!userId) {
      throw new JellyfinApiError('User ID required for recommendations');
    }
    return this.request<RecommendationDto[]>('GET', `/Users/${userId}/Recommendations`, params as Record<string, unknown>);
  }

  async getInstantMix(itemId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    if (!userId) {
      throw new JellyfinApiError('User ID required for instant mix');
    }
    return this.request<QueryResult<BaseItemDto>>('GET', `/Items/${itemId}/InstantMix`, { ...params, userId });
  }

  async getScheduledTasks(params?: { isHidden?: boolean }): Promise<ScheduledTaskInfo[]> {
    return this.request<ScheduledTaskInfo[]>('GET', '/ScheduledTasks', params);
  }

  async getScheduledTask(taskId: string): Promise<ScheduledTaskInfo> {
    return this.request<ScheduledTaskInfo>('GET', `/ScheduledTasks/${taskId}`);
  }

  async startTask(taskId: string): Promise<void> {
    await this.request<void>('POST', `/ScheduledTasks/Running/${taskId}`);
  }

  async stopTask(taskId: string): Promise<void> {
    await this.request<void>('DELETE', `/ScheduledTasks/Running/${taskId}`);
  }

  async getActivityLog(params?: { startIndex?: number; limit?: number; minDate?: string; hasUserId?: boolean }): Promise<ActivityLogQueryResult> {
    return this.request<ActivityLogQueryResult>('GET', '/System/ActivityLog/Entries', params);
  }

  async getLiveTvInfo(): Promise<LiveTvInfo> {
    return this.request<LiveTvInfo>('GET', '/LiveTv/Info');
  }

  async getLiveTvChannels(params?: { startIndex?: number; limit?: number; userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Channels', { ...params, userId });
  }

  async getLiveTvPrograms(params?: { channelId?: string; userId?: string; startIndex?: number; limit?: number; minStartDate?: string; maxStartDate?: string; hasAired?: boolean }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Programs', { ...params, userId });
  }

  async getLiveTvRecordings(params?: { userId?: string; startIndex?: number; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Recordings', { ...params, userId });
  }

  async getLiveTvTimer(id: string): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', `/LiveTv/Timers/${id}`);
  }

  async getLiveTvTimers(params?: { channelId?: string }): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Timers', params);
  }

  async createPlaylist(params: { name: string; ids?: string[]; userId?: string; mediaType?: string }): Promise<PlaylistCreationResult> {
    const userId = params.userId ?? this.userId;
    if (!userId) {
      throw new JellyfinApiError('User ID required for creating playlists');
    }
    return this.request<PlaylistCreationResult>('POST', '/Playlists', { ...params, userId, ids: params.ids?.join(',') });
  }

  async addToPlaylist(playlistId: string, ids: string[], userId?: string): Promise<void> {
    const uid = userId ?? this.userId;
    await this.request<void>('POST', `/Playlists/${playlistId}/Items`, { ids: ids.join(','), userId: uid });
  }

  async removeFromPlaylist(playlistId: string, entryIds: string[]): Promise<void> {
    await this.request<void>('DELETE', `/Playlists/${playlistId}/Items`, { entryIds: entryIds.join(',') });
  }

  async getPlaylistItems(playlistId: string, params?: { userId?: string; startIndex?: number; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', `/Playlists/${playlistId}/Items`, { ...params, userId });
  }

  async markFavorite(itemId: string, userId?: string): Promise<UserItemData> {
    const uid = userId ?? this.userId;
    if (!uid) {
      throw new JellyfinApiError('User ID required');
    }
    return this.request<UserItemData>('POST', `/Users/${uid}/FavoriteItems/${itemId}`);
  }

  async unmarkFavorite(itemId: string, userId?: string): Promise<UserItemData> {
    const uid = userId ?? this.userId;
    if (!uid) {
      throw new JellyfinApiError('User ID required');
    }
    return this.request<UserItemData>('DELETE', `/Users/${uid}/FavoriteItems/${itemId}`);
  }

  async markPlayed(itemId: string, userId?: string, datePlayed?: string): Promise<UserItemData> {
    const uid = userId ?? this.userId;
    if (!uid) {
      throw new JellyfinApiError('User ID required');
    }
    return this.request<UserItemData>('POST', `/Users/${uid}/PlayedItems/${itemId}`, { datePlayed });
  }

  async unmarkPlayed(itemId: string, userId?: string): Promise<UserItemData> {
    const uid = userId ?? this.userId;
    if (!uid) {
      throw new JellyfinApiError('User ID required');
    }
    return this.request<UserItemData>('DELETE', `/Users/${uid}/PlayedItems/${itemId}`);
  }

  async updateUserItemRating(itemId: string, userId?: string, likes?: boolean): Promise<UserItemData> {
    const uid = userId ?? this.userId;
    if (!uid) {
      throw new JellyfinApiError('User ID required');
    }
    return this.request<UserItemData>('POST', `/Users/${uid}/Items/${itemId}/Rating`, { likes });
  }

  async deleteUserItemRating(itemId: string, userId?: string): Promise<UserItemData> {
    const uid = userId ?? this.userId;
    if (!uid) {
      throw new JellyfinApiError('User ID required');
    }
    return this.request<UserItemData>('DELETE', `/Users/${uid}/Items/${itemId}/Rating`);
  }

  async getSubtitles(itemId: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Items/${itemId}/Subtitles`);
  }

  async downloadSubtitle(itemId: string, mediaSourceId: string, streamIndex: number): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}/Subtitles/${streamIndex}`, { mediaSourceId });
  }

  async getHealth(): Promise<string> {
    return this.request<string>('GET', '/Health');
  }

  async restartServer(): Promise<void> {
    await this.request<void>('POST', '/System/Restart');
  }

  async shutdownServer(): Promise<void> {
    await this.request<void>('POST', '/System/Shutdown');
  }

  async getPlugins(): Promise<PluginInfo[]> {
    return this.request<PluginInfo[]>('GET', '/Plugins');
  }

  async getPlugin(pluginId: string): Promise<PluginInfo> {
    return this.request<PluginInfo>('GET', `/Plugins/${pluginId}`);
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    await this.request<void>('DELETE', `/Plugins/${pluginId}`);
  }

  async getPluginConfiguration(pluginId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', `/Plugins/${pluginId}/Configuration`);
  }

  async updatePluginConfiguration(pluginId: string, config: Record<string, unknown>): Promise<void> {
    await this.request<void>('POST', `/Plugins/${pluginId}/Configuration`, undefined, config);
  }

  async getDevices(): Promise<QueryResult<DeviceInfo>> {
    return this.request<QueryResult<DeviceInfo>>('GET', '/Devices');
  }

  async getDevice(deviceId: string): Promise<DeviceInfo> {
    return this.request<DeviceInfo>('GET', `/Devices/${deviceId}`);
  }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.request<void>('DELETE', `/Devices/${deviceId}`);
  }

  async updateDeviceOptions(deviceId: string, options: { customName?: string }): Promise<void> {
    await this.request<void>('POST', `/Devices/Options`, undefined, { Id: deviceId, ...options });
  }

  async getBranding(): Promise<BrandingOptions> {
    return this.request<BrandingOptions>('GET', '/Branding/Configuration');
  }

  async getServerConfiguration(): Promise<ServerConfiguration> {
    return this.request<ServerConfiguration>('GET', '/System/Configuration');
  }

  async updateServerConfiguration(config: Partial<ServerConfiguration>): Promise<void> {
    await this.request<void>('POST', '/System/Configuration', undefined, config);
  }

  async getItemCounts(): Promise<ItemCounts> {
    return this.request<ItemCounts>('GET', '/Items/Counts');
  }

  async getApiKeys(): Promise<ApiKeyInfo[]> {
    return this.request<ApiKeyInfo[]>('GET', '/ApiKey');
  }

  async createApiKey(app: string): Promise<ApiKeyInfo> {
    return this.request<ApiKeyInfo>('POST', '/ApiKey', { app });
  }

  async deleteApiKey(key: string): Promise<void> {
    await this.request<void>('DELETE', '/ApiKey', { key });
  }

  async getNotificationTypes(): Promise<NotificationTypeInfo[]> {
    return this.request<NotificationTypeInfo[]>('GET', '/Notifications/Types');
  }

  async getNotifications(userId?: string): Promise<NotificationResult> {
    const uid = userId ?? this.userId;
    if (!uid) {
      throw new JellyfinApiError('User ID required');
    }
    return this.request<NotificationResult>('GET', `/Notifications/${uid}`);
  }

  async sendAdminNotification(params: { name: string; description?: string; url?: string; level?: string; userIds?: string[] }): Promise<void> {
    await this.request<void>('POST', '/Notifications/Admin', params);
  }

  async getIntros(itemId: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/Intros`);
  }

  async getAdditionalParts(itemId: string): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', `/Videos/${itemId}/AdditionalParts`);
  }

  async getChapters(itemId: string): Promise<ChapterInfo[]> {
    return this.request<ChapterInfo[]>('GET', `/Items/${itemId}/Chapters`);
  }

  async getSpecialFeatures(itemId: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/SpecialFeatures`);
  }

  async getLocalTrailers(itemId: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/LocalTrailers`);
  }

  async getAncestors(itemId: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Items/${itemId}/Ancestors`);
  }

  async getItemsByPath(path: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', '/Items/ByPath', { path });
  }

  async getPlaybackInfo(itemId: string, userId?: string): Promise<PlaybackInfoResponse> {
    const uid = userId ?? this.userId;
    return this.request<PlaybackInfoResponse>('GET', `/Items/${itemId}/PlaybackInfo`, { userId: uid });
  }

  getStreamUrl(itemId: string, params?: { mediaSourceId?: string; audioStreamIndex?: number; subtitleStreamIndex?: number; maxStreamingBitrate?: number }): string {
    const queryParams = { ...params, userId: this.userId };
    return `${this.baseUrl}/Videos/${itemId}/stream${buildQueryString(queryParams as Record<string, unknown>)}`;
  }

  getAudioStreamUrl(itemId: string, params?: { mediaSourceId?: string; audioStreamIndex?: number; maxStreamingBitrate?: number }): string {
    const queryParams = { ...params, userId: this.userId };
    return `${this.baseUrl}/Audio/${itemId}/stream${buildQueryString(queryParams as Record<string, unknown>)}`;
  }

  getSubtitleUrl(itemId: string, mediaSourceId: string, streamIndex: number, format?: string): string {
    const params = { mediaSourceId, streamIndex, format, userId: this.userId };
    return `${this.baseUrl}/Videos/${itemId}/${mediaSourceId}/Subtitles/${streamIndex}/Stream.${format ?? 'srt'}${buildQueryString(params as Record<string, unknown>)}`;
  }

  getThumbUrl(itemId: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string }): string {
    return `${this.baseUrl}/Items/${itemId}/Images/Primary${buildQueryString(params as Record<string, unknown>)}`;
  }
}

interface UserItemData {
  Played?: boolean;
  PlayCount?: number;
  IsFavorite?: boolean;
  PlaybackPositionTicks?: number;
  LastPlayedDate?: string | null;
}
