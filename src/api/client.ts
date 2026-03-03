import type {
  JellyfinConfig, UserDto, QueryResult, BaseItemDto,
  PlaylistCreationResult, RecommendationDto, SimilarItemResult, PluginInfo, DeviceInfo,
  BrandingOptions, ServerConfiguration, ItemCounts, ApiKeyInfo, NotificationTypeInfo,
  NotificationResult, DisplayPreferences, VirtualFolderInfo, QueryFilters,
  RemoteImageInfo, ExternalIdInfo, ThemeMediaResult, RemoteSubtitleInfo, MediaSegment,
  LyricsInfo, BackupInfo, CreateUserDto, UpdateUserPasswordDto, RemoteSearchResult,
  RemoteSearchQuery, UserView, UserViewGroupingOption, UtcTimeResponse,
  AddVirtualFolderParams, AddMediaPathParams, UpdateMediaPathParams,
} from '../types/index.js';
import { JellyfinExtensions } from './client-ext.js';
import { buildQueryString } from './types.js';
import { TvShowsApi } from './tvshows.js';
import { PackagesApi, type PackageInfo } from './packages.js';
import { ImagesApi, type ItemImageInfo } from './images.js';
import { SuggestionsApi } from './suggestions.js';
import { YearsApi } from './years.js';
import { MusicGenresApi } from './musicgenres.js';
import { TrickplayApi } from './trickplay.js';
import { ChannelsApi, type ChannelFeatures } from './channels.js';
import { LiveTvApi, type LiveTvTimerParams, type LiveTvSeriesTimerParams, type TunerHostInfo, type ListingProviderInfo } from './livetv.js';
import { SyncPlayApi } from './syncplay.js';
import { PluginsExtApi } from './plugins-ext.js';
import { JellyfinApiError, type ChapterInfo, type PlaybackInfoResponse } from './core-api.js';

export { JellyfinApiError } from './core-api.js';
export type { ChapterInfo, PlaybackInfoResponse, PackageInfo, ItemImageInfo, ChannelFeatures, LiveTvTimerParams, LiveTvSeriesTimerParams, TunerHostInfo, ListingProviderInfo };

