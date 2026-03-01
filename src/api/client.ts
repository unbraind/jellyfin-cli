import type { JellyfinConfig, UserDto, SystemInfo, SessionInfo, QueryResult, SearchResult, BaseItemDto, ItemsQueryParams, LibraryVirtualFolder, ScheduledTaskInfo, PlaybackProgressInfo, PlaybackStopInfo, ActivityLogQueryResult, LiveTvInfo, PlaylistCreationResult, RecommendationDto, SimilarItemResult, PluginInfo, DeviceInfo, BrandingOptions, ServerConfiguration, ItemCounts, ApiKeyInfo, NotificationTypeInfo, NotificationResult, QuickConnectResult, DisplayPreferences, VirtualFolderInfo, QueryFilters, RemoteImageInfo, ExternalIdInfo, ThemeMediaResult, SyncPlayGroup, RemoteSubtitleInfo, MediaSegment, LyricsInfo, LocalizationOption, CountryInfo, CultureDto, BackupInfo, CreateUserDto, UpdateUserPasswordDto, RemoteSearchResult, RemoteSearchQuery, UserView, UserViewGroupingOption, UtcTimeResponse, AddVirtualFolderParams, AddMediaPathParams, UpdateMediaPathParams } from '../types/index.js';
import { ApiClientBase } from './base.js';
import { JellyfinApiError, ChapterInfo, PlaybackInfoResponse } from './types.js';
import { TvShowsApi } from './tvshows.js';
import { PackagesApi, type PackageInfo } from './packages.js';
import { ImagesApi, type ItemImageInfo } from './images.js';
import { SuggestionsApi } from './suggestions.js';
import { YearsApi } from './years.js';
import { MusicGenresApi } from './musicgenres.js';
import { TrickplayApi } from './trickplay.js';
import { ChannelsApi, type ChannelFeatures } from './channels.js';

export { JellyfinApiError } from './types.js';
export type { ChapterInfo, PlaybackInfoResponse, PackageInfo, ItemImageInfo, ChannelFeatures };

class CoreApi extends ApiClientBase {
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
  async getCurrentUser(): Promise<UserDto> { if (!this.userId) throw new JellyfinApiError('No user ID set'); return this.getUserById(this.userId); }
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
  async getItems(params?: ItemsQueryParams & { userId?: string }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; const path = userId ? `/Users/${userId}/Items` : '/Items'; return this.request<QueryResult<BaseItemDto>>('GET', path, params as Record<string, unknown>); }
  async getItem(itemId: string, userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; if (uid) return this.request<BaseItemDto>('GET', `/Users/${uid}/Items/${itemId}`); return this.request<BaseItemDto>('GET', `/Items/${itemId}`); }
  async getLatestItems(params?: { parentId?: string; limit?: number; fields?: string[]; userId?: string }): Promise<BaseItemDto[]> { const userId = params?.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<BaseItemDto[]>('GET', `/Users/${userId}/Items/Latest`, params as Record<string, unknown>); }
  async getResumeItems(params?: { parentId?: string; limit?: number; fields?: string[]; userId?: string }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<QueryResult<BaseItemDto>>('GET', `/Users/${userId}/Items/Resume`, params as Record<string, unknown>); }
  async getSearchHints(params: { searchTerm: string; limit?: number; includeItemTypes?: string[]; userId?: string }): Promise<SearchResult> { const userId = params.userId ?? this.userId; return this.request<SearchResult>('GET', '/Search/Hints', { ...params, userId }); }
  async getLibraries(): Promise<LibraryVirtualFolder[]> { return this.request<LibraryVirtualFolder[]>('GET', '/Library/VirtualFolders'); }
  async refreshLibrary(params?: { recursive?: boolean; metadataRefreshMode?: string; replaceAllMetadata?: boolean; replaceAllImages?: boolean }): Promise<void> { await this.request<void>('POST', '/Library/Refresh', params); }
  async getScheduledTasks(params?: { isHidden?: boolean }): Promise<ScheduledTaskInfo[]> { return this.request<ScheduledTaskInfo[]>('GET', '/ScheduledTasks', params); }
  async getScheduledTask(taskId: string): Promise<ScheduledTaskInfo> { return this.request<ScheduledTaskInfo>('GET', `/ScheduledTasks/${taskId}`); }
  async startTask(taskId: string): Promise<void> { await this.request<void>('POST', `/ScheduledTasks/Running/${taskId}`); }
  async stopTask(taskId: string): Promise<void> { await this.request<void>('DELETE', `/ScheduledTasks/Running/${taskId}`); }
  async getActivityLog(params?: { startIndex?: number; limit?: number; minDate?: string; hasUserId?: boolean }): Promise<ActivityLogQueryResult> { return this.request<ActivityLogQueryResult>('GET', '/System/ActivityLog/Entries', params); }
}

