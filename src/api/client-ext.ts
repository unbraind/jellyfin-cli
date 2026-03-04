import type {
  LocalizationOption,
  CountryInfo,
  CultureDto,
  QuickConnectResult,
  BackupInfo,
  AddVirtualFolderParams,
  AddMediaPathParams,
  UpdateMediaPathParams,
  QueryResult,
  BaseItemDto,
  VirtualFolderInfo,
  StartupConfiguration,
  StartupFirstUser,
} from '../types/index.js';
import { CoreApi } from './core-api.js';
import { buildQueryString } from './types.js';

export class JellyfinExtensions extends CoreApi {
  // Read-only URL helpers for stream/file endpoints
  getVideoStreamByContainerUrl(
    itemId: string,
    container: string,
    params?: {
      mediaSourceId?: string;
      audioStreamIndex?: number;
      subtitleStreamIndex?: number;
      maxStreamingBitrate?: number;
      static?: boolean;
    },
  ): string {
    const encodedContainer = encodeURIComponent(container);
    return `${this.getBackendUrl()}/Videos/${itemId}/stream.${encodedContainer}${buildQueryString({
      ...params,
      userId: this.userId,
    })}`;
  }

  getAudioStreamByContainerUrl(
    itemId: string,
    container: string,
    params?: { mediaSourceId?: string; audioStreamIndex?: number; maxStreamingBitrate?: number; static?: boolean },
  ): string {
    const encodedContainer = encodeURIComponent(container);
    return `${this.getBackendUrl()}/Audio/${itemId}/stream.${encodedContainer}${buildQueryString({
      ...params,
      userId: this.userId,
    })}`;
  }

  getUniversalAudioStreamUrl(
    itemId: string,
    params?: { mediaSourceId?: string; audioStreamIndex?: number; maxStreamingBitrate?: number },
  ): string {
    return `${this.getBackendUrl()}/Audio/${itemId}/universal${buildQueryString({
      ...params,
      userId: this.userId,
    })}`;
  }

  getAudioHlsMasterPlaylistUrl(
    itemId: string,
    params?: { mediaSourceId?: string; audioStreamIndex?: number; maxStreamingBitrate?: number },
  ): string {
    return `${this.getBackendUrl()}/Audio/${itemId}/master.m3u8${buildQueryString({
      ...params,
      userId: this.userId,
    })}`;
  }

  getAudioHlsVariantPlaylistUrl(
    itemId: string,
    params?: { mediaSourceId?: string; audioStreamIndex?: number; maxStreamingBitrate?: number },
  ): string {
    return `${this.getBackendUrl()}/Audio/${itemId}/main.m3u8${buildQueryString({
      ...params,
      userId: this.userId,
    })}`;
  }

  getLegacyHlsVideoPlaylistUrl(
    itemId: string,
    playlistId: string,
    params?: { mediaSourceId?: string; maxStreamingBitrate?: number },
  ): string {
    const encodedPlaylistId = encodeURIComponent(playlistId);
    return `${this.getBackendUrl()}/Videos/${itemId}/hls/${encodedPlaylistId}/stream.m3u8${buildQueryString({
      ...params,
      userId: this.userId,
    })}`;
  }

  getLegacyHlsAudioSegmentUrl(
    itemId: string,
    segmentId: string,
    params?: { mediaSourceId?: string; maxStreamingBitrate?: number },
  ): string {
    const encodedSegmentId = encodeURIComponent(segmentId);
    return `${this.getBackendUrl()}/Audio/${itemId}/hls/${encodedSegmentId}/stream.mp3${buildQueryString({
      ...params,
      userId: this.userId,
    })}`;
  }

  getItemFileUrl(itemId: string): string {
    return `${this.getBackendUrl()}/Items/${itemId}/File${buildQueryString({
      api_key: this.apiKey,
      userId: this.userId,
    })}`;
  }

  getKodiStrmUrl(type: string, id: string, parentId?: string): string {
    const encodedType = encodeURIComponent(type);
    const encodedId = encodeURIComponent(id);
    if (!parentId) {
      return `${this.getBackendUrl()}/Kodi/${encodedType}/${encodedId}/file.strm`;
    }
    return `${this.getBackendUrl()}/Kodi/${encodedType}/${encodeURIComponent(parentId)}/${encodedId}/file.strm`;
  }

  getBrandingCssStaticUrl(): string {
    return `${this.getBackendUrl()}/Branding/Css.css`;
  }

