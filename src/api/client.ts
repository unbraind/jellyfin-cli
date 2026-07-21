import type {
  JellyfinConfig, UserDto, QueryResult, BaseItemDto,
  PlaylistCreationResult, RecommendationDto, SimilarItemResult, PluginInfo, DeviceInfo,
  BrandingOptions, ServerConfiguration, ItemCounts, ApiKeyInfo, NotificationTypeInfo,
  NotificationResult, DisplayPreferences, QueryFilters,
  RemoteImageInfo, ExternalIdInfo, ThemeMediaResult, RemoteSubtitleInfo, MediaSegment,
  LyricsInfo, CreateUserDto, UpdateUserPasswordDto, RemoteSearchResult,
  RemoteSearchQuery, UserView, UserViewGroupingOption, UtcTimeResponse,
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
import { DashboardApi, type DashboardConfigurationPageInfo } from './dashboard.js';
import { LiveTvApi, type LiveTvTimerParams, type LiveTvSeriesTimerParams, type TunerHostInfo, type ListingProviderInfo } from './livetv.js';
import { SyncPlayApi } from './syncplay.js';
import { PluginsExtApi } from './plugins-ext.js';
import { JellyfinApiError, type ChapterInfo, type PlaybackInfoResponse } from './core-api.js';
export { JellyfinApiError } from './core-api.js';
export type { ChapterInfo, PlaybackInfoResponse, PackageInfo, ItemImageInfo, ChannelFeatures, LiveTvTimerParams, LiveTvSeriesTimerParams, TunerHostInfo, ListingProviderInfo };
/**
 * Provides jellyfin api client behavior for the Jellyfin client and command runtime.
 */
export class JellyfinApiClient extends JellyfinExtensions {
  private tvshows: TvShowsApi;
  private packages: PackagesApi;
  private images: ImagesApi;
  private suggestions: SuggestionsApi;
  private years: YearsApi;
  private musicGenres: MusicGenresApi;
  private trickplay: TrickplayApi;
  private channels: ChannelsApi;
  private dashboard: DashboardApi;
  public livetv: LiveTvApi;
  public syncplay: SyncPlayApi;
  public pluginsExt: PluginsExtApi;
  /**
   * Creates an instance with the collaborators required by its runtime behavior.
   * @param config - The resolved Jellyfin client configuration.
   */
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
    this.dashboard = new DashboardApi(config);
    this.livetv = new LiveTvApi(config);
    this.syncplay = new SyncPlayApi(config);
    this.pluginsExt = new PluginsExtApi(config);
  }
  /**
   * Performs the set user id operation through the typed Jellyfin API boundary.
   * @param userId - The stable Jellyfin user identifier.
   */
  setUserId(userId: string): void { super.setUserId(userId); this.syncModules(); }
  /**
   * Authenticates a user and propagates the resulting token and user ID to every API module.
   * @param username - The Jellyfin username.
   * @param password - The user's plain-text password sent only to the configured server.
   * @returns The authenticated Jellyfin user.
   */
  async authenticate(username: string, password: string): Promise<UserDto> {
    const user = await super.authenticate(username, password);
    this.syncModules();
    return user;
  }
  private syncModules(): void { const cfg = { serverUrl: this.getBackendUrl(), apiKey: this.apiKey, userId: this.getUserId(), timeout: this.timeout }; this.tvshows = new TvShowsApi(cfg); this.packages = new PackagesApi(cfg); this.images = new ImagesApi(cfg); this.suggestions = new SuggestionsApi(cfg); this.years = new YearsApi(cfg); this.musicGenres = new MusicGenresApi(cfg); this.trickplay = new TrickplayApi(cfg); this.channels = new ChannelsApi(cfg); this.dashboard = new DashboardApi(cfg); this.livetv = new LiveTvApi(cfg); this.syncplay = new SyncPlayApi(cfg); this.pluginsExt = new PluginsExtApi(cfg); }
  // TV Shows
  /**
   * Retrieves or derives episodes without mutating Jellyfin state.
   * @param seriesId - The series id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.seasonId - The season id value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.season - The season value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.isMissing - The is missing value required by this operation.
   * @param params.sortBy - The sort by value required by this operation.
   * @returns - The normalized string representation.
   */
  async getEpisodes(seriesId: string, params?: { seasonId?: string; userId?: string; season?: number; limit?: number; startIndex?: number; isMissing?: boolean; sortBy?: string }): Promise<QueryResult<BaseItemDto>> { return this.tvshows.getEpisodes(seriesId, params); }
  /**
   * Retrieves or derives seasons without mutating Jellyfin state.
   * @param seriesId - The series id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.isSpecialSeason - The is special season value required by this operation.
   * @returns - The normalized string representation.
   */
  async getSeasons(seriesId: string, params?: { userId?: string; isSpecialSeason?: boolean }): Promise<QueryResult<BaseItemDto>> { return this.tvshows.getSeasons(seriesId, params); }
  /**
   * Retrieves or derives next up episodes without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.seriesId - The series id value required by this operation.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @returns - The typed get next up episodes result.
   */
  async getNextUpEpisodes(params?: { userId?: string; seriesId?: string; parentId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { return this.tvshows.getNextUpEpisodes(params); }
  /**
   * Retrieves or derives upcoming episodes without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @returns - The typed get upcoming episodes result.
   */
  async getUpcomingEpisodes(params?: { userId?: string; parentId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { return this.tvshows.getUpcomingEpisodes(params); }
  /**
   * Retrieves or derives similar shows without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getSimilarShows(itemId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { return this.tvshows.getSimilarShows(itemId, params); }
  // Packages
  /**
   * Retrieves or derives packages without mutating Jellyfin state.
   * @returns - The typed get packages result.
   */
  async getPackages(): Promise<PackageInfo[]> { return this.packages.getPackages(); }
  /**
   * Retrieves or derives package info without mutating Jellyfin state.
   * @param packageId - The package id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getPackageInfo(packageId: string): Promise<PackageInfo> { return this.packages.getPackageInfo(packageId); }
  /**
   * Implements install package for the typed Jellyfin CLI runtime.
   * @param packageId - The package id value required by this operation.
   * @param version - The version value required by this operation.
   * @param repositoryUrl - The repository url value required by this operation.
   * @returns A promise that resolves after Jellyfin queues the package installation.
   */
  async installPackage(packageId: string, version?: string, repositoryUrl?: string): Promise<void> { return this.packages.installPackage(packageId, version, repositoryUrl); }
  /**
   * Performs the cancel package installation operation through the typed Jellyfin API boundary.
   * @param installationId - The installation id value required by this operation.
   * @returns A promise that resolves after Jellyfin cancels the package installation.
   */
  async cancelPackageInstallation(installationId: string): Promise<void> { return this.packages.cancelPackageInstallation(installationId); }
  /**
   * Retrieves or derives repositories without mutating Jellyfin state.
   * @returns - The typed get repositories result.
   */
  async getRepositories() { return this.packages.getRepositories(); }
  /**
   * Performs the set repositories operation through the typed Jellyfin API boundary.
   * @param repositories - The repositories value required by this operation.
   * @returns - The typed set repositories result.
   */
  async setRepositories(repositories: { Name?: string; Url?: string; Enabled?: boolean }[]): Promise<void> { return this.packages.setRepositories(repositories); }
  /**
   * Retrieves or derives installing packages without mutating Jellyfin state.
   * @returns - The typed get installing packages result.
   */
  async getInstallingPackages() { return this.packages.getInstallingPackages(); }
  // Images
  /**
   * Retrieves or derives item images without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getItemImages(itemId: string): Promise<ItemImageInfo[]> { return this.images.getItemImages(itemId); }
  /**
   * Retrieves or derives item image without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.quality - The quality value required by this operation.
   * @param params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
  getItemImage(itemId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; quality?: number; imageIndex?: number }): string { return this.images.getItemImage(itemId, imageType, params); }
  /**
   * Retrieves or derives artist image without mutating Jellyfin state.
   * @param artistId - The artist id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.tag - The tag value required by this operation.
   * @param params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
  getArtistImage(artistId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string; imageIndex?: number }): string { return this.images.getArtistImage(artistId, imageType, params); }
  /**
   * Retrieves or derives genre image without mutating Jellyfin state.
   * @param genreId - The genre id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.tag - The tag value required by this operation.
   * @param params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
  getGenreImage(genreId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string; imageIndex?: number }): string { return this.images.getGenreImage(genreId, imageType, params); }
  /**
   * Retrieves or derives music genre image without mutating Jellyfin state.
   * @param musicGenreId - The music genre id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.tag - The tag value required by this operation.
   * @param params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
  getMusicGenreImage(musicGenreId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string; imageIndex?: number }): string { return this.images.getMusicGenreImage(musicGenreId, imageType, params); }
  /**
   * Retrieves or derives person image without mutating Jellyfin state.
   * @param personId - The person id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.tag - The tag value required by this operation.
   * @param params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
  getPersonImage(personId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string; imageIndex?: number }): string { return this.images.getPersonImage(personId, imageType, params); }
  /**
   * Retrieves or derives studio image without mutating Jellyfin state.
   * @param studioId - The studio id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.tag - The tag value required by this operation.
   * @param params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
  getStudioImage(studioId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string; imageIndex?: number }): string { return this.images.getStudioImage(studioId, imageType, params); }
  /**
   * Performs the delete item image operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param imageIndex - The image index value required by this operation.
   * @returns A promise that resolves after Jellyfin deletes the selected image.
   */
  async deleteItemImage(itemId: string, imageType: string, imageIndex?: number): Promise<void> { return this.images.deleteItemImage(itemId, imageType, imageIndex); }
  /**
   * Performs the delete user image operation through the typed Jellyfin API boundary.
   * @param userId - The stable Jellyfin user identifier.
   * @param imageType - The image type value required by this operation.
   * @returns A promise that resolves after Jellyfin deletes the selected user image.
   */
  async deleteUserImage(userId: string, imageType: string): Promise<void> { return this.images.deleteUserImage(userId, imageType); }
  /**
   * Retrieves or derives user image without mutating Jellyfin state.
   * @param userId - The stable Jellyfin user identifier.
   * @param imageType - The image type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
  getUserImage(userId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; imageIndex?: number }): string { return this.images.getUserImage(userId, imageType, params); }
  // Suggestions / Years / Music / Trickplay / Channels
  /**
   * Retrieves or derives suggestions without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @returns - The typed get suggestions result.
   */
  async getSuggestions(params?: { userId?: string; parentId?: string; limit?: number }): Promise<BaseItemDto[]> { return this.suggestions.getSuggestions(params); }
  /**
   * Retrieves or derives years without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.sortBy - The sort by value required by this operation.
   * @param params.sortOrder - The sort order value required by this operation.
   * @returns - The typed get years result.
   */
  async getYears(params?: { userId?: string; parentId?: string; limit?: number; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> { return this.years.getYears(params); }
  /**
   * Retrieves or derives year without mutating Jellyfin state.
   * @param year - The year value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @returns - The typed get year result.
   */
  async getYear(year: number, params?: { userId?: string }): Promise<BaseItemDto> { return this.years.getYear(year, params); }
  /**
   * Retrieves or derives music genres without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.sortBy - The sort by value required by this operation.
   * @param params.sortOrder - The sort order value required by this operation.
   * @returns - The typed get music genres result.
   */
  async getMusicGenres(params?: { userId?: string; parentId?: string; limit?: number; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> { return this.musicGenres.getMusicGenres(params); }
  /**
   * Retrieves or derives music genre without mutating Jellyfin state.
   * @param name - The name value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getMusicGenre(name: string, params?: { userId?: string }): Promise<BaseItemDto> { return this.musicGenres.getMusicGenre(name, params); }
  /**
   * Retrieves or derives trickplay hls playlist url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param width - The width value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @returns - The normalized string representation.
   */
  getTrickplayHlsPlaylistUrl(itemId: string, width: number, params?: { mediaSourceId?: string }): string { return this.trickplay.getTrickplayHlsPlaylistUrl(itemId, width, params); }
  /**
   * Retrieves or derives trickplay tile image url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param width - The width value required by this operation.
   * @param index - The index value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @returns - The normalized string representation.
   */
  getTrickplayTileImageUrl(itemId: string, width: number, index: number, params?: { mediaSourceId?: string }): string { return this.trickplay.getTrickplayTileImageUrl(itemId, width, index, params); }
  /**
   * Retrieves or derives channels without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @param params.supportsLatestItems - The supports latest items value required by this operation.
   * @returns - The typed get channels result.
   */
  async getChannels(params?: { userId?: string; limit?: number; supportsLatestItems?: boolean }): Promise<QueryResult<BaseItemDto>> { return this.channels.getChannels(params); }
  /**
   * Retrieves or derives all channel features without mutating Jellyfin state.
   * @returns - The typed get all channel features result.
   */
  async getAllChannelFeatures(): Promise<ChannelFeatures[]> { return this.channels.getAllChannelFeatures(); }
  /**
   * Retrieves or derives channel features without mutating Jellyfin state.
   * @param channelId - The channel id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getChannelFeatures(channelId: string): Promise<ChannelFeatures> { return this.channels.getChannelFeatures(channelId); }
  /**
   * Retrieves or derives channel items without mutating Jellyfin state.
   * @param channelId - The channel id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.folderId - The folder id value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.sortBy - The sort by value required by this operation.
   * @param params.sortOrder - The sort order value required by this operation.
   * @returns - The normalized string representation.
   */
  async getChannelItems(channelId: string, params?: { folderId?: string; userId?: string; limit?: number; startIndex?: number; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> { return this.channels.getChannelItems(channelId, params); }
  /**
   * Retrieves or derives latest channel items without mutating Jellyfin state.
   * @param channelId - The channel id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getLatestChannelItems(channelId: string, userId?: string, limit?: number): Promise<BaseItemDto[]> { return this.channels.getLatestChannelItems(channelId, { userId, limit }); }
  // Dashboard
  /**
   * Retrieves or derives dashboard configuration pages without mutating Jellyfin state.
   * @param enableInMainMenu - The enable in main menu value required by this operation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async getDashboardConfigurationPages(enableInMainMenu?: boolean): Promise<DashboardConfigurationPageInfo[]> {
    return this.dashboard.getConfigurationPages(enableInMainMenu);
  }
  /**
   * Retrieves or derives dashboard configuration page without mutating Jellyfin state.
   * @param name - The name value required by this operation.
   * @returns - The normalized string representation.
   */
  async getDashboardConfigurationPage(name: string): Promise<string> {
    return this.dashboard.getConfigurationPage(name);
  }
  // Live TV
  /**
   * Retrieves or derives live tv info without mutating Jellyfin state.
   * @returns - The typed get live tv info result.
   */
  async getLiveTvInfo() { return this.livetv.getLiveTvInfo(); }
  /**
   * Retrieves or derives live tv channels without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @returns - The typed get live tv channels result.
   */
  async getLiveTvChannels(params?: Parameters<LiveTvApi['getLiveTvChannels']>[0]) { return this.livetv.getLiveTvChannels(params); }
  /**
   * Retrieves or derives live tv channel without mutating Jellyfin state.
   * @param channelId - The channel id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getLiveTvChannel(channelId: string, userId?: string) { return this.livetv.getLiveTvChannel(channelId, userId); }
  /**
   * Retrieves or derives live tv programs without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @returns - The typed get live tv programs result.
   */
  async getLiveTvPrograms(params?: Parameters<LiveTvApi['getLiveTvPrograms']>[0]) { return this.livetv.getLiveTvPrograms(params); }
  /**
   * Retrieves or derives live tv program without mutating Jellyfin state.
   * @param programId - The program id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getLiveTvProgram(programId: string, userId?: string) { return this.livetv.getLiveTvProgram(programId, userId); }
  /**
   * Retrieves or derives live tv recordings without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @returns - The typed get live tv recordings result.
   */
  async getLiveTvRecordings(params?: Parameters<LiveTvApi['getLiveTvRecordings']>[0]) { return this.livetv.getLiveTvRecordings(params); }
  /**
   * Retrieves or derives live tv timer without mutating Jellyfin state.
   * @param id - The id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getLiveTvTimer(id: string) { return this.livetv.getLiveTvTimer(id); }
  /**
   * Retrieves or derives live tv timers without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @returns - The typed get live tv timers result.
   */
  async getLiveTvTimers(params?: Parameters<LiveTvApi['getLiveTvTimers']>[0]) { return this.livetv.getLiveTvTimers(params); }
  /**
   * Performs the create live tv timer operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @returns - The typed create live tv timer result.
   */
  async createLiveTvTimer(params: LiveTvTimerParams) { return this.livetv.createLiveTvTimer(params); }
  /**
   * Performs the update live tv timer operation through the typed Jellyfin API boundary.
   * @param id - The id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @returns - The normalized string representation.
   */
  async updateLiveTvTimer(id: string, params: LiveTvTimerParams) { return this.livetv.updateLiveTvTimer(id, params); }
  /**
   * Performs the delete live tv timer operation through the typed Jellyfin API boundary.
   * @param id - The id value required by this operation.
   * @returns - The normalized string representation.
   */
  async deleteLiveTvTimer(id: string) { return this.livetv.deleteLiveTvTimer(id); }
  /**
   * Retrieves or derives live tv series timers without mutating Jellyfin state.
   * @returns - The typed get live tv series timers result.
   */
  async getLiveTvSeriesTimers() { return this.livetv.getLiveTvSeriesTimers(); }
  /**
   * Retrieves or derives live tv series timer without mutating Jellyfin state.
   * @param id - The id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getLiveTvSeriesTimer(id: string) { return this.livetv.getLiveTvSeriesTimer(id); }
  /**
   * Performs the create live tv series timer operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @returns - The typed create live tv series timer result.
   */
  async createLiveTvSeriesTimer(params: LiveTvSeriesTimerParams) { return this.livetv.createLiveTvSeriesTimer(params); }
  /**
   * Performs the delete live tv series timer operation through the typed Jellyfin API boundary.
   * @param id - The id value required by this operation.
   * @returns - The normalized string representation.
   */
  async deleteLiveTvSeriesTimer(id: string) { return this.livetv.deleteLiveTvSeriesTimer(id); }
  /**
   * Retrieves or derives live tv guide info without mutating Jellyfin state.
   * @returns - The typed get live tv guide info result.
   */
  async getLiveTvGuideInfo() { return this.livetv.getLiveTvGuideInfo(); }
  /**
   * Retrieves or derives live tv recommended programs without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @returns - The typed get live tv recommended programs result.
   */
  async getLiveTvRecommendedPrograms(params?: Parameters<LiveTvApi['getLiveTvRecommendedPrograms']>[0]) { return this.livetv.getLiveTvRecommendedPrograms(params); }
  /**
   * Retrieves or derives live tv recording folders without mutating Jellyfin state.
   * @returns - The typed get live tv recording folders result.
   */
  async getLiveTvRecordingFolders() { return this.livetv.getLiveTvRecordingFolders(); }
  /**
   * Retrieves or derives live tv recording groups without mutating Jellyfin state.
   * @returns - The typed get live tv recording groups result.
   */
  async getLiveTvRecordingGroups() { return this.livetv.getLiveTvRecordingGroups(); }
  /**
   * Retrieves or derives live tv recording by id without mutating Jellyfin state.
   * @param id - The id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getLiveTvRecordingById(id: string) { return this.livetv.getLiveTvRecordingById(id); }
  /**
   * Performs the delete live tv recording operation through the typed Jellyfin API boundary.
   * @param id - The id value required by this operation.
   * @returns - The normalized string representation.
   */
  async deleteLiveTvRecording(id: string) { return this.livetv.deleteLiveTvRecording(id); }
  /**
   * Implements discover tuners for the typed Jellyfin CLI runtime.
   * @returns - The typed discover tuners result.
   */
  async discoverTuners() { return this.livetv.discoverTuners(); }
  /**
   * Retrieves or derives tuner host types without mutating Jellyfin state.
   * @returns - The typed get tuner host types result.
   */
  async getTunerHostTypes() { return this.livetv.getTunerHostTypes(); }
  /**
   * Retrieves or derives schedules direct countries without mutating Jellyfin state.
   * @returns - The typed get schedules direct countries result.
   */
  async getSchedulesDirectCountries() { return this.livetv.getSchedulesDirectCountries(); }
  // SyncPlay
  /**
   * Retrieves or derives sync play groups without mutating Jellyfin state.
   * @returns - The typed get sync play groups result.
   */
  async getSyncPlayGroups() { return this.syncplay.getGroups(); }
  /**
   * Implements sync play create for the typed Jellyfin CLI runtime.
   * @param groupName - The group name value required by this operation.
   * @returns - The normalized string representation.
   */
  async syncPlayCreate(groupName?: string) { return this.syncplay.createGroup(groupName ? { GroupName: groupName } : undefined); }
  /**
   * Implements sync play get group for the typed Jellyfin CLI runtime.
   * @param groupId - The group id value required by this operation.
   * @returns - The normalized string representation.
   */
  async syncPlayGetGroup(groupId: string) { return this.syncplay.getGroup(groupId); }
  /**
   * Implements sync play join for the typed Jellyfin CLI runtime.
   * @param groupId - The group id value required by this operation.
   * @returns - The normalized string representation.
   */
  async syncPlayJoin(groupId: string) { return this.syncplay.joinGroup(groupId); }
  /**
   * Implements sync play leave for the typed Jellyfin CLI runtime.
   * @returns - The typed sync play leave result.
   */
  async syncPlayLeave() { return this.syncplay.leaveGroup(); }
  /**
   * Implements sync play pause for the typed Jellyfin CLI runtime.
   * @returns - The typed sync play pause result.
   */
  async syncPlayPause() { return this.syncplay.pauseGroup(); }
  /**
   * Implements sync play unpause for the typed Jellyfin CLI runtime.
   * @returns - The typed sync play unpause result.
   */
  async syncPlayUnpause() { return this.syncplay.unpauseGroup(); }
  /**
   * Implements sync play stop for the typed Jellyfin CLI runtime.
   * @returns - The typed sync play stop result.
   */
  async syncPlayStop() { return this.syncplay.stopGroup(); }
  /**
   * Implements sync play seek for the typed Jellyfin CLI runtime.
   * @param positionTicks - The position ticks value required by this operation.
   * @returns - The typed sync play seek result.
   */
  async syncPlaySeek(positionTicks: number) { return this.syncplay.seekGroup(positionTicks); }
  /**
   * Implements sync play next item for the typed Jellyfin CLI runtime.
   * @param playlistItemId - The playlist item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async syncPlayNextItem(playlistItemId?: string) { return this.syncplay.nextItem(playlistItemId ? { PlaylistItemId: playlistItemId } : undefined); }
  /**
   * Implements sync play previous item for the typed Jellyfin CLI runtime.
   * @param playlistItemId - The playlist item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async syncPlayPreviousItem(playlistItemId?: string) { return this.syncplay.previousItem(playlistItemId ? { PlaylistItemId: playlistItemId } : undefined); }
  /**
   * Implements sync play set repeat mode for the typed Jellyfin CLI runtime.
   * @param mode - The mode value required by this operation.
   * @returns - The normalized string representation.
   */
  async syncPlaySetRepeatMode(mode: string) { return this.syncplay.setRepeatMode(mode); }
  /**
   * Implements sync play set shuffle mode for the typed Jellyfin CLI runtime.
   * @param mode - The mode value required by this operation.
   * @returns - The normalized string representation.
   */
  async syncPlaySetShuffleMode(mode: string) { return this.syncplay.setShuffleMode(mode); }
  /**
   * Implements sync play queue for the typed Jellyfin CLI runtime.
   * @param itemIds - The item ids value required by this operation.
   * @returns - The normalized string representation.
   */
  async syncPlayQueue(itemIds: string[]) { return this.syncplay.queueItems(itemIds); }
  /**
   * Implements sync play set new queue for the typed Jellyfin CLI runtime.
   * @param itemIds - The item ids value required by this operation.
   * @param startPositionTicks - The start position ticks value required by this operation.
   * @returns - The normalized string representation.
   */
  async syncPlaySetNewQueue(itemIds: string[], startPositionTicks?: number) { return this.syncplay.setNewQueue({ ItemIds: itemIds, StartPositionTicks: startPositionTicks }); }
  /**
   * Implements sync play remove from playlist for the typed Jellyfin CLI runtime.
   * @param playlistItemIds - The playlist item ids value required by this operation.
   * @returns - The normalized string representation.
   */
  async syncPlayRemoveFromPlaylist(playlistItemIds: string[]) { return this.syncplay.removeFromPlaylist(playlistItemIds); }
  /**
   * Implements sync play move playlist item for the typed Jellyfin CLI runtime.
   * @param playlistItemId - The playlist item id value required by this operation.
   * @param newIndex - The new index value required by this operation.
   * @returns - The normalized string representation.
   */
  async syncPlayMovePlaylistItem(playlistItemId: string, newIndex: number) { return this.syncplay.movePlaylistItem(playlistItemId, newIndex); }
  /**
   * Implements sync play set playlist item for the typed Jellyfin CLI runtime.
   * @param playlistItemId - The playlist item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async syncPlaySetPlaylistItem(playlistItemId: string) { return this.syncplay.setPlaylistItem(playlistItemId); }
  /**
   * Implements sync play ping for the typed Jellyfin CLI runtime.
   * @param ping - The ping value required by this operation.
   * @returns - The typed sync play ping result.
   */
  async syncPlayPing(ping: number) { return this.syncplay.updatePing(ping); }
  /**
   * Implements sync play buffering for the typed Jellyfin CLI runtime.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @returns - The typed sync play buffering result.
   */
  async syncPlayBuffering(params?: Parameters<SyncPlayApi['reportBuffering']>[0]) { return this.syncplay.reportBuffering(params); }
  /**
   * Implements sync play ready for the typed Jellyfin CLI runtime.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @returns - The typed sync play ready result.
   */
  async syncPlayReady(params?: Parameters<SyncPlayApi['reportReady']>[0]) { return this.syncplay.reportReady(params); }
  /**
   * Implements sync play set ignore wait for the typed Jellyfin CLI runtime.
   * @param ignoreWait - The ignore wait value required by this operation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async syncPlaySetIgnoreWait(ignoreWait: boolean) { return this.syncplay.setIgnoreWait(ignoreWait); }
  // Playlists
  /**
   * Performs the create playlist operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.name - The name value required by this operation.
   * @param params.ids - The ids value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.mediaType - The media type value required by this operation.
   * @returns - The typed create playlist result.
   */
  async createPlaylist(params: { name: string; ids?: string[]; userId?: string; mediaType?: string }): Promise<PlaylistCreationResult> { const userId = params.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<PlaylistCreationResult>('POST', '/Playlists', { ...params, userId, ids: params.ids?.join(',') }); }
  /**
   * Performs the add to playlist operation through the typed Jellyfin API boundary.
   * @param playlistId - The playlist id value required by this operation.
   * @param ids - The ids value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   */
  async addToPlaylist(playlistId: string, ids: string[], userId?: string): Promise<void> { await this.request<void>('POST', `/Playlists/${playlistId}/Items`, { ids: ids.join(','), userId: userId ?? this.userId }); }
  /**
   * Performs the remove from playlist operation through the typed Jellyfin API boundary.
   * @param playlistId - The playlist id value required by this operation.
   * @param entryIds - The entry ids value required by this operation.
   */
  async removeFromPlaylist(playlistId: string, entryIds: string[]): Promise<void> { await this.request<void>('DELETE', `/Playlists/${playlistId}/Items`, { entryIds: entryIds.join(',') }); }
  /**
   * Retrieves or derives playlist items without mutating Jellyfin state.
   * @param playlistId - The playlist id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getPlaylistItems(playlistId: string, params?: { userId?: string; startIndex?: number; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', `/Playlists/${playlistId}/Items`, { ...params, userId }); }
  /**
   * Performs the delete playlist operation through the typed Jellyfin API boundary.
   * @param playlistId - The playlist id value required by this operation.
   */
  async deletePlaylist(playlistId: string): Promise<void> { await this.request<void>('DELETE', `/Playlists/${playlistId}`); }
  /**
   * Retrieves or derives playlist without mutating Jellyfin state.
   * @param playlistId - The playlist id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getPlaylist(playlistId: string): Promise<BaseItemDto> { return this.request<BaseItemDto>('GET', `/Playlists/${playlistId}`); }
  /**
   * Performs the update playlist operation through the typed Jellyfin API boundary.
   * @param playlistId - The playlist id value required by this operation.
   * @param data - The typed payload to format or submit.
   * @param data.Name - The name value required by this operation.
   * @param data.Ids - The ids value required by this operation.
   * @param data.UserId - The user id value required by this operation.
   * @returns - The normalized string representation.
   */
  async updatePlaylist(playlistId: string, data: { Name?: string; Ids?: string[]; UserId?: string }): Promise<void> { await this.request<void>('POST', `/Playlists/${playlistId}`, undefined, data); }
  /**
   * Retrieves or derives playlist users without mutating Jellyfin state.
   * @param playlistId - The playlist id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getPlaylistUsers(playlistId: string): Promise<{ UserId?: string; CanEdit?: boolean }[]> { return this.request<{ UserId?: string; CanEdit?: boolean }[]>('GET', `/Playlists/${playlistId}/Users`); }
  /**
   * Performs the set playlist user access operation through the typed Jellyfin API boundary.
   * @param playlistId - The playlist id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param canEdit - The can edit value required by this operation.
   */
  async setPlaylistUserAccess(playlistId: string, userId: string, canEdit: boolean): Promise<void> { await this.request<void>('POST', `/Playlists/${playlistId}/Users/${userId}`, undefined, { UserId: userId, CanEdit: canEdit }); }
  /**
   * Performs the remove playlist user access operation through the typed Jellyfin API boundary.
   * @param playlistId - The playlist id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   */
  async removePlaylistUserAccess(playlistId: string, userId: string): Promise<void> { await this.request<void>('DELETE', `/Playlists/${playlistId}/Users/${userId}`); }
  /**
   * Implements move playlist item for the typed Jellyfin CLI runtime.
   * @param playlistId - The playlist id value required by this operation.
   * @param itemId - The item id value required by this operation.
   * @param newIndex - The new index value required by this operation.
   */
  async movePlaylistItem(playlistId: string, itemId: string, newIndex: number): Promise<void> { await this.request<void>('POST', `/Playlists/${playlistId}/Items/${itemId}/Move/${newIndex}`); }
  /**
   * Retrieves or derives playlist instant mix without mutating Jellyfin state.
   * @param playlistId - The playlist id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getPlaylistInstantMix(playlistId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', `/Playlists/${playlistId}/InstantMix`, { ...params, userId }); }
  // Favorites & User Data
  /**
   * Implements mark favorite for the typed Jellyfin CLI runtime.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async markFavorite(itemId: string, userId?: string): Promise<{ IsFavorite?: boolean }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ IsFavorite?: boolean }>('POST', `/UserFavoriteItems/${itemId}`, { userId: uid }); }
  /**
   * Implements unmark favorite for the typed Jellyfin CLI runtime.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async unmarkFavorite(itemId: string, userId?: string): Promise<{ IsFavorite?: boolean }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ IsFavorite?: boolean }>('DELETE', `/UserFavoriteItems/${itemId}`, { userId: uid }); }
  /**
   * Implements mark played for the typed Jellyfin CLI runtime.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param datePlayed - The date played value required by this operation.
   * @returns - The normalized string representation.
   */
  async markPlayed(itemId: string, userId?: string, datePlayed?: string): Promise<{ Played?: boolean }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ Played?: boolean }>('POST', `/UserPlayedItems/${itemId}`, { userId: uid, datePlayed }); }
  /**
   * Implements unmark played for the typed Jellyfin CLI runtime.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async unmarkPlayed(itemId: string, userId?: string): Promise<{ Played?: boolean }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ Played?: boolean }>('DELETE', `/UserPlayedItems/${itemId}`, { userId: uid }); }
  /**
   * Performs the update user item rating operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param likes - The likes value required by this operation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async updateUserItemRating(itemId: string, userId?: string, likes?: boolean): Promise<{ Played?: boolean }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ Played?: boolean }>('POST', `/UserItems/${itemId}/Rating`, { userId: uid, likes }); }
  /**
   * Performs the delete user item rating operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async deleteUserItemRating(itemId: string, userId?: string): Promise<{ Played?: boolean }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ Played?: boolean }>('DELETE', `/UserItems/${itemId}/Rating`, { userId: uid }); }
  /**
   * Retrieves or derives user item data without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getUserItemData(itemId: string, userId?: string): Promise<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; LastPlayedDate?: string; PlaybackPositionTicks?: number; Rating?: number }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; LastPlayedDate?: string; PlaybackPositionTicks?: number; Rating?: number }>('GET', `/UserItems/${itemId}/UserData`, { userId: uid }); }
  /**
   * Performs the update user item data operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param data - The typed payload to format or submit.
   * @param data.IsFavorite - The is favorite value required by this operation.
   * @param data.Played - The played value required by this operation.
   * @param data.PlayCount - The play count value required by this operation.
   * @param data.PlaybackPositionTicks - The playback position ticks value required by this operation.
   * @param data.Rating - The rating value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async updateUserItemData(itemId: string, data: { IsFavorite?: boolean; Played?: boolean; PlayCount?: number; PlaybackPositionTicks?: number; Rating?: number }, userId?: string): Promise<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; PlaybackPositionTicks?: number; Rating?: number }> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; PlaybackPositionTicks?: number; Rating?: number }>('POST', `/UserItems/${itemId}/UserData`, { userId: uid }, data); }
  // Library Browsing
  /**
   * Retrieves or derives genres without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @returns - The typed get genres result.
   */
  async getGenres(params?: { parentId?: string; userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', '/Genres', { ...params, userId }); }
  /**
   * Retrieves or derives studios without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @returns - The typed get studios result.
   */
  async getStudios(params?: { parentId?: string; userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', '/Studios', { ...params, userId }); }
  /**
   * Retrieves or derives persons without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @returns - The typed get persons result.
   */
  async getPersons(params?: { parentId?: string; userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', '/Persons', { ...params, userId }); }
  /**
   * Retrieves or derives artists without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @param params.sortBy - The sort by value required by this operation.
   * @param params.sortOrder - The sort order value required by this operation.
   * @returns - The typed get artists result.
   */
  async getArtists(params?: { parentId?: string; userId?: string; limit?: number; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<QueryResult<BaseItemDto>>('GET', '/Artists', { ...params, userId }); }
  /**
   * Retrieves or derives album artists without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @param params.sortBy - The sort by value required by this operation.
   * @param params.sortOrder - The sort order value required by this operation.
   * @returns - The typed get album artists result.
   */
  async getAlbumArtists(params?: { parentId?: string; userId?: string; limit?: number; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<QueryResult<BaseItemDto>>('GET', '/Artists/AlbumArtists', { ...params, userId }); }
  // Items
  /**
   * Retrieves or derives similar items without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getSimilarItems(itemId: string, params?: { userId?: string; limit?: number }): Promise<SimilarItemResult> { const userId = params?.userId ?? this.userId; return this.request<SimilarItemResult>('GET', `/Items/${itemId}/Similar`, { ...params, userId }); }
  /**
   * Retrieves or derives recommendations without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.categoryLimit - The category limit value required by this operation.
   * @param params.itemLimit - The item limit value required by this operation.
   * @returns - The typed get recommendations result.
   */
  async getRecommendations(params?: { userId?: string; categoryLimit?: number; itemLimit?: number }): Promise<RecommendationDto[]> { const userId = params?.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<RecommendationDto[]>('GET', '/Movies/Recommendations', { userId, categoryLimit: params?.categoryLimit, itemLimit: params?.itemLimit }); }
  /**
   * Retrieves or derives instant mix without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getInstantMix(itemId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; if (!userId) throw new JellyfinApiError('User ID required'); return this.request<QueryResult<BaseItemDto>>('GET', `/Items/${itemId}/InstantMix`, { ...params, userId }); }
  /**
   * Retrieves or derives trailers without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.sortBy - The sort by value required by this operation.
   * @returns - The typed get trailers result.
   */
  async getTrailers(params?: { userId?: string; limit?: number; startIndex?: number; sortBy?: string }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', '/Trailers', { ...params, userId }); }
  /**
   * Retrieves or derives critic reviews without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getCriticReviews(itemId: string): Promise<QueryResult<{ Body?: string; Date?: string; IsNegative?: boolean; ReviewerName?: string; Url?: string }>> { return this.request<QueryResult<{ Body?: string; Date?: string; IsNegative?: boolean; ReviewerName?: string; Url?: string }>>('GET', `/Items/${itemId}/CriticReviews`); }
  /**
   * Retrieves or derives item root folder without mutating Jellyfin state.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getItemRootFolder(userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<BaseItemDto>('GET', `/Users/${uid}/Items/Root`); }
  /**
   * Performs the set item content type operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param contentType - The content type value required by this operation.
   */
  async setItemContentType(itemId: string, contentType: string): Promise<void> { await this.request<void>('POST', `/Items/${itemId}/ContentType`, { contentType }); }
  /**
   * Retrieves or derives album instant mix without mutating Jellyfin state.
   * @param albumId - The album id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getAlbumInstantMix(albumId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', `/Albums/${albumId}/InstantMix`, { ...params, userId }); }
  /**
   * Retrieves or derives song instant mix without mutating Jellyfin state.
   * @param songId - The song id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getSongInstantMix(songId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', `/Songs/${songId}/InstantMix`, { ...params, userId }); }
  /**
   * Retrieves or derives artist instant mix without mutating Jellyfin state.
   * @param artistId - The artist id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getArtistInstantMix(artistId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', `/Artists/${artistId}/InstantMix`, { ...params, userId }); }
  /**
   * Retrieves or derives music genre instant mix without mutating Jellyfin state.
   * @param genreName - The genre name value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getMusicGenreInstantMix(genreName: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> { const userId = params?.userId ?? this.userId; return this.request<QueryResult<BaseItemDto>>('GET', `/MusicGenres/${encodeURIComponent(genreName)}/InstantMix`, { ...params, userId }); }
  /**
   * Retrieves or derives intros without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getIntros(itemId: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/Intros`); }
  /**
   * Retrieves or derives additional parts without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getAdditionalParts(itemId: string): Promise<QueryResult<BaseItemDto>> { return this.request<QueryResult<BaseItemDto>>('GET', `/Videos/${itemId}/AdditionalParts`); }
  /**
   * Retrieves or derives chapters without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getChapters(itemId: string): Promise<ChapterInfo[]> { return this.request<ChapterInfo[]>('GET', `/Items/${itemId}/Chapters`); }
  /**
   * Retrieves or derives special features without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getSpecialFeatures(itemId: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/SpecialFeatures`); }
  /**
   * Retrieves or derives local trailers without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getLocalTrailers(itemId: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/LocalTrailers`); }
  /**
   * Retrieves or derives ancestors without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getAncestors(itemId: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', `/Items/${itemId}/Ancestors`); }
  /**
   * Retrieves or derives items by path without mutating Jellyfin state.
   * @param path - The API, command, or filesystem path to process.
   * @returns - The normalized string representation.
   */
  async getItemsByPath(path: string): Promise<BaseItemDto[]> { return this.request<BaseItemDto[]>('GET', '/Items/ByPath', { path }); }
  /**
   * Retrieves or derives playback info without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getPlaybackInfo(itemId: string, userId?: string): Promise<PlaybackInfoResponse> { const uid = userId ?? this.userId; return this.request<PlaybackInfoResponse>('GET', `/Items/${itemId}/PlaybackInfo`, { userId: uid }); }
  /**
   * Retrieves or derives item counts without mutating Jellyfin state.
   * @returns - The typed get item counts result.
   */
  async getItemCounts(): Promise<ItemCounts> { return this.request<ItemCounts>('GET', '/Items/Counts'); }
  /**
   * Retrieves or derives query filters without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.includeItemTypes - The include item types value required by this operation.
   * @returns - The typed get query filters result.
   */
  async getQueryFilters(params?: { userId?: string; parentId?: string; includeItemTypes?: string[] }): Promise<QueryFilters> { return this.request<QueryFilters>('GET', '/Items/Filters', params as Record<string, unknown>); }
  /**
   * Retrieves or derives query filters2 without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.includeItemTypes - The include item types value required by this operation.
   * @returns - The typed get query filters2 result.
   */
  async getQueryFilters2(params?: { userId?: string; parentId?: string; includeItemTypes?: string[] }): Promise<QueryFilters> { return this.request<QueryFilters>('GET', '/Items/Filters2', params as Record<string, unknown>); }
  /**
   * Implements log client document for the typed Jellyfin CLI runtime.
   * @param entries - The entries value required by this operation.
   * @returns - The typed log client document result.
   */
  async logClientDocument(entries: { Name?: string; Timestamp?: string; Message?: string; Level?: string }[]): Promise<void> { await this.request<void>('POST', '/ClientLog/Document', undefined, { Entries: entries }); }
  /**
   * Performs the report full session capabilities operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.playableMediaTypes - The playable media types value required by this operation.
   * @param params.supportedCommands - The supported commands value required by this operation.
   * @param params.supportsMediaControl - The supports media control value required by this operation.
   * @param params.supportsContentUploading - The supports content uploading value required by this operation.
   * @param params.supportsSync - The supports sync value required by this operation.
   * @returns - The typed report full session capabilities result.
   */
  async reportFullSessionCapabilities(params: { playableMediaTypes?: string[]; supportedCommands?: string[]; supportsMediaControl?: boolean; supportsContentUploading?: boolean; supportsSync?: boolean }): Promise<void> { await this.request<void>('POST', '/Sessions/Capabilities/Full', undefined, params); }
  /**
   * Retrieves or derives theme songs without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param inheritFromParent - The inherit from parent value required by this operation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async getThemeSongs(itemId: string, userId?: string, inheritFromParent?: boolean): Promise<ThemeMediaResult> { return this.request<ThemeMediaResult>('GET', `/Items/${itemId}/ThemeSongs`, { userId, inheritFromParent }); }
  /**
   * Retrieves or derives theme videos without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param inheritFromParent - The inherit from parent value required by this operation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async getThemeVideos(itemId: string, userId?: string, inheritFromParent?: boolean): Promise<ThemeMediaResult> { return this.request<ThemeMediaResult>('GET', `/Items/${itemId}/ThemeVideos`, { userId, inheritFromParent }); }
  /**
   * Retrieves or derives remote images without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.type - The type value required by this operation.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getRemoteImages(itemId: string, params?: { type?: string; startIndex?: number; limit?: number }): Promise<{ Images?: RemoteImageInfo[]; TotalRecordCount?: number; Providers?: string[] }> { return this.request<{ Images?: RemoteImageInfo[]; TotalRecordCount?: number; Providers?: string[] }>('GET', `/Items/${itemId}/RemoteImages`, params); }
  /**
   * Performs the download remote image operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.type - The type value required by this operation.
   * @param params.imageUrl - The image url value required by this operation.
   * @returns - The normalized string representation.
   */
  async downloadRemoteImage(itemId: string, params?: { type?: string; imageUrl?: string }): Promise<void> { await this.request<void>('POST', `/Items/${itemId}/RemoteImages/Download`, params); }
  /**
   * Retrieves or derives external id infos without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getExternalIdInfos(itemId: string): Promise<ExternalIdInfo[]> { return this.request<ExternalIdInfo[]>('GET', `/Items/${itemId}/ExternalIdInfos`); }
  /**
   * Retrieves or derives remote subtitles without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param language - The language value required by this operation.
   * @param isPerfectMatch - The is perfect match value required by this operation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async searchRemoteSubtitles(itemId: string, language: string, isPerfectMatch?: boolean): Promise<RemoteSubtitleInfo[]> { return this.request<RemoteSubtitleInfo[]>('GET', `/Items/${itemId}/RemoteSearch/Subtitles/${language}`, { isPerfectMatch }); }
  /**
   * Performs the download remote subtitle operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param subtitleId - The subtitle id value required by this operation.
   */
  async downloadRemoteSubtitle(itemId: string, subtitleId: string): Promise<void> { await this.request<void>('POST', `/Items/${itemId}/RemoteSearch/Subtitles/${subtitleId}`); }
  /**
   * Implements refresh item for the typed Jellyfin CLI runtime.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.recursive - The recursive value required by this operation.
   * @param params.replaceAllMetadata - The replace all metadata value required by this operation.
   * @param params.replaceAllImages - The replace all images value required by this operation.
   * @returns - The normalized string representation.
   */
  async refreshItem(itemId: string, params?: { recursive?: boolean; replaceAllMetadata?: boolean; replaceAllImages?: boolean }): Promise<void> { await this.request<void>('POST', `/Items/${itemId}/Refresh`, params); }
  /**
   * Performs the delete item operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   */
  async deleteItem(itemId: string): Promise<void> { await this.request<void>('DELETE', `/Items/${itemId}`); }
  /**
   * Performs the update item operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param item - The item value required by this operation.
   */
  async updateItem(itemId: string, item: Partial<BaseItemDto>): Promise<void> { await this.request<void>('POST', `/Items/${itemId}`, undefined, item); }
  /**
   * Retrieves or derives media segments without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getMediaSegments(itemId: string): Promise<QueryResult<MediaSegment>> { return this.request<QueryResult<MediaSegment>>('GET', `/MediaSegments/${itemId}`); }
  /**
   * Retrieves or derives lyrics without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getLyrics(itemId: string): Promise<LyricsInfo> { return this.request<LyricsInfo>('GET', `/Audio/${itemId}/Lyrics`); }
  /**
   * Performs the upload lyrics operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.language - The language value required by this operation.
   * @param params.isSynced - The is synced value required by this operation.
   * @param params.data - The typed payload to format or submit.
   * @returns - The normalized string representation.
   */
  async uploadLyrics(itemId: string, params: { language: string; isSynced: boolean; data: string }): Promise<LyricsInfo> { return this.request<LyricsInfo>('POST', `/Audio/${itemId}/Lyrics`, undefined, params); }
  /**
   * Performs the delete lyrics operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   */
  async deleteLyrics(itemId: string): Promise<void> { await this.request<void>('DELETE', `/Audio/${itemId}/Lyrics`); }
  /**
   * Retrieves or derives remote lyrics without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async searchRemoteLyrics(itemId: string): Promise<RemoteSubtitleInfo[]> { return this.request<RemoteSubtitleInfo[]>('GET', `/Audio/${itemId}/RemoteSearch/Lyrics`); }
  /**
   * Performs the download remote lyrics operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param lyricId - The lyric id value required by this operation.
   * @returns - The normalized string representation.
   */
  async downloadRemoteLyrics(itemId: string, lyricId: string): Promise<LyricsInfo> { return this.request<LyricsInfo>('POST', `/Audio/${itemId}/RemoteSearch/Lyrics/${encodeURIComponent(lyricId)}`); }
  /**
   * Implements remote search for the typed Jellyfin CLI runtime.
   * @param type - The type value required by this operation.
   * @param query - The query value required by this operation.
   * @returns - The normalized string representation.
   */
  async remoteSearch(type: string, query: RemoteSearchQuery): Promise<RemoteSearchResult[]> { return this.request<RemoteSearchResult[]>('POST', `/Items/RemoteSearch/${type}`, undefined, query); }
  /**
   * Implements apply search result for the typed Jellyfin CLI runtime.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.searchProviderName - The search provider name value required by this operation.
   * @param params.replaceAllImages - The replace all images value required by this operation.
   * @param params.providerIds - The provider ids value required by this operation.
   * @returns - The normalized string representation.
   */
  async applySearchResult(itemId: string, params: { searchProviderName?: string; replaceAllImages?: boolean; providerIds?: Record<string, string> }): Promise<void> { await this.request<void>('POST', `/Items/RemoteSearch/Apply/${itemId}`, params); }
  // Streaming URLs
  /**
   * Retrieves or derives stream url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.audioStreamIndex - The audio stream index value required by this operation.
   * @param params.subtitleStreamIndex - The subtitle stream index value required by this operation.
   * @param params.maxStreamingBitrate - The max streaming bitrate value required by this operation.
   * @returns - The normalized string representation.
   */
  getStreamUrl(itemId: string, params?: { mediaSourceId?: string; audioStreamIndex?: number; subtitleStreamIndex?: number; maxStreamingBitrate?: number }): string { return `${this.getBackendUrl()}/Videos/${itemId}/stream${buildQueryString({ ...params, userId: this.userId })}`; }
  /**
   * Retrieves or derives audio stream url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.audioStreamIndex - The audio stream index value required by this operation.
   * @param params.maxStreamingBitrate - The max streaming bitrate value required by this operation.
   * @returns - The normalized string representation.
   */
  getAudioStreamUrl(itemId: string, params?: { mediaSourceId?: string; audioStreamIndex?: number; maxStreamingBitrate?: number }): string { return `${this.getBackendUrl()}/Audio/${itemId}/stream${buildQueryString({ ...params, userId: this.userId })}`; }
  /**
   * Retrieves or derives subtitle url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param mediaSourceId - The media source id value required by this operation.
   * @param streamIndex - The stream index value required by this operation.
   * @param format - The requested machine-readable or human-readable output format.
   * @returns - The normalized string representation.
   */
  getSubtitleUrl(itemId: string, mediaSourceId: string, streamIndex: number, format?: string): string { return `${this.getBackendUrl()}/Videos/${itemId}/${mediaSourceId}/Subtitles/${streamIndex}/Stream.${format ?? 'srt'}${buildQueryString({ mediaSourceId, streamIndex, format, userId: this.userId })}`; }
  /**
   * Retrieves or derives thumb url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.tag - The tag value required by this operation.
   * @returns - The normalized string representation.
   */
  getThumbUrl(itemId: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string }): string { return `${this.getBackendUrl()}/Items/${itemId}/Images/Primary${buildQueryString(params as Record<string, unknown>)}`; }
  /**
   * Retrieves or derives hls master playlist url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.audioStreamIndex - The audio stream index value required by this operation.
   * @param params.subtitleStreamIndex - The subtitle stream index value required by this operation.
   * @param params.maxStreamingBitrate - The max streaming bitrate value required by this operation.
   * @returns - The normalized string representation.
   */
  getHlsMasterPlaylistUrl(itemId: string, params?: { mediaSourceId?: string; audioStreamIndex?: number; subtitleStreamIndex?: number; maxStreamingBitrate?: number }): string { return `${this.getBackendUrl()}/Videos/${itemId}/master.m3u8${buildQueryString({ ...params, userId: this.userId })}`; }
  /**
   * Retrieves or derives item download url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  getItemDownloadUrl(itemId: string): string { return `${this.getBackendUrl()}/Items/${itemId}/Download${buildQueryString({ api_key: this.apiKey } as Record<string, unknown>)}`; }
  // Plugins
  /**
   * Retrieves or derives plugins without mutating Jellyfin state.
   * @returns - The typed get plugins result.
   */
  async getPlugins(): Promise<PluginInfo[]> { return this.request<PluginInfo[]>('GET', '/Plugins'); }
  /**
   * Retrieves or derives plugin without mutating Jellyfin state.
   * @param pluginId - The plugin id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getPlugin(pluginId: string): Promise<PluginInfo> { return this.request<PluginInfo>('GET', `/Plugins/${pluginId}`); }
  /**
   * Implements uninstall plugin for the typed Jellyfin CLI runtime.
   * @param pluginId - The plugin id value required by this operation.
   */
  async uninstallPlugin(pluginId: string): Promise<void> { await this.request<void>('DELETE', `/Plugins/${pluginId}`); }
  /**
   * Implements disable plugin for the typed Jellyfin CLI runtime.
   * @param pluginId - The plugin id value required by this operation.
   * @param version - The version value required by this operation.
   */
  async disablePlugin(pluginId: string, version: string): Promise<void> { await this.request<void>('POST', `/Plugins/${pluginId}/${version}/Disable`); }
  /**
   * Implements enable plugin for the typed Jellyfin CLI runtime.
   * @param pluginId - The plugin id value required by this operation.
   * @param version - The version value required by this operation.
   */
  async enablePlugin(pluginId: string, version: string): Promise<void> { await this.request<void>('POST', `/Plugins/${pluginId}/${version}/Enable`); }
  /**
   * Retrieves or derives plugin configuration without mutating Jellyfin state.
   * @param pluginId - The plugin id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getPluginConfiguration(pluginId: string): Promise<Record<string, unknown>> { return this.request<Record<string, unknown>>('GET', `/Plugins/${pluginId}/Configuration`); }
  /**
   * Performs the update plugin configuration operation through the typed Jellyfin API boundary.
   * @param pluginId - The plugin id value required by this operation.
   * @param config - The resolved Jellyfin client configuration.
   */
  async updatePluginConfiguration(pluginId: string, config: Record<string, unknown>): Promise<void> { await this.request<void>('POST', `/Plugins/${pluginId}/Configuration`, undefined, config); }
  // Devices
  /**
   * Retrieves or derives devices without mutating Jellyfin state.
   * @returns - The typed get devices result.
   */
  async getDevices(): Promise<QueryResult<DeviceInfo>> { return this.request<QueryResult<DeviceInfo>>('GET', '/Devices'); }
  /**
   * Retrieves or derives device info without mutating Jellyfin state.
   * @param deviceId - The device id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getDeviceInfo(deviceId: string): Promise<DeviceInfo> {
    return this.request<DeviceInfo>('GET', '/Devices/Info', { id: deviceId });
  }
  /**
   * Retrieves or derives device without mutating Jellyfin state.
   * @param deviceId - The device id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getDevice(deviceId: string): Promise<DeviceInfo> { return this.request<DeviceInfo>('GET', `/Devices/${deviceId}`); }
  /**
   * Performs the delete device operation through the typed Jellyfin API boundary.
   * @param deviceId - The device id value required by this operation.
   */
  async deleteDevice(deviceId: string): Promise<void> { await this.request<void>('DELETE', '/Devices', { id: deviceId }); }
  /**
   * Performs the update device options operation through the typed Jellyfin API boundary.
   * @param deviceId - The device id value required by this operation.
   * @param options - Optional settings that refine the operation.
   * @param options.customName - The custom name value required by this operation.
   * @returns - The normalized string representation.
   */
  async updateDeviceOptions(deviceId: string, options: { customName?: string }): Promise<void> { await this.request<void>('POST', '/Devices/Options', undefined, { Id: deviceId, ...options }); }
  // System Config & Branding
  /**
   * Retrieves or derives branding without mutating Jellyfin state.
   * @returns - The typed get branding result.
   */
  async getBranding(): Promise<BrandingOptions> { return this.request<BrandingOptions>('GET', '/Branding/Configuration'); }
  /**
   * Retrieves or derives branding css without mutating Jellyfin state.
   * @returns - The normalized string representation.
   */
  async getBrandingCss(): Promise<string> { return this.request<string>('GET', '/Branding/Css'); }
  /**
   * Retrieves or derives splashscreen url without mutating Jellyfin state.
   * @returns - The normalized string representation.
   */
  async getSplashscreenUrl(): Promise<string> { return `${this.baseUrl}/Branding/Splashscreen`; }
  /**
   * Performs the delete splashscreen operation through the typed Jellyfin API boundary.
   */
  async deleteSplashscreen(): Promise<void> { await this.request<void>('DELETE', '/Branding/Splashscreen'); }
  /**
   * Retrieves or derives server configuration without mutating Jellyfin state.
   * @returns - The typed get server configuration result.
   */
  async getServerConfiguration(): Promise<ServerConfiguration> { return this.request<ServerConfiguration>('GET', '/System/Configuration'); }
  /**
   * Performs the update server configuration operation through the typed Jellyfin API boundary.
   * @param config - The resolved Jellyfin client configuration.
   */
  async updateServerConfiguration(config: Partial<ServerConfiguration>): Promise<void> { await this.request<void>('POST', '/System/Configuration', undefined, config); }
  /**
   * Performs the update branding configuration operation through the typed Jellyfin API boundary.
   * @param config - The resolved Jellyfin client configuration.
   */
  async updateBrandingConfiguration(config: Partial<BrandingOptions>): Promise<void> { await this.request<void>('POST', '/System/Configuration/Branding', undefined, config); }
  /**
   * Retrieves or derives named configuration without mutating Jellyfin state.
   * @param key - The key value required by this operation.
   * @returns - The normalized string representation.
   */
  async getNamedConfiguration(key: string): Promise<unknown> { return this.request<unknown>('GET', `/System/Configuration/${key}`); }
  /**
   * Performs the update named configuration operation through the typed Jellyfin API boundary.
   * @param key - The key value required by this operation.
   * @param data - The typed payload to format or submit.
   */
  async updateNamedConfiguration(key: string, data: unknown): Promise<void> { await this.request<void>('POST', `/System/Configuration/${key}`, undefined, data); }
  /**
   * Retrieves or derives system storage info without mutating Jellyfin state.
   * @returns - The typed get system storage info result.
   */
  async getSystemStorageInfo(): Promise<{ DataPaths?: string[]; CachePath?: string; InternalMetadataPath?: string; LogPath?: string; TranscodingTempPath?: string }> { return this.request<{ DataPaths?: string[]; CachePath?: string; InternalMetadataPath?: string; LogPath?: string; TranscodingTempPath?: string }>('GET', '/System/Info/Storage'); }
  /**
   * Retrieves or derives system logs without mutating Jellyfin state.
   * @returns - The typed get system logs result.
   */
  async getSystemLogs(): Promise<{ Name?: string; DateCreated?: string; Size?: number }[]> { return this.request<{ Name?: string; DateCreated?: string; Size?: number }[]>('GET', '/System/Logs'); }
  /**
   * Retrieves or derives system log file without mutating Jellyfin state.
   * @param name - The name value required by this operation.
   * @returns - The normalized string representation.
   */
  async getSystemLogFile(name: string): Promise<string> { return this.request<string>('GET', `/System/Logs/Log`, { name }); }
  /**
   * Retrieves or derives system endpoint without mutating Jellyfin state.
   * @returns - The typed get system endpoint result.
   */
  async getSystemEndpoint(): Promise<{ IsLocal?: boolean; IsInNetwork?: boolean }> { return this.request<{ IsLocal?: boolean; IsInNetwork?: boolean }>('GET', '/System/Endpoint'); }
  /**
   * Retrieves or derives utc time without mutating Jellyfin state.
   * @returns - The typed get utc time result.
   */
  async getUtcTime(): Promise<UtcTimeResponse> { return this.request<UtcTimeResponse>('GET', '/GetUtcTime'); }
  /**
   * Implements test bitrate for the typed Jellyfin CLI runtime.
   * @param size - The size value required by this operation.
   * @returns - The typed test bitrate result.
   */
  async testBitrate(size?: number): Promise<number> { return this.request<number>('GET', '/Playback/BitrateTest', size !== undefined ? { size } : undefined); }
  /**
   * Retrieves or derives subtitle providers without mutating Jellyfin state.
   * @returns - The typed get subtitle providers result.
   */
  async getSubtitleProviders(): Promise<{ Name?: string | null }[]> { return this.request<{ Name?: string | null }[]>('GET', '/Providers/Subtitles/Subtitles'); }
  /**
   * Retrieves or derives display preferences without mutating Jellyfin state.
   * @param displayPreferencesId - The display preferences id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param client - The client value required by this operation.
   * @returns - The normalized string representation.
   */
  async getDisplayPreferences(displayPreferencesId: string, userId?: string, client?: string): Promise<DisplayPreferences> { const uid = userId ?? this.userId; return this.request<DisplayPreferences>('GET', `/DisplayPreferences/${displayPreferencesId}`, { userId: uid, client: client ?? 'emby' }); }
  /**
   * Performs the update display preferences operation through the typed Jellyfin API boundary.
   * @param displayPreferencesId - The display preferences id value required by this operation.
   * @param prefs - The prefs value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param client - The client value required by this operation.
   */
  async updateDisplayPreferences(displayPreferencesId: string, prefs: Partial<DisplayPreferences>, userId?: string, client?: string): Promise<void> { const uid = userId ?? this.userId; await this.request<void>('POST', `/DisplayPreferences/${displayPreferencesId}`, { userId: uid, client: client ?? 'emby' }, prefs); }
  // API Keys & Notifications
  /**
   * Retrieves or derives api keys without mutating Jellyfin state.
   * @returns - The typed get api keys result.
   */
  async getApiKeys(): Promise<QueryResult<ApiKeyInfo>> { return this.request<QueryResult<ApiKeyInfo>>('GET', '/Auth/Keys'); }
  /**
   * Performs the create api key operation through the typed Jellyfin API boundary.
   * @param app - The app value required by this operation.
   */
  async createApiKey(app: string): Promise<void> { await this.request<void>('POST', '/Auth/Keys', { app }); }
  /**
   * Performs the delete api key operation through the typed Jellyfin API boundary.
   * @param key - The key value required by this operation.
   */
  async deleteApiKey(key: string): Promise<void> { await this.request<void>('DELETE', `/Auth/Keys/${key}`); }
  /**
   * Retrieves or derives notification types without mutating Jellyfin state.
   * @returns - The typed get notification types result.
   */
  async getNotificationTypes(): Promise<NotificationTypeInfo[]> { return this.request<NotificationTypeInfo[]>('GET', '/Notifications/Types'); }
  /**
   * Retrieves or derives notifications without mutating Jellyfin state.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getNotifications(userId?: string): Promise<NotificationResult> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<NotificationResult>('GET', `/Notifications/${uid}`); }
  /**
   * Performs the send admin notification operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.name - The name value required by this operation.
   * @param params.description - The description value required by this operation.
   * @param params.url - The url value required by this operation.
   * @param params.level - The level value required by this operation.
   * @param params.userIds - The user ids value required by this operation.
   * @returns - The typed send admin notification result.
   */
  async sendAdminNotification(params: { name: string; description?: string; url?: string; level?: string; userIds?: string[] }): Promise<void> { await this.request<void>('POST', '/Notifications/Admin', params); }
  // Users
  /**
   * Performs the create user operation through the typed Jellyfin API boundary.
   * @param user - The user value required by this operation.
   * @returns - The typed create user result.
   */
  async createUser(user: CreateUserDto): Promise<{ Id?: string; Name?: string; ServerId?: string }> { return this.request<{ Id?: string; Name?: string; ServerId?: string }>('POST', '/Users/New', undefined, user); }
  /**
   * Performs the delete user operation through the typed Jellyfin API boundary.
   * @param userId - The stable Jellyfin user identifier.
   */
  async deleteUser(userId: string): Promise<void> { await this.request<void>('DELETE', `/Users/${userId}`); }
  /**
   * Performs the update user policy operation through the typed Jellyfin API boundary.
   * @param userId - The stable Jellyfin user identifier.
   * @param policy - The policy value required by this operation.
   */
  async updateUserPolicy(userId: string, policy: Record<string, unknown>): Promise<void> { await this.request<void>('POST', `/Users/${userId}/Policy`, undefined, policy); }
  /**
   * Performs the update user configuration operation through the typed Jellyfin API boundary.
   * @param userId - The stable Jellyfin user identifier.
   * @param config - The resolved Jellyfin client configuration.
   */
  async updateUserConfiguration(userId: string, config: Record<string, unknown>): Promise<void> { await this.request<void>('POST', '/Users/Configuration', { userId }, config); }
  /**
   * Performs the update user password operation through the typed Jellyfin API boundary.
   * @param userId - The stable Jellyfin user identifier.
   * @param password - The password value required by this operation.
   */
  async updateUserPassword(userId: string, password: UpdateUserPasswordDto): Promise<void> { await this.request<void>('POST', '/Users/Password', { userId }, password); }
  /**
   * Retrieves or derives public users without mutating Jellyfin state.
   * @returns - The typed get public users result.
   */
  async getPublicUsers(): Promise<UserDto[]> { return this.request<UserDto[]>('GET', '/Users/Public'); }
  /**
   * Retrieves or derives user views without mutating Jellyfin state.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getUserViews(userId?: string): Promise<QueryResult<UserView>> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<QueryResult<UserView>>('GET', '/UserViews', { userId: uid }); }
  /**
   * Retrieves or derives user view grouping options without mutating Jellyfin state.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getUserViewGroupingOptions(userId?: string): Promise<UserViewGroupingOption[]> { const uid = userId ?? this.userId; if (!uid) throw new JellyfinApiError('User ID required'); return this.request<UserViewGroupingOption[]>('GET', '/UserViews/GroupingOptions', { userId: uid }); }
  /**
   * Implements forgot password for the typed Jellyfin CLI runtime.
   * @param enteredUsername - The entered username value required by this operation.
   * @returns - The normalized string representation.
   */
  async forgotPassword(enteredUsername: string): Promise<{ Action?: string; PinFile?: string; PinExpirationDate?: string }> { return this.request<{ Action?: string; PinFile?: string; PinExpirationDate?: string }>('POST', '/Users/ForgotPassword', undefined, { EnteredUsername: enteredUsername }); }
  /**
   * Implements redeem forgot password pin for the typed Jellyfin CLI runtime.
   * @param pin - The pin value required by this operation.
   * @returns - The normalized string representation.
   */
  async redeemForgotPasswordPin(pin: string): Promise<{ Success?: boolean; UsersReset?: string[] }> { return this.request<{ Success?: boolean; UsersReset?: string[] }>('POST', '/Users/ForgotPassword/Pin', undefined, { Pin: pin }); }
  /**
   * Implements authenticate with quick connect for the typed Jellyfin CLI runtime.
   * @param secret - The secret value required by this operation.
   * @returns - The normalized string representation.
   */
  async authenticateWithQuickConnect(secret: string): Promise<UserDto> { return this.request<UserDto>('POST', '/Users/AuthenticateWithQuickConnect', undefined, { Secret: secret }); }
  // Sessions extended
  /**
   * Performs the add session user operation through the typed Jellyfin API boundary.
   * @param sessionId - The session id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   */
  async addSessionUser(sessionId: string, userId: string): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/User/${userId}`); }
  /**
   * Performs the remove session user operation through the typed Jellyfin API boundary.
   * @param sessionId - The session id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   */
  async removeSessionUser(sessionId: string, userId: string): Promise<void> { await this.request<void>('DELETE', `/Sessions/${sessionId}/User/${userId}`); }
  /**
   * Performs the set now viewing operation through the typed Jellyfin API boundary.
   * @param sessionId - The session id value required by this operation.
   * @param itemId - The item id value required by this operation.
   */
  async setNowViewing(sessionId: string, itemId: string): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/Viewing`, { itemId }); }
  /**
   * Performs the report session capabilities operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.playableMediaTypes - The playable media types value required by this operation.
   * @param params.supportedCommands - The supported commands value required by this operation.
   * @param params.supportsMediaControl - The supports media control value required by this operation.
   * @returns - The typed report session capabilities result.
   */
  async reportSessionCapabilities(params: { playableMediaTypes?: string[]; supportedCommands?: string[]; supportsMediaControl?: boolean }): Promise<void> { await this.request<void>('POST', '/Sessions/Capabilities', params); }
  /**
   * Implements logout session for the typed Jellyfin CLI runtime.
   */
  async logoutSession(): Promise<void> { await this.request<void>('POST', '/Sessions/Logout'); }
  /**
   * Performs the send general command operation through the typed Jellyfin API boundary.
   * @param sessionId - The session id value required by this operation.
   * @param command - The Commander command whose path or behavior is inspected.
   * @param args - The args value required by this operation.
   */
  async sendGeneralCommand(sessionId: string, command: string, args?: Record<string, string>): Promise<void> { await this.request<void>('POST', `/Sessions/${sessionId}/Command/${encodeURIComponent(command)}`, undefined, args ? { Arguments: args } : undefined); }
  // Backup
  /**
   * Retrieves or derives backup manifest without mutating Jellyfin state.
   * @param path - The API, command, or filesystem path to process.
   * @returns - The normalized string representation.
   */
  async getBackupManifest(path: string): Promise<Record<string, unknown>> { return this.pluginsExt.getBackupManifest(path); }
  // Library media notifications (delegates to pluginsExt)
  /**
   * Implements notify library media updated for the typed Jellyfin CLI runtime.
   * @param updates - The updates value required by this operation.
   * @returns - The typed notify library media updated result.
   */
  async notifyLibraryMediaUpdated(updates: { Path?: string; UpdateType?: string }[]): Promise<void> { return this.pluginsExt.notifyLibraryMediaUpdated(updates); }
  /**
   * Implements notify movies added for the typed Jellyfin CLI runtime.
   * @param updates - The updates value required by this operation.
   * @returns - The typed notify movies added result.
   */
  async notifyMoviesAdded(updates: { Path?: string; UpdateType?: string }[]): Promise<void> { return this.pluginsExt.notifyMoviesAdded(updates); }
  /**
   * Implements notify movies updated for the typed Jellyfin CLI runtime.
   * @param updates - The updates value required by this operation.
   * @returns - The typed notify movies updated result.
   */
  async notifyMoviesUpdated(updates: { Path?: string; UpdateType?: string }[]): Promise<void> { return this.pluginsExt.notifyMoviesUpdated(updates); }
  /**
   * Implements notify series added for the typed Jellyfin CLI runtime.
   * @param updates - The updates value required by this operation.
   * @returns - The typed notify series added result.
   */
  async notifySeriesAdded(updates: { Path?: string; UpdateType?: string }[]): Promise<void> { return this.pluginsExt.notifySeriesAdded(updates); }
  /**
   * Implements notify series updated for the typed Jellyfin CLI runtime.
   * @param updates - The updates value required by this operation.
   * @returns - The typed notify series updated result.
   */
  async notifySeriesUpdated(updates: { Path?: string; UpdateType?: string }[]): Promise<void> { return this.pluginsExt.notifySeriesUpdated(updates); }
  // Plugin extended (delegates to pluginsExt)
  /**
   * Retrieves or derives meilisearch status without mutating Jellyfin state.
   * @returns - The typed get meilisearch status result.
   */
  async getMeilisearchStatus() { return this.pluginsExt.getMeilisearchStatus(); }
  /**
   * Implements reconnect meilisearch for the typed Jellyfin CLI runtime.
   * @returns - The typed reconnect meilisearch result.
   */
  async reconnectMeilisearch() { return this.pluginsExt.reconnectMeilisearch(); }
  /**
   * Implements reindex meilisearch for the typed Jellyfin CLI runtime.
   * @returns - The typed reindex meilisearch result.
   */
  async reindexMeilisearch() { return this.pluginsExt.reindexMeilisearch(); }
  /**
   * Retrieves or derives tmdb client configuration without mutating Jellyfin state.
   * @returns - The typed get tmdb client configuration result.
   */
  async getTmdbClientConfiguration() { return this.pluginsExt.getTmdbClientConfiguration(); }
  /**
   * Implements refresh tmdb box sets for the typed Jellyfin CLI runtime.
   * @returns - The typed refresh tmdb box sets result.
   */
  async refreshTmdbBoxSets() { return this.pluginsExt.refreshTmdbBoxSets(); }
  /**
   * Implements test telegram notifier for the typed Jellyfin CLI runtime.
   * @returns - The typed test telegram notifier result.
   */
  async testTelegramNotifier() { return this.pluginsExt.testTelegramNotifier(); }
  /**
   * Performs the create infuse sync checkpoint operation through the typed Jellyfin API boundary.
   * @returns - The typed create infuse sync checkpoint result.
   */
  async createInfuseSyncCheckpoint() { return this.pluginsExt.createInfuseSyncCheckpoint(); }
  /**
   * Performs the start infuse sync checkpoint operation through the typed Jellyfin API boundary.
   * @param id - The id value required by this operation.
   * @returns - The normalized string representation.
   */
  async startInfuseSyncCheckpoint(id: string) { return this.pluginsExt.startInfuseSyncCheckpoint(id); }
  /**
   * Retrieves or derives infuse sync removed items without mutating Jellyfin state.
   * @param id - The id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getInfuseSyncRemovedItems(id: string) { return this.pluginsExt.getInfuseSyncRemovedItems(id); }
  /**
   * Retrieves or derives infuse sync updated items without mutating Jellyfin state.
   * @param id - The id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getInfuseSyncUpdatedItems(id: string) { return this.pluginsExt.getInfuseSyncUpdatedItems(id); }
  /**
   * Retrieves or derives infuse sync user data without mutating Jellyfin state.
   * @param id - The id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getInfuseSyncUserData(id: string) { return this.pluginsExt.getInfuseSyncUserData(id); }
  /**
   * Retrieves or derives infuse sync user folders without mutating Jellyfin state.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getInfuseSyncUserFolders(userId?: string) { return this.pluginsExt.getInfuseSyncUserFolders(userId); }
}