export class JellyfinApiClient extends CoreApi {
  private tvshows: TvShowsApi;
  private packages: PackagesApi;
  private images: ImagesApi;
  private suggestions: SuggestionsApi;
  private years: YearsApi;
  private musicGenres: MusicGenresApi;
  private trickplay: TrickplayApi;
  private channels: ChannelsApi;

  constructor(config: JellyfinConfig) {
    super(config);
    this.tvshows = new TvShowsApi(config);
    this.packages = new PackagesApi(config);
    this.images = new ImagesApi(config);
    this.suggestions = new SuggestionsApi(config);
    this.years = new YearsApi(config);
    this.musicGenres = new MusicGenresApi(config);
    this.trickplay = new TrickplayApi(config);
    this.channels = new ChannelsApi(config);
  }

  setUserId(userId: string): void { super.setUserId(userId); this.syncModules(); }
  private syncModules(): void { const cfg = { serverUrl: this.getBackendUrl(), apiKey: this.apiKey, userId: this.getUserId(), timeout: this.timeout }; this.tvshows = new TvShowsApi(cfg); this.packages = new PackagesApi(cfg); this.images = new ImagesApi(cfg); this.suggestions = new SuggestionsApi(cfg); this.years = new YearsApi(cfg); this.musicGenres = new MusicGenresApi(cfg); this.trickplay = new TrickplayApi(cfg); this.channels = new ChannelsApi(cfg); }