  // Videos merge/split/subtitle
  async mergeVideoVersions(ids: string[]): Promise<void> { await this.request<void>('POST', '/Videos/MergeVersions', { ids: ids.join(',') }); }
  async mergeEpisodeVersions(ids: string[]): Promise<void> { await this.request<void>('POST', '/MergeVersions/MergeEpisodes', undefined, { Ids: ids }); }
  async mergeMovieVersions(ids: string[]): Promise<void> { await this.request<void>('POST', '/MergeVersions/MergeMovies', undefined, { Ids: ids }); }
  async splitEpisodeVersions(ids: string[]): Promise<void> { await this.request<void>('POST', '/MergeVersions/SplitEpisodes', undefined, { Ids: ids }); }
  async splitMovieVersions(ids: string[]): Promise<void> { await this.request<void>('POST', '/MergeVersions/SplitMovies', undefined, { Ids: ids }); }
  async deleteAlternateSources(itemId: string): Promise<void> { await this.request<void>('DELETE', `/Videos/${itemId}/AlternateSources`); }
  async cancelActiveEncodings(deviceId?: string): Promise<void> { await this.request<void>('DELETE', '/Videos/ActiveEncodings', deviceId ? { deviceId } : undefined); }
  async deleteSubtitle(itemId: string, index: number): Promise<void> { await this.request<void>('DELETE', `/Videos/${itemId}/Subtitles/${index}`); }
  async uploadSubtitle(itemId: string, params: { language: string; format: string; data: string; isForced?: boolean }): Promise<void> { await this.request<void>('POST', `/Videos/${itemId}/Subtitles`, undefined, params); }

  // Fallback fonts
  async getFallbackFonts(): Promise<{ Name?: string; Filename?: string; FileSize?: number; DateCreated?: string }[]> { return this.request<{ Name?: string; Filename?: string; FileSize?: number; DateCreated?: string }[]>('GET', '/FallbackFont/Fonts'); }
  async getFallbackFont(name: string): Promise<ArrayBuffer> { return this.request<ArrayBuffer>('GET', `/FallbackFont/Fonts/${encodeURIComponent(name)}`); }

  // Live streams
  async openLiveStream(params: { openToken?: string; userId?: string; playSessionId?: string; maxStreamingBitrate?: number; itemId?: string; enableDirectPlay?: boolean; enableDirectStream?: boolean }): Promise<{ MediaSource?: Record<string, unknown>; MediaSourceId?: string }> { return this.request<{ MediaSource?: Record<string, unknown>; MediaSourceId?: string }>('POST', '/LiveStreams/Open', undefined, params); }
  async closeLiveStream(liveStreamId: string): Promise<void> { await this.request<void>('POST', '/LiveStreams/Close', undefined, { LiveStreamId: liveStreamId }); }

  // Reports plugin
  async getActivityReport(params?: { limit?: number; startIndex?: number; minDate?: string }): Promise<{ Rows?: { Columns?: { Name?: string }[]; Id?: string; RowType?: string }[]; TotalRecordCount?: number }> { return this.request<{ Rows?: { Columns?: { Name?: string }[]; Id?: string; RowType?: string }[]; TotalRecordCount?: number }>('GET', '/Reports/Activities', params); }
  async getItemsReport(params?: { reportView?: string; displayType?: string; limit?: number; startIndex?: number }): Promise<{ Rows?: { Columns?: { Name?: string }[] }[]; TotalRecordCount?: number }> { return this.request<{ Rows?: { Columns?: { Name?: string }[] }[]; TotalRecordCount?: number }>('GET', '/Reports/Items', params); }
  async getReportHeaders(params?: { reportView?: string; displayType?: string }): Promise<{ Name?: string; FieldName?: string; DisplayType?: string }[]> { return this.request<{ Name?: string; FieldName?: string; DisplayType?: string }[]>('GET', '/Reports/Headers', params); }

  // Localization
  async getLocalizationOptions(): Promise<LocalizationOption[]> { return this.request<LocalizationOption[]>('GET', '/Localization/Options'); }
  async getCountries(): Promise<CountryInfo[]> { return this.request<CountryInfo[]>('GET', '/Localization/Countries'); }
  async getCultures(): Promise<CultureDto[]> { return this.request<CultureDto[]>('GET', '/Localization/Cultures'); }
  async getRatingSystems(): Promise<{ Name?: string; CountryCode?: string }[]> { return this.request<{ Name?: string; CountryCode?: string }[]>('GET', '/Localization/ParentalRatings'); }