export class JellyfinApiClient extends JellyfinExtensions {
  private tvshows: TvShowsApi;
  private packages: PackagesApi;
  private images: ImagesApi;
  private suggestions: SuggestionsApi;
  private years: YearsApi;
  private musicGenres: MusicGenresApi;
  private trickplay: TrickplayApi;
  private channels: ChannelsApi;
  public livetv: LiveTvApi;
  public syncplay: SyncPlayApi;
  public pluginsExt: PluginsExtApi;

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
    this.livetv = new LiveTvApi(config);
    this.syncplay = new SyncPlayApi(config);
    this.pluginsExt = new PluginsExtApi(config);
  }

  setUserId(userId: string): void { super.setUserId(userId); this.syncModules(); }
  private syncModules(): void { const cfg = { serverUrl: this.getBackendUrl(), apiKey: this.apiKey, userId: this.getUserId(), timeout: this.timeout }; this.tvshows = new TvShowsApi(cfg); this.packages = new PackagesApi(cfg); this.images = new ImagesApi(cfg); this.suggestions = new SuggestionsApi(cfg); this.years = new YearsApi(cfg); this.musicGenres = new MusicGenresApi(cfg); this.trickplay = new TrickplayApi(cfg); this.channels = new ChannelsApi(cfg); this.livetv = new LiveTvApi(cfg); this.syncplay = new SyncPlayApi(cfg); this.pluginsExt = new PluginsExtApi(cfg); }

  // TV Shows
  async getEpisodes(seriesId: string, params?: { seasonId?: string; userId?: string; season?: number; limit?: number; startIndex?: number; isMissing?: boolean; sortBy?: string }): Promise<QueryResult<BaseItemDto>> { return this.tvshows.getEpisodes(seriesId, params); }
  async getSeasons(seriesId: string, params?: { userId?: string; isSpecialSeason?: boolean }): Promise<QueryResult<BaseItemDto>> { return this.tvshows.getSeasons(seriesId, params); }
  async getNextUpEpisodes(params?: { userId?: string; seriesId?: string; parentId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { return this.tvshows.getNextUpEpisodes(params); }
  async getUpcomingEpisodes(params?: { userId?: string; parentId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { return this.tvshows.getUpcomingEpisodes(params); }

  // Packages
  async getPackages(): Promise<PackageInfo[]> { return this.packages.getPackages(); }
  async getPackageInfo(packageId: string): Promise<PackageInfo> { return this.packages.getPackageInfo(packageId); }
  async installPackage(packageId: string, version?: string, repositoryUrl?: string): Promise<void> { return this.packages.installPackage(packageId, version, repositoryUrl); }
  async cancelPackageInstallation(installationId: string): Promise<void> { return this.packages.cancelPackageInstallation(installationId); }
  async getRepositories() { return this.packages.getRepositories(); }
  async setRepositories(repositories: { Name?: string; Url?: string; Enabled?: boolean }[]): Promise<void> { return this.packages.setRepositories(repositories); }
  async getInstallingPackages() { return this.packages.getInstallingPackages(); }

  // Images
  async getItemImages(itemId: string): Promise<ItemImageInfo[]> { return this.images.getItemImages(itemId); }
  getItemImage(itemId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; quality?: number; imageIndex?: number }): string { return this.images.getItemImage(itemId, imageType, params); }
  async deleteItemImage(itemId: string, imageType: string, imageIndex?: number): Promise<void> { return this.images.deleteItemImage(itemId, imageType, imageIndex); }
  async deleteUserImage(userId: string, imageType: string): Promise<void> { return this.images.deleteUserImage(userId, imageType); }
  getUserImage(userId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; imageIndex?: number }): string { return this.images.getUserImage(userId, imageType, params); }

  // Suggestions / Years / Music / Trickplay / Channels
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

  // Live TV
  async getLiveTvInfo() { return this.livetv.getLiveTvInfo(); }
  async getLiveTvChannels(params?: Parameters<LiveTvApi['getLiveTvChannels']>[0]) { return this.livetv.getLiveTvChannels(params); }
  async getLiveTvPrograms(params?: Parameters<LiveTvApi['getLiveTvPrograms']>[0]) { return this.livetv.getLiveTvPrograms(params); }
  async getLiveTvRecordings(params?: Parameters<LiveTvApi['getLiveTvRecordings']>[0]) { return this.livetv.getLiveTvRecordings(params); }
  async getLiveTvTimer(id: string) { return this.livetv.getLiveTvTimer(id); }
  async getLiveTvTimers(params?: Parameters<LiveTvApi['getLiveTvTimers']>[0]) { return this.livetv.getLiveTvTimers(params); }
  async createLiveTvTimer(params: LiveTvTimerParams) { return this.livetv.createLiveTvTimer(params); }
  async updateLiveTvTimer(id: string, params: LiveTvTimerParams) { return this.livetv.updateLiveTvTimer(id, params); }
  async deleteLiveTvTimer(id: string) { return this.livetv.deleteLiveTvTimer(id); }
  async getLiveTvSeriesTimers() { return this.livetv.getLiveTvSeriesTimers(); }
  async getLiveTvSeriesTimer(id: string) { return this.livetv.getLiveTvSeriesTimer(id); }
  async createLiveTvSeriesTimer(params: LiveTvSeriesTimerParams) { return this.livetv.createLiveTvSeriesTimer(params); }
  async deleteLiveTvSeriesTimer(id: string) { return this.livetv.deleteLiveTvSeriesTimer(id); }
  async getLiveTvGuideInfo() { return this.livetv.getLiveTvGuideInfo(); }
  async getLiveTvRecommendedPrograms(params?: Parameters<LiveTvApi['getLiveTvRecommendedPrograms']>[0]) { return this.livetv.getLiveTvRecommendedPrograms(params); }
  async getLiveTvRecordingFolders() { return this.livetv.getLiveTvRecordingFolders(); }
  async getLiveTvRecordingGroups() { return this.livetv.getLiveTvRecordingGroups(); }
  async getLiveTvRecordingById(id: string) { return this.livetv.getLiveTvRecordingById(id); }
  async deleteLiveTvRecording(id: string) { return this.livetv.deleteLiveTvRecording(id); }
  async discoverTuners() { return this.livetv.discoverTuners(); }
  async getTunerHostTypes() { return this.livetv.getTunerHostTypes(); }

  // SyncPlay
  async getSyncPlayGroups() { return this.syncplay.getGroups(); }
  async syncPlayCreate(groupName?: string) { return this.syncplay.createGroup(groupName ? { GroupName: groupName } : undefined); }
  async syncPlayGetGroup(groupId: string) { return this.syncplay.getGroup(groupId); }
  async syncPlayJoin(groupId: string) { return this.syncplay.joinGroup(groupId); }
  async syncPlayLeave() { return this.syncplay.leaveGroup(); }
  async syncPlayPause() { return this.syncplay.pauseGroup(); }
  async syncPlayUnpause() { return this.syncplay.unpauseGroup(); }
  async syncPlayStop() { return this.syncplay.stopGroup(); }
  async syncPlaySeek(positionTicks: number) { return this.syncplay.seekGroup(positionTicks); }
  async syncPlayNextItem(playlistItemId?: string) { return this.syncplay.nextItem(playlistItemId ? { PlaylistItemId: playlistItemId } : undefined); }
  async syncPlayPreviousItem(playlistItemId?: string) { return this.syncplay.previousItem(playlistItemId ? { PlaylistItemId: playlistItemId } : undefined); }
  async syncPlaySetRepeatMode(mode: string) { return this.syncplay.setRepeatMode(mode); }
  async syncPlaySetShuffleMode(mode: string) { return this.syncplay.setShuffleMode(mode); }
  async syncPlayQueue(itemIds: string[]) { return this.syncplay.queueItems(itemIds); }
  async syncPlaySetNewQueue(itemIds: string[], startPositionTicks?: number) { return this.syncplay.setNewQueue({ ItemIds: itemIds, StartPositionTicks: startPositionTicks }); }
  async syncPlayRemoveFromPlaylist(playlistItemIds: string[]) { return this.syncplay.removeFromPlaylist(playlistItemIds); }
  async syncPlayMovePlaylistItem(playlistItemId: string, newIndex: number) { return this.syncplay.movePlaylistItem(playlistItemId, newIndex); }
  async syncPlaySetPlaylistItem(playlistItemId: string) { return this.syncplay.setPlaylistItem(playlistItemId); }
  async syncPlayPing(ping: number) { return this.syncplay.updatePing(ping); }
  async syncPlayBuffering(params?: Parameters<SyncPlayApi['reportBuffering']>[0]) { return this.syncplay.reportBuffering(params); }
  async syncPlayReady(params?: Parameters<SyncPlayApi['reportReady']>[0]) { return this.syncplay.reportReady(params); }
  async syncPlaySetIgnoreWait(ignoreWait: boolean) { return this.syncplay.setIgnoreWait(ignoreWait); }

  // Playlists
  async createPlaylist(params: { name: string; ids?: string[]; userId?: string; mediaType?: string }): Promise<PlaylistCreationResult> { const userId = params.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<PlaylistCreationResult>('POST', '/Playlists', { ...params, userId, ids: params.ids?.join(',') }); }
  async addToPlaylist(playlistId: string, ids: string[], userId?: string): Promise<void> { await this.request<void>('POST', `/Playlists/${playlistId}/Items`, { ids: ids.join(','), userId: userId ?? this.userId }); }
  async removeFromPlaylist(playlistId: string, entryIds: string[]): Promise<void> { await this.request<void>('DELETE', `/Playlists/${playlistId}/Items`, { entryIds: entryIds.join(',') }); }
  async getPlaylistItems(playlistId: string, params?: { userId?: string; startIndex?: number; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', `/Playlists/${playlistId}/Items`, { ...params, userId }); }
  async deletePlaylist(playlistId: string): Promise<void> { await this.request<void>('DELETE', `/Playlists/${playlistId}`); }
  async getPlaylist(playlistId: string): Promise<BaseItemDto> { return this.request<BaseItemDto>('GET', `/Playlists/${playlistId}`); }
  async updatePlaylist(playlistId: string, data: { Name?: string; Ids?: string[]; UserId?: string }): Promise<void> { await this.request<void>('POST', `/Playlists/${playlistId}`, undefined, data); }
  async getPlaylistUsers(playlistId: string): Promise<{ UserId?: string; CanEdit?: boolean }[]> { return this.request<{ UserId?: string; CanEdit?: boolean }[]>('GET', `/Playlists/${playlistId}/Users`); }
  async setPlaylistUserAccess(playlistId: string, userId: string, canEdit: boolean): Promise<void> { await this.request<void>('POST', `/Playlists/${playlistId}/Users/${userId}`, undefined, { UserId: userId, CanEdit: canEdit }); }
  async removePlaylistUserAccess(playlistId: string, userId: string): Promise<void> { await this.request<void>('DELETE', `/Playlists/${playlistId}/Users/${userId}`); }
  async movePlaylistItem(playlistId: string, itemId: string, newIndex: number): Promise<void> { await this.request<void>('POST', `/Playlists/${playlistId}/Items/${itemId}/Move/${newIndex}`); }
  async getPlaylistInstantMix(playlistId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', `/Playlists/${playlistId}/InstantMix`, { ...params, userId }); }

  // Favorites & User Data
  async markFavorite(itemId: string, userId?: string): Promise<{ IsFavorite?: boolean }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ IsFavorite?: boolean }>('POST', `/UserFavoriteItems/${itemId}`, { userId: uid }); }
  async unmarkFavorite(itemId: string, userId?: string): Promise<{ IsFavorite?: boolean }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ IsFavorite?: boolean }>('DELETE', `/UserFavoriteItems/${itemId}`, { userId: uid }); }
  async markPlayed(itemId: string, userId?: string, datePlayed?: string): Promise<{ Played?: boolean }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ Played?: boolean }>('POST', `/UserPlayedItems/${itemId}`, { userId: uid, datePlayed }); }
  async unmarkPlayed(itemId: string, userId?: string): Promise<{ Played?: boolean }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ Played?: boolean }>('DELETE', `/UserPlayedItems/${itemId}`, { userId: uid }); }
  async updateUserItemRating(itemId: string, userId?: string, likes?: boolean): Promise<{ Played?: boolean }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ Played?: boolean }>('POST', `/UserItems/${itemId}/Rating`, { userId: uid, likes }); }
  async deleteUserItemRating(itemId: string, userId?: string): Promise<{ Played?: boolean }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ Played?: boolean }>('DELETE', `/UserItems/${itemId}/Rating`, { userId: uid }); }
  async getUserItemData(itemId: string, userId?: string): Promise<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; LastPlayedDate?: string; PlaybackPositionTicks?: number; Rating?: number }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; LastPlayedDate?: string; PlaybackPositionTicks?: number; Rating?: number }>('GET', `/UserItems/${itemId}/UserData`, { userId: uid }); }
  async updateUserItemData(itemId: string, data: { IsFavorite?: boolean; Played?: boolean; PlayCount?: number; PlaybackPositionTicks?: number; Rating?: number }, userId?: string): Promise<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; PlaybackPositionTicks?: number; Rating?: number }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; PlaybackPositionTicks?: number; Rating?: number }>('POST', `/UserItems/${itemId}/UserData`, { userId: uid }, data); }

  // Library Browsing
  async getGenres(params?: { parentId?: string; userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', '/Genres', { ...params, userId }); }
  async getStudios(params?: { parentId?: string; userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', '/Studios', { ...params, userId }); }
  async getPersons(params?: { parentId?: string; userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', '/Persons', { ...params, userId }); }
  async getArtists(params?: { parentId?: string; userId?: string; limit?: number; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<QueryResult<BaseItemDto>>('GET', '/Artists', { ...params, userId }); }
  async getAlbumArtists(params?: { parentId?: string; userId?: string; limit?: number; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<QueryResult<BaseItemDto>>('GET', '/Artists/AlbumArtists', { ...params, userId }); }
  async getMediaFolders(isHidden?: boolean): Promise<QueryResult<BaseItemDto>> { return this.request<QueryResult<BaseItemDto>>('GET', '/Library/MediaFolders', { isHidden }); }
  async getPhysicalPaths(): Promise<string[]> { return this.request<string[]>('GET', '/Library/PhysicalPaths'); }

  // Items
  async getSimilarItems(itemId: string, params?: { userId?: string; limit?: number }): Promise<SimilarItemResult> { const userId = params?.userId ?? this.userId; return this.request<SimilarItemResult>('GET', `/Items/${itemId}/Similar`, { ...params, userId }); }
  async getRecommendations(params?: { userId?: string; categoryLimit?: number; itemLimit?: number }): Promise<RecommendationDto[]> { const userId = params?.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<RecommendationDto[]>('GET', '/Movies/Recommendations', { userId, categoryLimit: params?.categoryLimit, itemLimit: params?.itemLimit }); }
  async getInstantMix(itemId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<QueryResult<BaseItemDto>>('GET', `/Items/${itemId}/InstantMix`, { ...params, userId }); }
  async getTrailers(params?: { userId?: string; limit?: number; startIndex?: number; sortBy?: string }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', '/Trailers', { ...params, userId }); }
  async getCriticReviews(itemId: string): Promise<QueryResult<{ Body?: string; Date?: string; IsNegative?: boolean; ReviewerName?: string; Url?: string }>> { return this.request<QueryResult<{ Body?: string; Date?: string; IsNegative?: boolean; ReviewerName?: string; Url?: string }>>('GET', `/Items/${itemId}/CriticReviews`); }
  async getItemRootFolder(userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<BaseItemDto>('GET', `/Users/${uid}/Items/Root`); }
  async setItemContentType(itemId: string, contentType: string): Promise<void> { await this.request<void>('POST', `/Items/${itemId}/ContentType`, { contentType }); }
  async getAlbumInstantMix(albumId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', `/Albums/${albumId}/InstantMix`, { ...params, userId }); }
  async getSongInstantMix(songId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', `/Songs/${songId}/InstantMix`, { ...params, userId }); }
  async getArtistInstantMix(artistId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', `/Artists/${artistId}/InstantMix`, { ...params, userId }); }
  async getMusicGenreInstantMix(genreName: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', `/MusicGenres/${encodeURIComponent(genreName)}/InstantMix`, { ...params, userId }); }
  async getIntros(itemId: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/Intros`); }
  async getAdditionalParts(itemId: string): Promise<QueryResult<BaseItemDto>> { return this.request<QueryResult<BaseItemDto>>('GET', `/Videos/${itemId}/AdditionalParts`); }
  async getChapters(itemId: string): Promise<ChapterInfo[]> { return this.request<ChapterInfo[]>('GET', `/Items/${itemId}/Chapters`); }
  async getSpecialFeatures(itemId: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/SpecialFeatures`); }
  async getLocalTrailers(itemId: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/LocalTrailers`); }
  async getAncestors(itemId: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', `/Items/${itemId}/Ancestors`); }
  async getItemsByPath(path: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', '/Items/ByPath', { path }); }
  async getPlaybackInfo(itemId: string, userId?: string): Promise<PlaybackInfoResponse> { const uid = userId ?? this.userId; return this.request<PlaybackInfoResponse>('GET', `/Items/${itemId}/PlaybackInfo`, { userId: uid }); }
  async getItemCounts(): Promise<ItemCounts> { return this.request<ItemCounts>('GET', '/Items/Counts'); }
  async getQueryFilters(params?: { userId?: string; parentId?: string; includeItemTypes?: string[] }): Promise<QueryFilters> { return this.request<QueryFilters>('GET', '/Items/Filters', params as Record<string, unknown>); }
  async getQueryFilters2(params?: { userId?: string; parentId?: string; includeItemTypes?: string[] }): Promise<QueryFilters> { return this.request<QueryFilters>('GET', '/Items/Filters2', params as Record<string, unknown>); }
  async logClientDocument(entries: { Name?: string; Timestamp?: string; Message?: string; Level?: string }[]): Promise<void> { await this.request<void>('POST', '/ClientLog/Document', undefined, { Entries: entries }); }
  async reportFullSessionCapabilities(params: { playableMediaTypes?: string[]; supportedCommands?: string[]; supportsMediaControl?: boolean; supportsContentUploading?: boolean; supportsSync?: boolean }): Promise<void> { await this.request<void>('POST', '/Sessions/Capabilities/Full', undefined, params); }
  async getThemeSongs(itemId: string, userId?: string, inheritFromParent?: boolean): Promise<ThemeMediaResult> { return this.request<ThemeMediaResult>('GET', `/Items/${itemId}/ThemeSongs`, { userId, inheritFromParent }); }
  async getThemeVideos(itemId: string, userId?: string, inheritFromParent?: boolean): Promise<ThemeMediaResult> { return this.request<ThemeMediaResult>('GET', `/Items/${itemId}/ThemeVideos`, { userId, inheritFromParent }); }
  async getRemoteImages(itemId: string, params?: { type?: string; startIndex?: number; limit?: number }): Promise<{ Images?: RemoteImageInfo[]; TotalRecordCount?: number; Providers?: string[] }> { return this.request<{ Images?: RemoteImageInfo[]; TotalRecordCount?: number; Providers?: string[] }>('GET', `/Items/${itemId}/RemoteImages`, params); }
  async downloadRemoteImage(itemId: string, params?: { type?: string; imageUrl?: string }): Promise<void> { await this.request<void>('POST', `/Items/${itemId}/RemoteImages/Download`, params); }
  async getExternalIdInfos(itemId: string): Promise<ExternalIdInfo[]> { return this.request<ExternalIdInfo[]>('GET', `/Items/${itemId}/ExternalIdInfos`); }
  async searchRemoteSubtitles(itemId: string, language: string, isPerfectMatch?: boolean): Promise<RemoteSubtitleInfo[]> { return this.request<RemoteSubtitleInfo[]>('GET', `/Items/${itemId}/RemoteSearch/Subtitles/${language}`, { isPerfectMatch }); }
  async downloadRemoteSubtitle(itemId: string, subtitleId: string): Promise<void> { await this.request<void>('POST', `/Items/${itemId}/RemoteSearch/Subtitles/${subtitleId}`); }
  async refreshItem(itemId: string, params?: { recursive?: boolean; replaceAllMetadata?: boolean; replaceAllImages?: boolean }): Promise<void> { await this.request<void>('POST', `/Items/${itemId}/Refresh`, params); }
  async deleteItem(itemId: string): Promise<void> { await this.request<void>('DELETE', `/Items/${itemId}`); }
  async updateItem(itemId: string, item: Partial<BaseItemDto>): Promise<void> { await this.request<void>('POST', `/Items/${itemId}`, undefined, item); }
  async getMediaSegments(itemId: string): Promise<QueryResult<MediaSegment>> { return this.request<QueryResult<MediaSegment>>('GET', `/MediaSegments/${itemId}`); }
  async getLyrics(itemId: string): Promise<LyricsInfo> { return this.request<LyricsInfo>('GET', `/Audio/${itemId}/Lyrics`); }
  async uploadLyrics(itemId: string, params: { language: string; isSynced: boolean; data: string }): Promise<LyricsInfo> { return this.request<LyricsInfo>('POST', `/Audio/${itemId}/Lyrics`, undefined, params); }
  async deleteLyrics(itemId: string): Promise<void> { await this.request<void>('DELETE', `/Audio/${itemId}/Lyrics`); }
  async searchRemoteLyrics(itemId: string): Promise<RemoteSubtitleInfo[]> { return this.request<RemoteSubtitleInfo[]>('GET', `/Audio/${itemId}/RemoteSearch/Lyrics`); }
  async downloadRemoteLyrics(itemId: string, lyricId: string): Promise<LyricsInfo> { return this.request<LyricsInfo>('POST', `/Audio/${itemId}/RemoteSearch/Lyrics/${encodeURIComponent(lyricId)}`); }
  async remoteSearch(type: string, query: RemoteSearchQuery): Promise<RemoteSearchResult[]> { return this.request<RemoteSearchResult[]>('POST', `/Items/RemoteSearch/${type}`, undefined, query); }
  async applySearchResult(itemId: string, params: { searchProviderName?: string; replaceAllImages?: boolean; providerIds?: Record<string, string> }): Promise<void> { await this.request<void>('POST', `/Items/RemoteSearch/Apply/${itemId}`, params); }

  // Streaming URLs
  getStreamUrl(itemId: string, params?: { mediaSourceId?: string; audioStreamIndex?: number; subtitleStreamIndex?: number; maxStreamingBitrate?: number }): string { return `${this.getBackendUrl()}/Videos/${itemId}/stream${buildQueryString({ ...params, userId: this.userId })}`; }
  getAudioStreamUrl(itemId: string, params?: { mediaSourceId?: string; audioStreamIndex?: number; maxStreamingBitrate?: number }): string { return `${this.getBackendUrl()}/Audio/${itemId}/stream${buildQueryString({ ...params, userId: this.userId })}`; }
  getSubtitleUrl(itemId: string, mediaSourceId: string, streamIndex: number, format?: string): string { return `${this.getBackendUrl()}/Videos/${itemId}/${mediaSourceId}/Subtitles/${streamIndex}/Stream.${format ?? 'srt'}${buildQueryString({ mediaSourceId, streamIndex, format, userId: this.userId })}`; }
  getThumbUrl(itemId: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string }): string { return `${this.getBackendUrl()}/Items/${itemId}/Images/Primary${buildQueryString(params as Record<string, unknown>)}`; }
  getHlsMasterPlaylistUrl(itemId: string, params?: { mediaSourceId?: string; audioStreamIndex?: number; subtitleStreamIndex?: number; maxStreamingBitrate?: number }): string { return `${this.getBackendUrl()}/Videos/${itemId}/master.m3u8${buildQueryString({ ...params, userId: this.userId })}`; }
  getItemDownloadUrl(itemId: string): string { return `${this.getBackendUrl()}/Items/${itemId}/Download${buildQueryString({ api_key: this.apiKey } as Record<string, unknown>)}`; }

  // Plugins
  async getPlugins(): Promise<PluginInfo[]> { return this.request<PluginInfo[]>('GET', '/Plugins'); }
  async getPlugin(pluginId: string): Promise<PluginInfo> { return this.request<PluginInfo>('GET', `/Plugins/${pluginId}`); }
  async uninstallPlugin(pluginId: string): Promise<void> { await this.request<void>('DELETE', `/Plugins/${pluginId}`); }
  async disablePlugin(pluginId: string, version: string): Promise<void> { await this.request<void>('POST', `/Plugins/${pluginId}/${version}/Disable`); }
  async enablePlugin(pluginId: string, version: string): Promise<void> { await this.request<void>('POST', `/Plugins/${pluginId}/${version}/Enable`); }
  async getPluginConfiguration(pluginId: string): Promise<Record<string, unknown>> { return this.request<Record<string, unknown>>('GET', `/Plugins/${pluginId}/Configuration`); }
  async updatePluginConfiguration(pluginId: string, config: Record<string, unknown>): Promise<void> { await this.request<void>('POST', `/Plugins/${pluginId}/Configuration`, undefined, config); }

  // Devices
  async getDevices(): Promise<QueryResult<DeviceInfo>> { return this.request<QueryResult<DeviceInfo>>('GET', '/Devices'); }
  async getDevice(deviceId: string): Promise<DeviceInfo> { return this.request<DeviceInfo>('GET', `/Devices/${deviceId}`); }
  async deleteDevice(deviceId: string): Promise<void> { await this.request<void>('DELETE', '/Devices', { id: deviceId }); }
  async updateDeviceOptions(deviceId: string, options: { customName?: string }): Promise<void> { await this.request<void>('POST', '/Devices/Options', undefined, { Id: deviceId, ...options }); }

  // System Config & Branding
  async getBranding(): Promise<BrandingOptions> { return this.request<BrandingOptions>('GET', '/Branding/Configuration'); }
  async getBrandingCss(): Promise<string> { return this.request<string>('GET', '/Branding/Css'); }
  async getSplashscreenUrl(): Promise<string> { return `${this.baseUrl}/Branding/Splashscreen`; }
  async deleteSplashscreen(): Promise<void> { await this.request<void>('DELETE', '/Branding/Splashscreen'); }
  async getServerConfiguration(): Promise<ServerConfiguration> { return this.request<ServerConfiguration>('GET', '/System/Configuration'); }
  async updateServerConfiguration(config: Partial<ServerConfiguration>): Promise<void> { await this.request<void>('POST', '/System/Configuration', undefined, config); }
  async updateBrandingConfiguration(config: Partial<BrandingOptions>): Promise<void> { await this.request<void>('POST', '/System/Configuration/Branding', undefined, config); }
  async getNamedConfiguration(key: string): Promise<unknown> { return this.request<unknown>('GET', `/System/Configuration/${key}`); }
  async updateNamedConfiguration(key: string, data: unknown): Promise<void> { await this.request<void>('POST', `/System/Configuration/${key}`, undefined, data); }
  async getSystemStorageInfo(): Promise<{ DataPaths?: string[]; CachePath?: string; InternalMetadataPath?: string; LogPath?: string; TranscodingTempPath?: string }> { return this.request<{ DataPaths?: string[]; CachePath?: string; InternalMetadataPath?: string; LogPath?: string; TranscodingTempPath?: string }>('GET', '/System/Info/Storage'); }
  async getSystemLogs(): Promise<{ Name?: string; DateCreated?: string; Size?: number }[]> { return this.request<{ Name?: string; DateCreated?: string; Size?: number }[]>('GET', '/System/Logs'); }
  async getSystemLogFile(name: string): Promise<string> { return this.request<string>('GET', `/System/Logs/Log`, { name }); }
  async getSystemEndpoint(): Promise<{ IsLocal?: boolean; IsInNetwork?: boolean }> { return this.request<{ IsLocal?: boolean; IsInNetwork?: boolean }>('GET', '/System/Endpoint'); }
  async getUtcTime(): Promise<UtcTimeResponse> { return this.request<UtcTimeResponse>('GET', '/GetUtcTime'); }
  async testBitrate(size?: number): Promise<number> { return this.request<number>('GET', '/Playback/BitrateTest', size !== undefined ? { size } : undefined); }
  async getSubtitleProviders(): Promise<{ Name?: string | null }[]> { return this.request<{ Name?: string | null }[]>('GET', '/Providers/Subtitles/Subtitles'); }
  async getDisplayPreferences(displayPreferencesId: string, userId?: string, client?: string): Promise<DisplayPreferences> { const uid = userId ?? this.userId; return this.request<DisplayPreferences>('GET', `/DisplayPreferences/${displayPreferencesId}`, { userId: uid, client: client ?? 'emby' }); }
  async updateDisplayPreferences(displayPreferencesId: string, prefs: Partial<DisplayPreferences>, userId?: string, client?: string): Promise<void> { const uid = userId ?? this.userId; await this.request<void>('POST', `/DisplayPreferences/${displayPreferencesId}`, { userId: uid, client: client ?? 'emby' }, prefs); }

  // API Keys & Notifications
  async getApiKeys(): Promise<QueryResult<ApiKeyInfo>> { return this.request<QueryResult<ApiKeyInfo>>('GET', '/Auth/Keys'); }
  async createApiKey(app: string): Promise<void> { await this.request<void>('POST', '/Auth/Keys', { app }); }
  async deleteApiKey(key: string): Promise<void> { await this.request<void>('DELETE', `/Auth/Keys/${key}`); }
  async getNotificationTypes(): Promise<NotificationTypeInfo[]> { return this.request<NotificationTypeInfo[]>('GET', '/Notifications/Types'); }
  async getNotifications(userId?: string): Promise<NotificationResult> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<NotificationResult>('GET', `/Notifications/${uid}`); }
  async sendAdminNotification(params: { name: string; description?: string; url?: string; level?: string; userIds?: string[] }): Promise<void> { await this.request<void>('POST', '/Notifications/Admin', params); }

  // Users
  async createUser(user: CreateUserDto): Promise<{ Id?: string; Name?: string; ServerId?: string }> { return this.request<{ Id?: string; Name?: string; ServerId?: string }>('POST', '/Users/New', undefined, user); }
  async deleteUser(userId: string): Promise<void> { await this.request<void>('DELETE', `/Users/${userId}`); }
  async updateUserPolicy(userId: string, policy: Record<string, unknown>): Promise<void> { await this.request<void>('POST', `/Users/${userId}/Policy`, undefined, policy); }
  async updateUserConfiguration(userId: string, config: Record<string, unknown>): Promise<void> { await this.request<void>('POST', '/Users/Configuration', { userId }, config); }
  async updateUserPassword(userId: string, password: UpdateUserPasswordDto): Promise<void> { await this.request<void>('POST', '/Users/Password', { userId }, password); }
  async getPublicUsers(): Promise<UserDto[]> { return this.request<UserDto[]>('GET', '/Users/Public'); }
  async getUserViews(userId?: string): Promise<QueryResult<UserView>> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<QueryResult<UserView>>('GET', '/UserViews', { userId: uid }); }
  async getUserViewGroupingOptions(userId?: string): Promise<UserViewGroupingOption[]> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<UserViewGroupingOption[]>('GET', '/UserViews/GroupingOptions', { userId: uid }); }
  async forgotPassword(enteredUsername: string): Promise<{ Action?: string; PinFile?: string; PinExpirationDate?: string }> { return this.request<{ Action?: string; PinFile?: string; PinExpirationDate?: string }>('POST', '/Users/ForgotPassword', undefined, { EnteredUsername: enteredUsername }); }
  async redeemForgotPasswordPin(pin: string): Promise<{ Success?: boolean; UsersReset?: string[] }> { return this.request<{ Success?: boolean; UsersReset?: string[] }>('POST', '/Users/ForgotPassword/Pin', undefined, { Pin: pin }); }
  async authenticateWithQuickConnect(secret: string): Promise<UserDto> { return this.request<UserDto>('POST', '/Users/AuthenticateWithQuickConnect', undefined, { Secret: secret }); }

  // Sessions extended
  async addSessionUser(sessionId: string, userId: string): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/User/${userId}`); }
  async removeSessionUser(sessionId: string, userId: string): Promise<void> { await this.request<void>('DELETE', `/Sessions/${sessionId}/User/${userId}`); }
  async setNowViewing(sessionId: string, itemId: string): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/Viewing`, { itemId }); }
  async reportSessionCapabilities(params: { playableMediaTypes?: string[]; supportedCommands?: string[]; supportsMediaControl?: boolean }): Promise<void> { await this.request<void>('POST', '/Sessions/Capabilities', params); }
  async logoutSession(): Promise<void> { await this.request<void>('POST', '/Sessions/Logout'); }
  async sendGeneralCommand(sessionId: string, command: string, args?: Record<string, string>): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/Command/${encodeURIComponent(command)}`, undefined, args ? { Arguments: args } : undefined); }

  // Library Structure
  async getVirtualFolders(): Promise<VirtualFolderInfo[]> { return this.request<VirtualFolderInfo[]>('GET', '/Library/VirtualFolders'); }
  async addVirtualFolder(params: AddVirtualFolderParams): Promise<void> { const { name, collectionType, paths, refreshLibrary } = params; await this.request<void>('POST', '/Library/VirtualFolders', { name, collectionType, refreshLibrary }, { LibraryOptions: {}, Paths: paths }); }
  async removeVirtualFolder(name: string, refreshLibrary?: boolean): Promise<void> { await this.request<void>('DELETE', '/Library/VirtualFolders', { name, refreshLibrary }); }
  async renameVirtualFolder(name: string, newName: string, refreshLibrary?: boolean): Promise<void> { await this.request<void>('POST', '/Library/VirtualFolders/Name', { name, newName, refreshLibrary }); }
  async addMediaPath(params: AddMediaPathParams): Promise<void> { const { name, path, networkPath, refreshLibrary } = params; await this.request<void>('POST', '/Library/VirtualFolders/Paths', { refreshLibrary }, { Name: name, PathInfo: { Path: path, NetworkPath: networkPath } }); }
  async removeMediaPath(name: string, path: string, refreshLibrary?: boolean): Promise<void> { await this.request<void>('DELETE', '/Library/VirtualFolders/Paths', { name, path, refreshLibrary }); }
  async updateMediaPath(params: UpdateMediaPathParams): Promise<void> { const { name, pathInfo } = params; await this.request<void>('POST', '/Library/VirtualFolders/Paths/Update', undefined, { Name: name, PathInfo: pathInfo }); }

  // Scheduled Tasks
  async getTaskTriggers(taskId: string): Promise<{ Id?: string; Type?: string; IntervalTicks?: number; TimeOfDayTicks?: number; DayOfWeek?: string[] }[]> { return this.request<{ Id?: string; Type?: string; IntervalTicks?: number; TimeOfDayTicks?: number; DayOfWeek?: string[] }[]>('GET', `/ScheduledTasks/${taskId}/Triggers`); }
  async createTaskTrigger(taskId: string, params: { type: string; intervalTicks?: number; timeOfDayTicks?: number; dayOfWeek?: string[] }): Promise<void> { await this.request<void>('POST', `/ScheduledTasks/${taskId}/Triggers`, undefined, params); }
  async deleteTaskTrigger(taskId: string, triggerId: string): Promise<void> { await this.request<void>('DELETE', `/ScheduledTasks/${taskId}/Triggers/${triggerId}`); }

  // Named lookups
  async getArtistByName(name: string, userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; return this.request<BaseItemDto>('GET', `/Artists/${encodeURIComponent(name)}`, { userId: uid }); }
  async getGenreByName(name: string, userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; return this.request<BaseItemDto>('GET', `/Genres/${encodeURIComponent(name)}`, { userId: uid }); }
  async getStudioByName(name: string, userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; return this.request<BaseItemDto>('GET', `/Studios/${encodeURIComponent(name)}`, { userId: uid }); }
  async getPersonByName(name: string, userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; return this.request<BaseItemDto>('GET', `/Persons/${encodeURIComponent(name)}`, { userId: uid }); }

  // Collections
  async createCollection(params: { name: string; ids?: string[]; parentId?: string }): Promise<{ Id?: string }> { return this.request<{ Id?: string }>('POST', '/Collections', { ...params, ids: params.ids?.join(',') }); }
  async addToCollection(collectionId: string, ids: string[]): Promise<void> { await this.request<void>('POST', `/Collections/${collectionId}/Items`, { ids: ids.join(',') }); }
  async removeFromCollection(collectionId: string, ids: string[]): Promise<void> { await this.request<void>('DELETE', `/Collections/${collectionId}/Items`, { ids: ids.join(',') }); }

  // Environment
  async getDrives(): Promise<{ Name?: string; Path?: string }[]> { return this.request<{ Name?: string; Path?: string }[]>('GET', '/Environment/Drives'); }
  async getDirectoryContents(path: string, params?: { includeFiles?: boolean; includeDirectories?: boolean }): Promise<{ Name?: string; Path?: string; Type?: string }[]> { return this.request<{ Name?: string; Path?: string; Type?: string }[]>('GET', '/Environment/DirectoryContents', { path, ...params }); }
  async getNetworkShares(): Promise<{ Name?: string; Path?: string }[]> { return this.request<{ Name?: string; Path?: string }[]>('GET', '/Environment/NetworkShares'); }
  async getParentPath(path: string): Promise<string> { return this.request<string>('GET', '/Environment/ParentPath', { path }); }
  async validatePath(params: { path: string; isFile?: boolean }): Promise<void> { await this.request<void>('POST', '/Environment/ValidatePath', undefined, params); }

  // Backup
  async getBackups(): Promise<BackupInfo[]> { return this.request<BackupInfo[]>('GET', '/Backup'); }
  async getBackupManifest(path: string): Promise<Record<string, unknown>> { return this.pluginsExt.getBackupManifest(path); }
  async createBackup(): Promise<void> { await this.request<void>('POST', '/Backup/Create'); }
  async restoreBackup(backupPath: string): Promise<void> { await this.request<void>('POST', '/Backup/Restore', undefined, { backupPath }); }
  async deleteBackup(backupPath: string): Promise<void> { await this.request<void>('DELETE', `/Backup/${encodeURIComponent(backupPath)}`); }

  // Library media notifications (delegates to pluginsExt)
  async notifyLibraryMediaUpdated(updates: { Path?: string; UpdateType?: string }[]): Promise<void> { return this.pluginsExt.notifyLibraryMediaUpdated(updates); }
  async notifyMoviesAdded(updates: { Path?: string; UpdateType?: string }[]): Promise<void> { return this.pluginsExt.notifyMoviesAdded(updates); }
  async notifyMoviesUpdated(updates: { Path?: string; UpdateType?: string }[]): Promise<void> { return this.pluginsExt.notifyMoviesUpdated(updates); }
  async notifySeriesAdded(updates: { Path?: string; UpdateType?: string }[]): Promise<void> { return this.pluginsExt.notifySeriesAdded(updates); }
  async notifySeriesUpdated(updates: { Path?: string; UpdateType?: string }[]): Promise<void> { return this.pluginsExt.notifySeriesUpdated(updates); }

  // Plugin extended (delegates to pluginsExt)
  async getMeilisearchStatus() { return this.pluginsExt.getMeilisearchStatus(); }
  async reconnectMeilisearch() { return this.pluginsExt.reconnectMeilisearch(); }
  async reindexMeilisearch() { return this.pluginsExt.reindexMeilisearch(); }
  async getTmdbClientConfiguration() { return this.pluginsExt.getTmdbClientConfiguration(); }
  async refreshTmdbBoxSets() { return this.pluginsExt.refreshTmdbBoxSets(); }
  async testTelegramNotifier() { return this.pluginsExt.testTelegramNotifier(); }
  async createInfuseSyncCheckpoint() { return this.pluginsExt.createInfuseSyncCheckpoint(); }
  async startInfuseSyncCheckpoint(id: string) { return this.pluginsExt.startInfuseSyncCheckpoint(id); }
  async getInfuseSyncRemovedItems(id: string) { return this.pluginsExt.getInfuseSyncRemovedItems(id); }
  async getInfuseSyncUpdatedItems(id: string) { return this.pluginsExt.getInfuseSyncUpdatedItems(id); }
  async getInfuseSyncUserData(id: string) { return this.pluginsExt.getInfuseSyncUserData(id); }
  async getInfuseSyncUserFolders(userId?: string) { return this.pluginsExt.getInfuseSyncUserFolders(userId); }

}