  async getEpisodes(seriesId: string, params?: { seasonId?: string; userId?: string; season?: number; limit?: number; startIndex?: number; isMissing?: boolean; sortBy?: string }): Promise<QueryResult<BaseItemDto>> { return this.tvshows.getEpisodes(seriesId, params); }
  async getSeasons(seriesId: string, params?: { userId?: string; isSpecialSeason?: boolean }): Promise<QueryResult<BaseItemDto>> { return this.tvshows.getSeasons(seriesId, params); }
  async getNextUpEpisodes(params?: { userId?: string; seriesId?: string; parentId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { return this.tvshows.getNextUpEpisodes(params); }
  async getUpcomingEpisodes(params?: { userId?: string; parentId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { return this.tvshows.getUpcomingEpisodes(params); }
  async getPackages(): Promise<PackageInfo[]> { return this.packages.getPackages(); }
  async getPackageInfo(packageId: string): Promise<PackageInfo> { return this.packages.getPackageInfo(packageId); }
  async installPackage(packageId: string, version?: string, repositoryUrl?: string): Promise<void> { return this.packages.installPackage(packageId, version, repositoryUrl); }
  async cancelPackageInstallation(installationId: string): Promise<void> { return this.packages.cancelPackageInstallation(installationId); }
  async getRepositories() { return this.packages.getRepositories(); }
  async getInstallingPackages() { return this.packages.getInstallingPackages(); }
  async getItemImages(itemId: string): Promise<ItemImageInfo[]> { return this.images.getItemImages(itemId); }
  getItemImage(itemId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; quality?: number; imageIndex?: number }): string { return this.images.getItemImage(itemId, imageType, params); }
  async deleteItemImage(itemId: string, imageType: string, imageIndex?: number): Promise<void> { return this.images.deleteItemImage(itemId, imageType, imageIndex); }
  async deleteUserImage(userId: string, imageType: string): Promise<void> { return this.images.deleteUserImage(userId, imageType); }
  getUserImage(userId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; imageIndex?: number }): string { return this.images.getUserImage(userId, imageType, params); }
  async getSuggestions(params?: { userId?: string; parentId?: string; limit?: number }): Promise<BaseItemDto[]> { return this.suggestions.getSuggestions(params); }
  async getYears(params?: { userId?: string; parentId?: string; limit?: number; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> { return this.years.getYears(params); }
  async getYear(year: number, params?: { userId?: string }): Promise<BaseItemDto> { return this.years.getYear(year, params); }
  async getMusicGenres(params?: { userId?: string; parentId?: string; limit?: number; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> { return this.musicGenres.getMusicGenres(params); }
  async getMusicGenre(name: string, params?: { userId?: string }): Promise<BaseItemDto> { return this.musicGenres.getMusicGenre(name, params); }
  getTrickplayHlsPlaylistUrl(itemId: string, width: number, params?: { mediaSourceId?: string }): string { return this.trickplay.getTrickplayHlsPlaylistUrl(itemId, width, params); }
  getTrickplayTileImageUrl(itemId: string, width: number, index: number, params?: { mediaSourceId?: string }): string { return this.trickplay.getTrickplayTileImageUrl(itemId, width, index, params); }
  async getChannels(params?: { userId?: string; limit?: number; supportsLatestItems?: boolean }): Promise<QueryResult<BaseItemDto>> { return this.channels.getChannels(params); }
  async getAllChannelFeatures(): Promise<ChannelFeatures[]> { return this.channels.getAllChannelFeatures(); }
  async getChannelFeatures(channelId: string): Promise<ChannelFeatures> { return this.channels.getChannelFeatures(channelId); }
  async getChannelItems(channelId: string, params?: { folderId?: string; userId?: string; limit?: number; startIndex?: number; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> { return this.channels.getChannelItems(channelId, params); }
  async getLatestChannelItems(channelId: string, userId?: string, limit?: number): Promise<BaseItemDto[]> { return this.channels.getLatestChannelItems(channelId, { userId, limit }); }

  async getLiveTvInfo(): Promise<LiveTvInfo> { return this.request<LiveTvInfo>('GET', '/LiveTv/Info'); }
  async getLiveTvChannels(params?: { startIndex?: number; limit?: number; userId?: string }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Channels', { ...params, userId }); }
  async getLiveTvPrograms(params?: { channelId?: string; userId?: string; startIndex?: number; limit?: number; minStartDate?: string; maxStartDate?: string; hasAired?: boolean }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Programs', { ...params, userId }); }
  async getLiveTvRecordings(params?: { userId?: string; startIndex?: number; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Recordings', { ...params, userId }); }
  async getLiveTvTimer(id: string): Promise<BaseItemDto> { return this.request<BaseItemDto>('GET', `/LiveTv/Timers/${id}`); }
  async getLiveTvTimers(params?: { channelId?: string }): Promise<QueryResult<BaseItemDto>> { return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Timers', params); }
  async createPlaylist(params: { name: string; ids?: string[]; userId?: string; mediaType?: string }): Promise<PlaylistCreationResult> { const userId = params.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<PlaylistCreationResult>('POST', '/Playlists', { ...params, userId, ids: params.ids?.join(',') }); }
  async addToPlaylist(playlistId: string, ids: string[], userId?: string): Promise<void> { await this.request<void>('POST', `/Playlists/${playlistId}/Items`, { ids: ids.join(','), userId: userId ?? this.userId }); }
  async removeFromPlaylist(playlistId: string, entryIds: string[]): Promise<void> { await this.request<void>('DELETE', `/Playlists/${playlistId}/Items`, { entryIds: entryIds.join(',') }); }
  async getPlaylistItems(playlistId: string, params?: { userId?: string; startIndex?: number; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', `/Playlists/${playlistId}/Items`, { ...params, userId }); }
  async markFavorite(itemId: string, userId?: string): Promise<{ Played?: boolean; PlayCount?: number; IsFavorite?: boolean }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ Played?: boolean; PlayCount?: number; IsFavorite?: boolean }>('POST', `/Users/${uid}/FavoriteItems/${itemId}`); }
  async unmarkFavorite(itemId: string, userId?: string): Promise<{ Played?: boolean; PlayCount?: number; IsFavorite?: boolean }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ Played?: boolean; PlayCount?: number; IsFavorite?: boolean }>('DELETE', `/Users/${uid}/FavoriteItems/${itemId}`); }
  async markPlayed(itemId: string, userId?: string, datePlayed?: string): Promise<{ Played?: boolean; PlayCount?: number }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ Played?: boolean; PlayCount?: number }>('POST', `/Users/${uid}/PlayedItems/${itemId}`, { datePlayed }); }
  async unmarkPlayed(itemId: string, userId?: string): Promise<{ Played?: boolean; PlayCount?: number }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ Played?: boolean; PlayCount?: number }>('DELETE', `/Users/${uid}/PlayedItems/${itemId}`); }
  async updateUserItemRating(itemId: string, userId?: string, likes?: boolean): Promise<{ Played?: boolean; PlayCount?: number }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ Played?: boolean; PlayCount?: number }>('POST', `/Users/${uid}/Items/${itemId}/Rating`, { likes }); }
  async deleteUserItemRating(itemId: string, userId?: string): Promise<{ Played?: boolean; PlayCount?: number }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ Played?: boolean; PlayCount?: number }>('DELETE', `/Users/${uid}/Items/${itemId}/Rating`); }
  async getGenres(params?: { parentId?: string; userId?: string }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', '/Genres', { ...params, userId }); }
  async getStudios(params?: { parentId?: string; userId?: string }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', '/Studios', { ...params, userId }); }
  async getPersons(params?: { parentId?: string; userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', '/Persons', { ...params, userId }); }
  async getArtists(params?: { parentId?: string; userId?: string; limit?: number; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<QueryResult<BaseItemDto>>('GET', '/Artists', { ...params, userId }); }
  async getAlbumArtists(params?: { parentId?: string; userId?: string; limit?: number; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<QueryResult<BaseItemDto>>('GET', '/Artists/AlbumArtists', { ...params, userId }); }
  async getSimilarItems(itemId: string, params?: { userId?: string; limit?: number }): Promise<SimilarItemResult> { const userId = params?.userId ?? this.userId; return this.request<SimilarItemResult>('GET', `/Items/${itemId}/Similar`, { ...params, userId }); }
  async getRecommendations(params?: { userId?: string; categoryLimit?: number; itemLimit?: number }): Promise<RecommendationDto[]> { const userId = params?.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<RecommendationDto[]>('GET', '/Movies/Recommendations', { userId, categoryLimit: params?.categoryLimit, itemLimit: params?.itemLimit }); }
  async getInstantMix(itemId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<QueryResult<BaseItemDto>>('GET', `/Items/${itemId}/InstantMix`, { ...params, userId }); }
  async getPlugins(): Promise<PluginInfo[]> { return this.request<PluginInfo[]>('GET', '/Plugins'); }
  async getPlugin(pluginId: string): Promise<PluginInfo> { return this.request<PluginInfo>('GET', `/Plugins/${pluginId}`); }
  async uninstallPlugin(pluginId: string): Promise<void> { await this.request<void>('DELETE', `/Plugins/${pluginId}`); }
  async getPluginConfiguration(pluginId: string): Promise<Record<string, unknown>> { return this.request<Record<string, unknown>>('GET', `/Plugins/${pluginId}/Configuration`); }
  async updatePluginConfiguration(pluginId: string, config: Record<string, unknown>): Promise<void> { await this.request<void>('POST', `/Plugins/${pluginId}/Configuration`, undefined, config); }
  async getDevices(): Promise<QueryResult<DeviceInfo>> { return this.request<QueryResult<DeviceInfo>>('GET', '/Devices'); }
  async getDevice(deviceId: string): Promise<DeviceInfo> { return this.request<DeviceInfo>('GET', `/Devices/${deviceId}`); }
  async deleteDevice(deviceId: string): Promise<void> { await this.request<void>('DELETE', '/Devices', { id: deviceId }); }
  async updateDeviceOptions(deviceId: string, options: { customName?: string }): Promise<void> { await this.request<void>('POST', '/Devices/Options', undefined, { Id: deviceId, ...options }); }
  async getBranding(): Promise<BrandingOptions> { return this.request<BrandingOptions>('GET', '/Branding/Configuration'); }
  async getServerConfiguration(): Promise<ServerConfiguration> { return this.request<ServerConfiguration>('GET', '/System/Configuration'); }
  async updateServerConfiguration(config: Partial<ServerConfiguration>): Promise<void> { await this.request<void>('POST', '/System/Configuration', undefined, config); }
  async getItemCounts(): Promise<ItemCounts> { return this.request<ItemCounts>('GET', '/Items/Counts'); }
  async getApiKeys(): Promise<QueryResult<ApiKeyInfo>> { return this.request<QueryResult<ApiKeyInfo>>('GET', '/Auth/Keys'); }
  async createApiKey(app: string): Promise<void> { await this.request<void>('POST', '/Auth/Keys', { app }); }
  async deleteApiKey(key: string): Promise<void> { await this.request<void>('DELETE', `/Auth/Keys/${key}`); }
  async getNotificationTypes(): Promise<NotificationTypeInfo[]> { return this.request<NotificationTypeInfo[]>('GET', '/Notifications/Types'); }
  async getNotifications(userId?: string): Promise<NotificationResult> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<NotificationResult>('GET', `/Notifications/${uid}`); }
  async sendAdminNotification(params: { name: string; description?: string; url?: string; level?: string; userIds?: string[] }): Promise<void> { await this.request<void>('POST', '/Notifications/Admin', params); }
  async getIntros(itemId: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/Intros`); }
  async getAdditionalParts(itemId: string): Promise<QueryResult<BaseItemDto>> { return this.request<QueryResult<BaseItemDto>>('GET', `/Videos/${itemId}/AdditionalParts`); }
  async getChapters(itemId: string): Promise<ChapterInfo[]> { return this.request<ChapterInfo[]>('GET', `/Items/${itemId}/Chapters`); }
  async getSpecialFeatures(itemId: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/SpecialFeatures`); }
  async getLocalTrailers(itemId: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/LocalTrailers`); }
  async getAncestors(itemId: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', `/Items/${itemId}/Ancestors`); }
  async getItemsByPath(path: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', '/Items/ByPath', { path }); }
  async getPlaybackInfo(itemId: string, userId?: string): Promise<PlaybackInfoResponse> { const uid = userId ?? this.userId; return this.request<PlaybackInfoResponse>('GET', `/Items/${itemId}/PlaybackInfo`, { userId: uid }); }
  getStreamUrl(itemId: string, params?: { mediaSourceId?: string; audioStreamIndex?: number; subtitleStreamIndex?: number; maxStreamingBitrate?: number }): string { return `${this.getBackendUrl()}/Videos/${itemId}/stream${this.buildQS({ ...params, userId: this.userId })}`; }
  getAudioStreamUrl(itemId: string, params?: { mediaSourceId?: string; audioStreamIndex?: number; maxStreamingBitrate?: number }): string { return `${this.getBackendUrl()}/Audio/${itemId}/stream${this.buildQS({ ...params, userId: this.userId })}`; }
  getSubtitleUrl(itemId: string, mediaSourceId: string, streamIndex: number, format?: string): string { return `${this.getBackendUrl()}/Videos/${itemId}/${mediaSourceId}/Subtitles/${streamIndex}/Stream.${format ?? 'srt'}${this.buildQS({ mediaSourceId, streamIndex, format, userId: this.userId })}`; }
  getThumbUrl(itemId: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string }): string { return `${this.getBackendUrl()}/Items/${itemId}/Images/Primary${this.buildQS(params as Record<string, unknown>)}`; }
  getHlsMasterPlaylistUrl(itemId: string, params?: { mediaSourceId?: string; audioStreamIndex?: number; subtitleStreamIndex?: number; maxStreamingBitrate?: number }): string { return `${this.getBackendUrl()}/Videos/${itemId}/master.m3u8${this.buildQS({ ...params, userId: this.userId })}`; }
  async getQueryFilters(params?: { userId?: string; parentId?: string; includeItemTypes?: string[] }): Promise<QueryFilters> { return this.request<QueryFilters>('GET', '/Items/Filters', params as Record<string, unknown>); }
  async getThemeSongs(itemId: string, userId?: string, inheritFromParent?: boolean): Promise<ThemeMediaResult> { return this.request<ThemeMediaResult>('GET', `/Items/${itemId}/ThemeSongs`, { userId, inheritFromParent }); }
  async getThemeVideos(itemId: string, userId?: string, inheritFromParent?: boolean): Promise<ThemeMediaResult> { return this.request<ThemeMediaResult>('GET', `/Items/${itemId}/ThemeVideos`, { userId, inheritFromParent }); }
  async getRemoteImages(itemId: string, params?: { type?: string; startIndex?: number; limit?: number }): Promise<{ Images?: RemoteImageInfo[]; TotalRecordCount?: number; Providers?: string[] }> { return this.request<{ Images?: RemoteImageInfo[]; TotalRecordCount?: number; Providers?: string[] }>('GET', `/Items/${itemId}/RemoteImages`, params); }
  async downloadRemoteImage(itemId: string, params?: { type?: string; imageUrl?: string }): Promise<void> { await this.request<void>('POST', `/Items/${itemId}/RemoteImages/Download`, params); }
  async getExternalIdInfos(itemId: string): Promise<ExternalIdInfo[]> { return this.request<ExternalIdInfo[]>('GET', `/Items/${itemId}/ExternalIdInfos`); }
  async searchRemoteSubtitles(itemId: string, language: string, isPerfectMatch?: boolean): Promise<RemoteSubtitleInfo[]> { return this.request<RemoteSubtitleInfo[]>('GET', `/Items/${itemId}/RemoteSearch/Subtitles/${language}`, { isPerfectMatch }); }
  async downloadRemoteSubtitle(itemId: string, subtitleId: string): Promise<void> { await this.request<void>('POST', `/Items/${itemId}/RemoteSearch/Subtitles/${subtitleId}`); }
  async getMediaSegments(itemId: string): Promise<QueryResult<MediaSegment>> { return this.request<QueryResult<MediaSegment>>('GET', `/MediaSegments/${itemId}`); }
  async getLyrics(itemId: string): Promise<LyricsInfo> { return this.request<LyricsInfo>('GET', `/Audio/${itemId}/Lyrics`); }
  async getSyncPlayGroups(): Promise<SyncPlayGroup[]> { return this.request<SyncPlayGroup[]>('GET', '/SyncPlay/List'); }
  async syncPlayJoin(groupId: string): Promise<void> { await this.request<void>('POST', '/SyncPlay/Join', undefined, { GroupId: groupId }); }
  async syncPlayLeave(): Promise<void> { await this.request<void>('POST', '/SyncPlay/Leave'); }
  async syncPlayPause(): Promise<void> { await this.request<void>('POST', '/SyncPlay/Pause'); }
  async syncPlayUnpause(): Promise<void> { await this.request<void>('POST', '/SyncPlay/Unpause'); }
  async syncPlayStop(): Promise<void> { await this.request<void>('POST', '/SyncPlay/Stop'); }
  async getLocalizationOptions(): Promise<LocalizationOption[]> { return this.request<LocalizationOption[]>('GET', '/Localization/Options'); }
  async getCountries(): Promise<CountryInfo[]> { return this.request<CountryInfo[]>('GET', '/Localization/Countries'); }
  async getCultures(): Promise<CultureDto[]> { return this.request<CultureDto[]>('GET', '/Localization/Cultures'); }
  async getDrives(): Promise<{ Name?: string; Path?: string }[]> { return this.request<{ Name?: string; Path?: string }[]>('GET', '/Environment/Drives'); }
  async getBackups(): Promise<BackupInfo[]> { return this.request<BackupInfo[]>('GET', '/Backup'); }
  async createBackup(): Promise<void> { await this.request<void>('POST', '/Backup'); }
  async restoreBackup(backupPath: string): Promise<void> { await this.request<void>('POST', `/Backup/${encodeURIComponent(backupPath)}`); }
  async deleteBackup(backupPath: string): Promise<void> { await this.request<void>('DELETE', `/Backup/${encodeURIComponent(backupPath)}`); }
  async refreshItem(itemId: string, params?: { recursive?: boolean; replaceAllMetadata?: boolean; replaceAllImages?: boolean }): Promise<void> { await this.request<void>('POST', `/Items/${itemId}/Refresh`, params); }
  async deleteItem(itemId: string): Promise<void> { await this.request<void>('DELETE', `/Items/${itemId}`); }
  async getVirtualFolders(): Promise<VirtualFolderInfo[]> { return this.request<VirtualFolderInfo[]>('GET', '/Library/VirtualFolders'); }
  async getSystemStorageInfo(): Promise<{ DataPaths?: string[]; CachePath?: string; InternalMetadataPath?: string; LogPath?: string; TranscodingTempPath?: string }> { return this.request<{ DataPaths?: string[]; CachePath?: string; InternalMetadataPath?: string; LogPath?: string; TranscodingTempPath?: string }>('GET', '/System/Info/Storage'); }
  async getSystemLogs(): Promise<{ Name?: string; DateCreated?: string; Size?: number }[]> { return this.request<{ Name?: string; DateCreated?: string; Size?: number }[]>('GET', '/System/Logs'); }
  async getRatingSystems(): Promise<{ Name?: string; CountryCode?: string }[]> { return this.request<{ Name?: string; CountryCode?: string }[]>('GET', '/Localization/RatingSystems'); }
  async getSubtitleProviders(): Promise<{ Name?: string | null }[]> { return this.request<{ Name?: string | null }[]>('GET', '/Providers/Subtitles/Subtitles'); }
  async getDisplayPreferences(displayPreferencesId: string, userId?: string, client?: string): Promise<DisplayPreferences> { return this.request<DisplayPreferences>('GET', `/DisplayPreferences/${displayPreferencesId}`, { userId, client }); }
  async updateUserPassword(userId: string, password: UpdateUserPasswordDto): Promise<void> { await this.request<void>('POST', '/Users/Password', { userId }, password); }
  async createUser(user: CreateUserDto): Promise<{ Id?: string; Name?: string; ServerId?: string }> { return this.request<{ Id?: string; Name?: string; ServerId?: string }>('POST', '/Users/New', undefined, user); }
  async deleteUser(userId: string): Promise<void> { await this.request<void>('DELETE', `/Users/${userId}`); }
  async updateUserPolicy(userId: string, policy: Record<string, unknown>): Promise<void> { await this.request<void>('POST', `/Users/${userId}/Policy`, undefined, policy); }
  async updateUserConfiguration(userId: string, config: Record<string, unknown>): Promise<void> { await this.request<void>('POST', '/Users/Configuration', { userId }, config); }
  async updateItem(itemId: string, item: Partial<BaseItemDto>): Promise<void> { await this.request<void>('POST', `/Items/${itemId}`, undefined, item); }
  async quickConnectEnabled(): Promise<boolean> { return this.request<boolean>('GET', '/QuickConnect/Enabled'); }
  async quickConnectInitiate(): Promise<QuickConnectResult> { return this.request<QuickConnectResult>('POST', '/QuickConnect/Initiate'); }
  async quickConnectConnect(secret: string): Promise<QuickConnectResult> { return this.request<QuickConnectResult>('GET', '/QuickConnect/Connect', { secret }); }
  async quickConnectAuthorize(code: string, userId?: string): Promise<boolean> { return this.request<boolean>('POST', '/QuickConnect/Authorize', { code, userId }); }
  async deleteSubtitle(itemId: string, index: number): Promise<void> { await this.request<void>('DELETE', `/Videos/${itemId}/Subtitles/${index}`); }
  async getSystemLogFile(name: string): Promise<string> { return this.request<string>('GET', `/System/Logs/Log`, { name }); }
  async createCollection(params: { name: string; ids?: string[]; parentId?: string }): Promise<{ Id?: string }> { return this.request<{ Id?: string }>('POST', '/Collections', { ...params, ids: params.ids?.join(',') }); }
  async addToCollection(collectionId: string, ids: string[]): Promise<void> { await this.request<void>('POST', `/Collections/${collectionId}/Items`, { ids: ids.join(',') }); }
  async removeFromCollection(collectionId: string, ids: string[]): Promise<void> { await this.request<void>('DELETE', `/Collections/${collectionId}/Items`, { ids: ids.join(',') }); }
  async createLiveTvTimer(params: { programId?: string; channelId?: string; startDate?: string; endDate?: string; name?: string; prePaddingSeconds?: number; postPaddingSeconds?: number; isPrePaddingRequired?: boolean; isPostPaddingRequired?: boolean; priority?: number }): Promise<void> { await this.request<void>('POST', '/LiveTv/Timers', undefined, params); }
  async updateLiveTvTimer(timerId: string, params: { programId?: string; channelId?: string; startDate?: string; endDate?: string; name?: string; prePaddingSeconds?: number; postPaddingSeconds?: number; isPrePaddingRequired?: boolean; isPostPaddingRequired?: boolean; priority?: number }): Promise<void> { await this.request<void>('POST', `/LiveTv/Timers/${timerId}`, undefined, params); }
  async deleteLiveTvTimer(timerId: string): Promise<void> { await this.request<void>('DELETE', `/LiveTv/Timers/${timerId}`); }
  async getLiveTvSeriesTimers(): Promise<QueryResult<BaseItemDto>> { return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/SeriesTimers'); }
  async getLiveTvSeriesTimer(id: string): Promise<BaseItemDto> { return this.request<BaseItemDto>('GET', `/LiveTv/SeriesTimers/${id}`); }
  async createLiveTvSeriesTimer(params: { programId?: string; channelId?: string; startDate?: string; endDate?: string; name?: string; prePaddingSeconds?: number; postPaddingSeconds?: number; isPrePaddingRequired?: boolean; isPostPaddingRequired?: boolean; priority?: number; recordAnyTime?: boolean; recordAnyChannel?: boolean; recordNewOnly?: boolean; days?: string[] }): Promise<void> { await this.request<void>('POST', '/LiveTv/SeriesTimers', undefined, params); }
  async deleteLiveTvSeriesTimer(id: string): Promise<void> { await this.request<void>('DELETE', `/LiveTv/SeriesTimers/${id}`); }
  async deletePlaylist(playlistId: string): Promise<void> { await this.request<void>('DELETE', `/Playlists/${playlistId}`); }
  async getTaskTriggers(taskId: string): Promise<{ Id?: string; Type?: string; IntervalTicks?: number; TimeOfDayTicks?: number; DayOfWeek?: string[] }[]> { return this.request<{ Id?: string; Type?: string; IntervalTicks?: number; TimeOfDayTicks?: number; DayOfWeek?: string[] }[]>('GET', `/ScheduledTasks/${taskId}/Triggers`); }
  async createTaskTrigger(taskId: string, params: { type: string; intervalTicks?: number; timeOfDayTicks?: number; dayOfWeek?: string[] }): Promise<void> { await this.request<void>('POST', `/ScheduledTasks/${taskId}/Triggers`, undefined, params); }
  async deleteTaskTrigger(taskId: string, triggerId: string): Promise<void> { await this.request<void>('DELETE', `/ScheduledTasks/${taskId}/Triggers/${triggerId}`); }
  async getArtistByName(name: string, userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; return this.request<BaseItemDto>('GET', `/Artists/${encodeURIComponent(name)}`, { userId: uid }); }
  async getGenreByName(name: string, userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; return this.request<BaseItemDto>('GET', `/Genres/${encodeURIComponent(name)}`, { userId: uid }); }
  async getStudioByName(name: string, userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; return this.request<BaseItemDto>('GET', `/Studios/${encodeURIComponent(name)}`, { userId: uid }); }
  async getPersonByName(name: string, userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; return this.request<BaseItemDto>('GET', `/Persons/${encodeURIComponent(name)}`, { userId: uid }); }
  async getSessionCapabilities(): Promise<{ PlayableMediaTypes?: string[]; SupportedCommands?: string[]; SupportsMediaControl?: boolean; SupportsSync?: boolean; SupportsPersistentIdentifier?: boolean }> { return this.request<{ PlayableMediaTypes?: string[]; SupportedCommands?: string[]; SupportsMediaControl?: boolean; SupportsSync?: boolean; SupportsPersistentIdentifier?: boolean }>('GET', '/Sessions/Capabilities'); }
  async reportSessionCapabilities(params: { playableMediaTypes?: string[]; supportedCommands?: string[]; supportsMediaControl?: boolean; supportsSync?: boolean; supportsPersistentIdentifier?: boolean }): Promise<void> { await this.request<void>('POST', '/Sessions/Capabilities', params); }

  // LibraryStructure
  async addVirtualFolder(params: AddVirtualFolderParams): Promise<void> { const { name, collectionType, paths, refreshLibrary } = params; await this.request<void>('POST', '/Library/VirtualFolders', { name, collectionType, refreshLibrary }, { LibraryOptions: {}, Paths: paths }); }
  async removeVirtualFolder(name: string, refreshLibrary?: boolean): Promise<void> { await this.request<void>('DELETE', '/Library/VirtualFolders', { name, refreshLibrary }); }
  async renameVirtualFolder(name: string, newName: string, refreshLibrary?: boolean): Promise<void> { await this.request<void>('POST', '/Library/VirtualFolders/Name', { name, newName, refreshLibrary }); }
  async addMediaPath(params: AddMediaPathParams): Promise<void> { const { name, path, networkPath, refreshLibrary } = params; await this.request<void>('POST', '/Library/VirtualFolders/Paths', { refreshLibrary }, { Name: name, PathInfo: { Path: path, NetworkPath: networkPath } }); }
  async removeMediaPath(name: string, path: string, refreshLibrary?: boolean): Promise<void> { await this.request<void>('DELETE', '/Library/VirtualFolders/Paths', { name, path, refreshLibrary }); }
  async updateMediaPath(params: UpdateMediaPathParams): Promise<void> { const { name, pathInfo } = params; await this.request<void>('POST', '/Library/VirtualFolders/Paths/Update', undefined, { Name: name, PathInfo: pathInfo }); }

  // ItemLookup - remote metadata search
  async remoteSearch(type: string, query: RemoteSearchQuery): Promise<RemoteSearchResult[]> { return this.request<RemoteSearchResult[]>('POST', `/Items/RemoteSearch/${type}`, undefined, query); }
  async applySearchResult(itemId: string, params: { searchProviderName?: string; replaceAllImages?: boolean; providerIds?: Record<string, string> }): Promise<void> { await this.request<void>('POST', `/Items/RemoteSearch/Apply/${itemId}`, params); }

  // UserViews
  async getUserViews(userId?: string): Promise<QueryResult<UserView>> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<QueryResult<UserView>>('GET', '/UserViews', { userId: uid }); }
  async getUserViewGroupingOptions(userId?: string): Promise<UserViewGroupingOption[]> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<UserViewGroupingOption[]>('GET', '/UserViews/GroupingOptions', { userId: uid }); }

  // Videos / MergeVersions
  async mergeVideoVersions(ids: string[]): Promise<void> { await this.request<void>('POST', '/Videos/MergeVersions', { ids: ids.join(',') }); }
  async deleteAlternateSources(itemId: string): Promise<void> { await this.request<void>('DELETE', `/Videos/${itemId}/AlternateSources`); }

  // TimeSync
  async getUtcTime(): Promise<UtcTimeResponse> { return this.request<UtcTimeResponse>('GET', '/GetUtcTime'); }

  // Named server configuration
  async getNamedConfiguration(key: string): Promise<unknown> { return this.request<unknown>('GET', `/System/Configuration/${key}`); }
  async updateNamedConfiguration(key: string, data: unknown): Promise<void> { await this.request<void>('POST', `/System/Configuration/${key}`, undefined, data); }

  private buildQS(params: Record<string, unknown>): string { const sp = new URLSearchParams(); for (const [k, v] of Object.entries(params ?? {})) { if (v !== undefined && v !== null) sp.append(k, String(v)); } const qs = sp.toString(); return qs ? `?${qs}` : ''; }
}