  // QuickConnect & Auth
  async quickConnectEnabled(): Promise<boolean> { return this.request<boolean>('GET', '/QuickConnect/Enabled'); }
  async quickConnectInitiate(): Promise<QuickConnectResult> { return this.request<QuickConnectResult>('POST', '/QuickConnect/Initiate'); }
  async quickConnectConnect(secret: string): Promise<QuickConnectResult> { return this.request<QuickConnectResult>('GET', '/QuickConnect/Connect', { secret }); }
  async quickConnectAuthorize(code: string, userId?: string): Promise<boolean> { return this.request<boolean>('POST', '/QuickConnect/Authorize', { code, userId }); }
  async getAuthProviders(): Promise<{ Name?: string; Id?: string }[]> { return this.request<{ Name?: string; Id?: string }[]>('GET', '/Auth/Providers'); }
  async getPasswordResetProviders(): Promise<{ Name?: string; Id?: string }[]> { return this.request<{ Name?: string; Id?: string }[]>('GET', '/Auth/PasswordResetProviders'); }

  // Metadata editor & library options
  async getMetadataEditorInfo(itemId: string): Promise<Record<string, unknown>> { return this.request<Record<string, unknown>>('GET', `/Items/${itemId}/MetadataEditor`); }
  async getAvailableLibraryOptions(): Promise<Record<string, unknown>> { return this.request<Record<string, unknown>>('GET', '/Libraries/AvailableOptions'); }
  async getDefaultMetadataOptions(): Promise<Record<string, unknown>> { return this.request<Record<string, unknown>>('GET', '/System/Configuration/MetadataOptions/Default'); }

  // Usage Stats (PlaybackReportingActivity plugin)
  async getUsagePlayActivity(params?: { days?: number; endDate?: string; filter?: string; dataType?: string }): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/PlayActivity', params); }
  async getUserActivity(params?: { days?: number; endDate?: string; filter?: string }): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/user_activity', params); }
  async getHourlyReport(params?: { days?: number; endDate?: string; filter?: string; dataType?: string }): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/HourlyReport', params); }
  async getBreakdownReport(breakdownType: string, params?: { days?: number; endDate?: string; filter?: string }): Promise<unknown> { return this.request<unknown>('GET', `/user_usage_stats/${encodeURIComponent(breakdownType)}/BreakdownReport`, params); }
  async getMoviesReport(params?: { days?: number; endDate?: string; filter?: string }): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/MoviesReport', params); }
  async getTvShowsReport(params?: { days?: number; endDate?: string; filter?: string }): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/GetTvShowsReport', params); }
  async getDurationHistogramReport(params?: { days?: number; endDate?: string; filter?: string; dataType?: string }): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/DurationHistogramReport', params); }
  async getUsageUserList(): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/user_list'); }
  async getUsageTypeFilterList(): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/type_filter_list'); }
  async getUserReportData(userId: string, date: string): Promise<unknown> { return this.request<unknown>('GET', `/user_usage_stats/${userId}/${date}/GetItems`); }

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
  async createBackup(): Promise<void> { await this.request<void>('POST', '/Backup/Create'); }
  async restoreBackup(backupPath: string): Promise<void> { await this.request<void>('POST', '/Backup/Restore', undefined, { backupPath }); }
  async deleteBackup(backupPath: string): Promise<void> { await this.request<void>('DELETE', `/Backup/${encodeURIComponent(backupPath)}`); }

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

  async getPhysicalPaths(): Promise<string[]> { return this.request<string[]>('GET', '/Library/PhysicalPaths'); }
  async getMediaFolders(isHidden?: boolean): Promise<QueryResult<BaseItemDto>> { return this.request<QueryResult<BaseItemDto>>('GET', '/Library/MediaFolders', { isHidden }); }

  // Startup wizard state (read-only)
  async getStartupConfiguration(): Promise<StartupConfiguration> {
    return this.request<StartupConfiguration>('GET', '/Startup/Configuration');
  }
  async updateStartupConfiguration(config: StartupConfiguration): Promise<void> {
    await this.request<void>('POST', '/Startup/Configuration', undefined, config);
  }
  async getStartupFirstUser(): Promise<StartupFirstUser> {
    return this.request<StartupFirstUser>('GET', '/Startup/FirstUser');
  }
  async isStartupComplete(): Promise<boolean> {
    return this.request<boolean>('GET', '/Startup/Complete');
  }
}
