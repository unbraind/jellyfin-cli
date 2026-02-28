import type {
  JellyfinConfig,
  SystemInfo,
  UserDto,
  BaseItemDto,
  SessionInfo,
  QueryResult,
  SearchResult,
  ItemsQueryParams,
  LibraryVirtualFolder,
  ScheduledTaskInfo,
  PlaybackProgressInfo,
  PlaybackStopInfo,
  ActivityLogQueryResult,
  LiveTvInfo,
  PlaylistCreationResult,
  RecommendationDto,
  SimilarItemResult,
  PluginInfo,
  DeviceInfo,
  BrandingOptions,
  ServerConfiguration,
  ItemCounts,
  ApiKeyInfo,
  NotificationTypeInfo,
  NotificationResult,
  CreateUserDto,
  UpdateUserPasswordDto,
  QuickConnectResult,
  DisplayPreferences,
  VirtualFolderInfo,
  QueryFilters,
  RemoteImageInfo,
  ExternalIdInfo,
  ThemeMediaResult,
  SyncPlayGroup,
  RemoteSubtitleInfo,
  MediaSegment,
  LyricsInfo,
  UploadSubtitleDto,
  LocalizationOption,
  CountryInfo,
  CultureDto,
  BackupInfo,
} from '../types/index.js';
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

  async createUser(user: CreateUserDto): Promise<{ Id?: string; Name?: string; ServerId?: string }> {
    return this.request<{ Id?: string; Name?: string; ServerId?: string }>('POST', '/Users/New', undefined, user);
  }

  async updateUser(userId: string, user: Partial<UserDto>): Promise<void> {
    await this.request<void>('POST', `/Users/${userId}`, undefined, user);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.request<void>('DELETE', `/Users/${userId}`);
  }

  async updateUserPassword(userId: string, password: UpdateUserPasswordDto): Promise<void> {
    await this.request<void>('POST', '/Users/Password', { userId }, password);
  }

  async updateUserPolicy(userId: string, policy: Record<string, unknown>): Promise<void> {
    await this.request<void>('POST', `/Users/${userId}/Policy`, undefined, policy);
  }

  async getDisplayPreferences(displayPreferencesId: string, userId?: string, client?: string): Promise<DisplayPreferences> {
    return this.request<DisplayPreferences>('GET', `/DisplayPreferences/${displayPreferencesId}`, { userId, client });
  }

  async updateDisplayPreferences(displayPreferencesId: string, prefs: DisplayPreferences, userId?: string, client?: string): Promise<void> {
    await this.request<void>('POST', `/DisplayPreferences/${displayPreferencesId}`, { userId, client }, prefs);
  }

  async quickConnectInitiate(): Promise<QuickConnectResult> {
    return this.request<QuickConnectResult>('POST', '/QuickConnect/Initiate');
  }

  async quickConnectConnect(secret: string): Promise<QuickConnectResult> {
    return this.request<QuickConnectResult>('GET', '/QuickConnect/Connect', { secret });
  }

  async quickConnectAuthorize(code: string, userId?: string): Promise<boolean> {
    return this.request<boolean>('POST', '/QuickConnect/Authorize', { code, userId });
  }

  async quickConnectEnabled(): Promise<boolean> {
    return this.request<boolean>('GET', '/QuickConnect/Enabled');
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

  async setVolume(sessionId: string, level: number): Promise<void> {
    await this.request<void>('POST', `/Sessions/${sessionId}/System/SetVolume`, { volume: level });
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

  async getVirtualFolders(): Promise<VirtualFolderInfo[]> {
    return this.request<VirtualFolderInfo[]>('GET', '/Library/VirtualFolders');
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

  async markFavorite(itemId: string, userId?: string): Promise<{ Played?: boolean; PlayCount?: number; IsFavorite?: boolean }> {
    const uid = userId ?? this.userId;
    if (!uid) {
      throw new JellyfinApiError('User ID required');
    }
    return this.request<{ Played?: boolean; PlayCount?: number; IsFavorite?: boolean }>('POST', `/Users/${uid}/FavoriteItems/${itemId}`);
  }

  async unmarkFavorite(itemId: string, userId?: string): Promise<{ Played?: boolean; PlayCount?: number; IsFavorite?: boolean }> {
    const uid = userId ?? this.userId;
    if (!uid) {
      throw new JellyfinApiError('User ID required');
    }
    return this.request<{ Played?: boolean; PlayCount?: number; IsFavorite?: boolean }>('DELETE', `/Users/${uid}/FavoriteItems/${itemId}`);
  }

  async markPlayed(itemId: string, userId?: string, datePlayed?: string): Promise<{ Played?: boolean; PlayCount?: number }> {
    const uid = userId ?? this.userId;
    if (!uid) {
      throw new JellyfinApiError('User ID required');
    }
    return this.request<{ Played?: boolean; PlayCount?: number }>('POST', `/Users/${uid}/PlayedItems/${itemId}`, { datePlayed });
  }

  async unmarkPlayed(itemId: string, userId?: string): Promise<{ Played?: boolean; PlayCount?: number }> {
    const uid = userId ?? this.userId;
    if (!uid) {
      throw new JellyfinApiError('User ID required');
    }
    return this.request<{ Played?: boolean; PlayCount?: number }>('DELETE', `/Users/${uid}/PlayedItems/${itemId}`);
  }

  async updateUserItemRating(itemId: string, userId?: string, likes?: boolean): Promise<{ Played?: boolean; PlayCount?: number }> {
    const uid = userId ?? this.userId;
    if (!uid) {
      throw new JellyfinApiError('User ID required');
    }
    return this.request<{ Played?: boolean; PlayCount?: number }>('POST', `/Users/${uid}/Items/${itemId}/Rating`, { likes });
  }

  async deleteUserItemRating(itemId: string, userId?: string): Promise<{ Played?: boolean; PlayCount?: number }> {
    const uid = userId ?? this.userId;
    if (!uid) {
      throw new JellyfinApiError('User ID required');
    }
    return this.request<{ Played?: boolean; PlayCount?: number }>('DELETE', `/Users/${uid}/Items/${itemId}/Rating`);
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
    await this.request<void>('DELETE', '/Devices', { id: deviceId });
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
    return `${this.baseUrl}/Videos/${itemId}/stream${this.buildQueryString(queryParams as Record<string, unknown>)}`;
  }

  getAudioStreamUrl(itemId: string, params?: { mediaSourceId?: string; audioStreamIndex?: number; maxStreamingBitrate?: number }): string {
    const queryParams = { ...params, userId: this.userId };
    return `${this.baseUrl}/Audio/${itemId}/stream${this.buildQueryString(queryParams as Record<string, unknown>)}`;
  }

  getSubtitleUrl(itemId: string, mediaSourceId: string, streamIndex: number, format?: string): string {
    const params = { mediaSourceId, streamIndex, format, userId: this.userId };
    return `${this.baseUrl}/Videos/${itemId}/${mediaSourceId}/Subtitles/${streamIndex}/Stream.${format ?? 'srt'}${this.buildQueryString(params as Record<string, unknown>)}`;
  }

  getThumbUrl(itemId: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string }): string {
    return `${this.baseUrl}/Items/${itemId}/Images/Primary${this.buildQueryString(params as Record<string, unknown>)}`;
  }

  getHlsMasterPlaylistUrl(itemId: string, params?: { mediaSourceId?: string; audioStreamIndex?: number; subtitleStreamIndex?: number; maxStreamingBitrate?: number }): string {
    const queryParams = { ...params, userId: this.userId };
    return `${this.baseUrl}/Videos/${itemId}/master.m3u8${this.buildQueryString(queryParams as Record<string, unknown>)}`;
  }

  async getQueryFilters(params?: { userId?: string; parentId?: string; includeItemTypes?: string[] }): Promise<QueryFilters> {
    return this.request<QueryFilters>('GET', '/Items/Filters', params as Record<string, unknown>);
  }

  async getThemeSongs(itemId: string, userId?: string, inheritFromParent?: boolean): Promise<ThemeMediaResult> {
    return this.request<ThemeMediaResult>('GET', `/Items/${itemId}/ThemeSongs`, { userId, inheritFromParent });
  }

  async getThemeVideos(itemId: string, userId?: string, inheritFromParent?: boolean): Promise<ThemeMediaResult> {
    return this.request<ThemeMediaResult>('GET', `/Items/${itemId}/ThemeVideos`, { userId, inheritFromParent });
  }

  async getRemoteImages(itemId: string, params?: { type?: string; startIndex?: number; limit?: number }): Promise<{ Images?: RemoteImageInfo[]; TotalRecordCount?: number; Providers?: string[] }> {
    return this.request<{ Images?: RemoteImageInfo[]; TotalRecordCount?: number; Providers?: string[] }>('GET', `/Items/${itemId}/RemoteImages`, params);
  }

  async downloadRemoteImage(itemId: string, params?: { type?: string; imageUrl?: string }): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}/RemoteImages/Download`, params);
  }

  async getExternalIdInfos(itemId: string): Promise<ExternalIdInfo[]> {
    return this.request<ExternalIdInfo[]>('GET', `/Items/${itemId}/ExternalIdInfos`);
  }

  async searchRemoteSubtitles(itemId: string, language: string, isPerfectMatch?: boolean): Promise<RemoteSubtitleInfo[]> {
    return this.request<RemoteSubtitleInfo[]>('GET', `/Items/${itemId}/RemoteSearch/Subtitles/${language}`, { isPerfectMatch });
  }

  async downloadRemoteSubtitle(itemId: string, subtitleId: string): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}/RemoteSearch/Subtitles/${subtitleId}`);
  }

  async uploadSubtitle(itemId: string, subtitle: UploadSubtitleDto): Promise<void> {
    await this.request<void>('POST', `/Videos/${itemId}/Subtitles`, undefined, subtitle);
  }

  async deleteSubtitle(itemId: string, index: number): Promise<void> {
    await this.request<void>('DELETE', `/Videos/${itemId}/Subtitles/${index}`);
  }

  async getSubtitleProviders(): Promise<{ Name?: string | null }[]> {
    return this.request<{ Name?: string | null }[]>('GET', '/Providers/Subtitles/Subtitles');
  }

  async getMediaSegments(itemId: string): Promise<MediaSegment[]> {
    return this.request<MediaSegment[]>('GET', `/MediaSegments/${itemId}`);
  }

  async getLyrics(itemId: string): Promise<LyricsInfo> {
    return this.request<LyricsInfo>('GET', `/Audio/${itemId}/Lyrics`);
  }

  async getSyncPlayGroups(): Promise<SyncPlayGroup[]> {
    return this.request<SyncPlayGroup[]>('GET', '/SyncPlay/List');
  }

  async syncPlayJoin(groupId: string): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Join', undefined, { GroupId: groupId });
  }

  async syncPlayLeave(): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Leave');
  }

  async syncPlayPause(): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Pause');
  }

  async syncPlayUnpause(): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Unpause');
  }

  async syncPlayStop(): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Stop');
  }

  async getLocalizationOptions(): Promise<LocalizationOption[]> {
    return this.request<LocalizationOption[]>('GET', '/Localization/Options');
  }

  async getCountries(): Promise<CountryInfo[]> {
    return this.request<CountryInfo[]>('GET', '/Localization/Countries');
  }

  async getCultures(): Promise<CultureDto[]> {
    return this.request<CultureDto[]>('GET', '/Localization/Cultures');
  }

  async getRatingSystems(): Promise<{ Name?: string; CountryCode?: string }[]> {
    return this.request<{ Name?: string; CountryCode?: string }[]>('GET', '/Localization/RatingSystems');
  }

  async getSystemStorageInfo(): Promise<{ DataPaths?: string[]; CachePath?: string; InternalMetadataPath?: string; LogPath?: string; TranscodingTempPath?: string }> {
    return this.request<{ DataPaths?: string[]; CachePath?: string; InternalMetadataPath?: string; LogPath?: string; TranscodingTempPath?: string }>('GET', '/System/Info/Storage');
  }

  async getSystemLogs(): Promise<{ Name?: string; DateCreated?: string; Size?: number }[]> {
    return this.request<{ Name?: string; DateCreated?: string; Size?: number }[]>('GET', '/System/Logs');
  }

  async getSystemLogFile(name: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/System/Logs/Log?name=${encodeURIComponent(name)}`, {
      headers: { 'X-Emby-Token': this.apiKey ?? '' },
    });
    if (!response.ok) {
      throw new JellyfinApiError(`Failed to get log file: ${response.status}`, response.status);
    }
    return response.text();
  }

  async getDrives(): Promise<{ Name?: string; Path?: string }[]> {
    return this.request<{ Name?: string; Path?: string }[]>('GET', '/Environment/Drives');
  }

  async getBackups(): Promise<BackupInfo[]> {
    return this.request<BackupInfo[]>('GET', '/Backup');
  }

  async createBackup(): Promise<void> {
    await this.request<void>('POST', '/Backup');
  }

  async restoreBackup(backupPath: string): Promise<void> {
    await this.request<void>('POST', `/Backup/${encodeURIComponent(backupPath)}`);
  }

  async deleteBackup(backupPath: string): Promise<void> {
    await this.request<void>('DELETE', `/Backup/${encodeURIComponent(backupPath)}`);
  }

  private buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== undefined && item !== null) {
            searchParams.append(key, String(item));
          }
        }
      } else {
        searchParams.append(key, String(value));
      }
    }
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
  }
}
