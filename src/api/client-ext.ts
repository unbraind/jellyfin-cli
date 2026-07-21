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

/**
 * Provides jellyfin extensions behavior for the Jellyfin client and command runtime.
 */
export class JellyfinExtensions extends CoreApi {
  // Read-only URL helpers for stream/file endpoints
  /**
   * Retrieves or derives video stream by container url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param container - The container value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.audioStreamIndex - The audio stream index value required by this operation.
   * @param params.subtitleStreamIndex - The subtitle stream index value required by this operation.
   * @param params.maxStreamingBitrate - The max streaming bitrate value required by this operation.
   * @param params.static - The static value required by this operation.
   * @returns - The normalized string representation.
   */
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

  /**
   * Retrieves or derives audio stream by container url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param container - The container value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.audioStreamIndex - The audio stream index value required by this operation.
   * @param params.maxStreamingBitrate - The max streaming bitrate value required by this operation.
   * @param params.static - The static value required by this operation.
   * @returns - The normalized string representation.
   */
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

  /**
   * Retrieves or derives universal audio stream url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.audioStreamIndex - The audio stream index value required by this operation.
   * @param params.maxStreamingBitrate - The max streaming bitrate value required by this operation.
   * @returns - The normalized string representation.
   */
  getUniversalAudioStreamUrl(
    itemId: string,
    params?: { mediaSourceId?: string; audioStreamIndex?: number; maxStreamingBitrate?: number },
  ): string {
    return `${this.getBackendUrl()}/Audio/${itemId}/universal${buildQueryString({
      ...params,
      userId: this.userId,
    })}`;
  }

  /**
   * Retrieves or derives audio hls master playlist url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.audioStreamIndex - The audio stream index value required by this operation.
   * @param params.maxStreamingBitrate - The max streaming bitrate value required by this operation.
   * @returns - The normalized string representation.
   */
  getAudioHlsMasterPlaylistUrl(
    itemId: string,
    params?: { mediaSourceId?: string; audioStreamIndex?: number; maxStreamingBitrate?: number },
  ): string {
    return `${this.getBackendUrl()}/Audio/${itemId}/master.m3u8${buildQueryString({
      ...params,
      userId: this.userId,
    })}`;
  }

  /**
   * Retrieves or derives audio hls variant playlist url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.audioStreamIndex - The audio stream index value required by this operation.
   * @param params.maxStreamingBitrate - The max streaming bitrate value required by this operation.
   * @returns - The normalized string representation.
   */
  getAudioHlsVariantPlaylistUrl(
    itemId: string,
    params?: { mediaSourceId?: string; audioStreamIndex?: number; maxStreamingBitrate?: number },
  ): string {
    return `${this.getBackendUrl()}/Audio/${itemId}/main.m3u8${buildQueryString({
      ...params,
      userId: this.userId,
    })}`;
  }

  /**
   * Retrieves or derives legacy hls video playlist url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param playlistId - The playlist id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.maxStreamingBitrate - The max streaming bitrate value required by this operation.
   * @returns - The normalized string representation.
   */
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

  /**
   * Retrieves or derives legacy hls audio segment url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param segmentId - The segment id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.maxStreamingBitrate - The max streaming bitrate value required by this operation.
   * @returns - The normalized string representation.
   */
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

  /**
   * Retrieves or derives item file url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  getItemFileUrl(itemId: string): string {
    return `${this.getBackendUrl()}/Items/${itemId}/File${buildQueryString({
      api_key: this.apiKey,
      userId: this.userId,
    })}`;
  }

  /**
   * Retrieves or derives kodi strm url without mutating Jellyfin state.
   * @param type - The type value required by this operation.
   * @param id - The id value required by this operation.
   * @param parentId - The parent id value required by this operation.
   * @returns - The normalized string representation.
   */
  getKodiStrmUrl(type: string, id: string, parentId?: string): string {
    const encodedType = encodeURIComponent(type);
    const encodedId = encodeURIComponent(id);
    if (!parentId) {
      return `${this.getBackendUrl()}/Kodi/${encodedType}/${encodedId}/file.strm`;
    }
    return `${this.getBackendUrl()}/Kodi/${encodedType}/${encodeURIComponent(parentId)}/${encodedId}/file.strm`;
  }

  /**
   * Retrieves or derives branding css static url without mutating Jellyfin state.
   * @returns - The normalized string representation.
   */
  getBrandingCssStaticUrl(): string {
    return `${this.getBackendUrl()}/Branding/Css.css`;
  }

  // Videos merge/split/subtitle
  /**
   * Implements merge video versions for the typed Jellyfin CLI runtime.
   * @param ids - The ids value required by this operation.
   */
  async mergeVideoVersions(ids: string[]): Promise<void> { await this.request<void>('POST', '/Videos/MergeVersions', { ids: ids.join(',') }); }
  /**
   * Implements merge episode versions for the typed Jellyfin CLI runtime.
   * @param ids - The ids value required by this operation.
   */
  async mergeEpisodeVersions(ids: string[]): Promise<void> { await this.request<void>('POST', '/MergeVersions/MergeEpisodes', undefined, { Ids: ids }); }
  /**
   * Implements merge movie versions for the typed Jellyfin CLI runtime.
   * @param ids - The ids value required by this operation.
   */
  async mergeMovieVersions(ids: string[]): Promise<void> { await this.request<void>('POST', '/MergeVersions/MergeMovies', undefined, { Ids: ids }); }
  /**
   * Implements split episode versions for the typed Jellyfin CLI runtime.
   * @param ids - The ids value required by this operation.
   */
  async splitEpisodeVersions(ids: string[]): Promise<void> { await this.request<void>('POST', '/MergeVersions/SplitEpisodes', undefined, { Ids: ids }); }
  /**
   * Implements split movie versions for the typed Jellyfin CLI runtime.
   * @param ids - The ids value required by this operation.
   */
  async splitMovieVersions(ids: string[]): Promise<void> { await this.request<void>('POST', '/MergeVersions/SplitMovies', undefined, { Ids: ids }); }
  /**
   * Performs the delete alternate sources operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   */
  async deleteAlternateSources(itemId: string): Promise<void> { await this.request<void>('DELETE', `/Videos/${itemId}/AlternateSources`); }
  /**
   * Performs the cancel active encodings operation through the typed Jellyfin API boundary.
   * @param deviceId - The device id value required by this operation.
   */
  async cancelActiveEncodings(deviceId?: string): Promise<void> { await this.request<void>('DELETE', '/Videos/ActiveEncodings', deviceId ? { deviceId } : undefined); }
  /**
   * Performs the delete subtitle operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param index - The index value required by this operation.
   */
  async deleteSubtitle(itemId: string, index: number): Promise<void> { await this.request<void>('DELETE', `/Videos/${itemId}/Subtitles/${index}`); }
  /**
   * Performs the upload subtitle operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.language - The language value required by this operation.
   * @param params.format - The requested machine-readable or human-readable output format.
   * @param params.data - The typed payload to format or submit.
   * @param params.isForced - The is forced value required by this operation.
   * @returns - The normalized string representation.
   */
  async uploadSubtitle(itemId: string, params: { language: string; format: string; data: string; isForced?: boolean }): Promise<void> { await this.request<void>('POST', `/Videos/${itemId}/Subtitles`, undefined, params); }

  // Fallback fonts
  /**
   * Retrieves or derives fallback fonts without mutating Jellyfin state.
   * @returns - The typed get fallback fonts result.
   */
  async getFallbackFonts(): Promise<{ Name?: string; Filename?: string; FileSize?: number; DateCreated?: string }[]> { return this.request<{ Name?: string; Filename?: string; FileSize?: number; DateCreated?: string }[]>('GET', '/FallbackFont/Fonts'); }
  /**
   * Retrieves or derives fallback font without mutating Jellyfin state.
   * @param name - The name value required by this operation.
   * @returns - The normalized string representation.
   */
  async getFallbackFont(name: string): Promise<ArrayBuffer> { return this.request<ArrayBuffer>('GET', `/FallbackFont/Fonts/${encodeURIComponent(name)}`); }

  // Live streams
  /**
   * Implements open live stream for the typed Jellyfin CLI runtime.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.openToken - The open token value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.playSessionId - The play session id value required by this operation.
   * @param params.maxStreamingBitrate - The max streaming bitrate value required by this operation.
   * @param params.itemId - The item id value required by this operation.
   * @param params.enableDirectPlay - The enable direct play value required by this operation.
   * @param params.enableDirectStream - The enable direct stream value required by this operation.
   * @returns - The typed open live stream result.
   */
  async openLiveStream(params: { openToken?: string; userId?: string; playSessionId?: string; maxStreamingBitrate?: number; itemId?: string; enableDirectPlay?: boolean; enableDirectStream?: boolean }): Promise<{ MediaSource?: Record<string, unknown>; MediaSourceId?: string }> { return this.request<{ MediaSource?: Record<string, unknown>; MediaSourceId?: string }>('POST', '/LiveStreams/Open', undefined, params); }
  /**
   * Implements close live stream for the typed Jellyfin CLI runtime.
   * @param liveStreamId - The live stream id value required by this operation.
   */
  async closeLiveStream(liveStreamId: string): Promise<void> { await this.request<void>('POST', '/LiveStreams/Close', undefined, { LiveStreamId: liveStreamId }); }

  // Reports plugin
  /**
   * Retrieves or derives activity report without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.limit - The limit value required by this operation.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.minDate - The min date value required by this operation.
   * @returns - The typed get activity report result.
   */
  async getActivityReport(params?: { limit?: number; startIndex?: number; minDate?: string }): Promise<{ Rows?: { Columns?: { Name?: string }[]; Id?: string; RowType?: string }[]; TotalRecordCount?: number }> { return this.request<{ Rows?: { Columns?: { Name?: string }[]; Id?: string; RowType?: string }[]; TotalRecordCount?: number }>('GET', '/Reports/Activities', params); }
  /**
   * Retrieves or derives items report without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.reportView - The report view value required by this operation.
   * @param params.displayType - The display type value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.startIndex - The start index value required by this operation.
   * @returns - The typed get items report result.
   */
  async getItemsReport(params?: { reportView?: string; displayType?: string; limit?: number; startIndex?: number }): Promise<{ Rows?: { Columns?: { Name?: string }[] }[]; TotalRecordCount?: number }> { return this.request<{ Rows?: { Columns?: { Name?: string }[] }[]; TotalRecordCount?: number }>('GET', '/Reports/Items', params); }
  /**
   * Retrieves or derives report headers without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.reportView - The report view value required by this operation.
   * @param params.displayType - The display type value required by this operation.
   * @returns - The typed get report headers result.
   */
  async getReportHeaders(params?: { reportView?: string; displayType?: string }): Promise<{ Name?: string; FieldName?: string; DisplayType?: string }[]> { return this.request<{ Name?: string; FieldName?: string; DisplayType?: string }[]>('GET', '/Reports/Headers', params); }

  // Localization
  /**
   * Retrieves or derives localization options without mutating Jellyfin state.
   * @returns - The typed get localization options result.
   */
  async getLocalizationOptions(): Promise<LocalizationOption[]> { return this.request<LocalizationOption[]>('GET', '/Localization/Options'); }
  /**
   * Retrieves or derives countries without mutating Jellyfin state.
   * @returns - The typed get countries result.
   */
  async getCountries(): Promise<CountryInfo[]> { return this.request<CountryInfo[]>('GET', '/Localization/Countries'); }
  /**
   * Retrieves or derives cultures without mutating Jellyfin state.
   * @returns - The typed get cultures result.
   */
  async getCultures(): Promise<CultureDto[]> { return this.request<CultureDto[]>('GET', '/Localization/Cultures'); }
  /**
   * Retrieves or derives rating systems without mutating Jellyfin state.
   * @returns - The typed get rating systems result.
   */
  async getRatingSystems(): Promise<{ Name?: string; CountryCode?: string }[]> { return this.request<{ Name?: string; CountryCode?: string }[]>('GET', '/Localization/ParentalRatings'); }

  // QuickConnect & Auth
  /**
   * Implements quick connect enabled for the typed Jellyfin CLI runtime.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async quickConnectEnabled(): Promise<boolean> { return this.request<boolean>('GET', '/QuickConnect/Enabled'); }
  /**
   * Implements quick connect initiate for the typed Jellyfin CLI runtime.
   * @returns - The typed quick connect initiate result.
   */
  async quickConnectInitiate(): Promise<QuickConnectResult> { return this.request<QuickConnectResult>('POST', '/QuickConnect/Initiate'); }
  /**
   * Implements quick connect connect for the typed Jellyfin CLI runtime.
   * @param secret - The secret value required by this operation.
   * @returns - The normalized string representation.
   */
  async quickConnectConnect(secret: string): Promise<QuickConnectResult> { return this.request<QuickConnectResult>('GET', '/QuickConnect/Connect', { secret }); }
  /**
   * Implements quick connect authorize for the typed Jellyfin CLI runtime.
   * @param code - The code value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async quickConnectAuthorize(code: string, userId?: string): Promise<boolean> { return this.request<boolean>('POST', '/QuickConnect/Authorize', { code, userId }); }
  /**
   * Retrieves or derives auth providers without mutating Jellyfin state.
   * @returns - The typed get auth providers result.
   */
  async getAuthProviders(): Promise<{ Name?: string; Id?: string }[]> { return this.request<{ Name?: string; Id?: string }[]>('GET', '/Auth/Providers'); }
  /**
   * Retrieves or derives password reset providers without mutating Jellyfin state.
   * @returns - The typed get password reset providers result.
   */
  async getPasswordResetProviders(): Promise<{ Name?: string; Id?: string }[]> { return this.request<{ Name?: string; Id?: string }[]>('GET', '/Auth/PasswordResetProviders'); }

  // Metadata editor & library options
  /**
   * Retrieves or derives metadata editor info without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getMetadataEditorInfo(itemId: string): Promise<Record<string, unknown>> { return this.request<Record<string, unknown>>('GET', `/Items/${itemId}/MetadataEditor`); }
  /**
   * Retrieves or derives available library options without mutating Jellyfin state.
   * @returns - The normalized string representation.
   */
  async getAvailableLibraryOptions(): Promise<Record<string, unknown>> { return this.request<Record<string, unknown>>('GET', '/Libraries/AvailableOptions'); }
  /**
   * Retrieves or derives default metadata options without mutating Jellyfin state.
   * @returns - The normalized string representation.
   */
  async getDefaultMetadataOptions(): Promise<Record<string, unknown>> { return this.request<Record<string, unknown>>('GET', '/System/Configuration/MetadataOptions/Default'); }

  // Usage Stats (PlaybackReportingActivity plugin)
  /**
   * Retrieves or derives usage play activity without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.days - The days value required by this operation.
   * @param params.endDate - The end date value required by this operation.
   * @param params.filter - The filter value required by this operation.
   * @param params.dataType - The data type value required by this operation.
   * @returns - The typed get usage play activity result.
   */
  async getUsagePlayActivity(params?: { days?: number; endDate?: string; filter?: string; dataType?: string }): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/PlayActivity', params); }
  /**
   * Retrieves or derives user activity without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.days - The days value required by this operation.
   * @param params.endDate - The end date value required by this operation.
   * @param params.filter - The filter value required by this operation.
   * @returns - The typed get user activity result.
   */
  async getUserActivity(params?: { days?: number; endDate?: string; filter?: string }): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/user_activity', params); }
  /**
   * Retrieves or derives hourly report without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.days - The days value required by this operation.
   * @param params.endDate - The end date value required by this operation.
   * @param params.filter - The filter value required by this operation.
   * @param params.dataType - The data type value required by this operation.
   * @returns - The typed get hourly report result.
   */
  async getHourlyReport(params?: { days?: number; endDate?: string; filter?: string; dataType?: string }): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/HourlyReport', params); }
  /**
   * Retrieves or derives breakdown report without mutating Jellyfin state.
   * @param breakdownType - The breakdown type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.days - The days value required by this operation.
   * @param params.endDate - The end date value required by this operation.
   * @param params.filter - The filter value required by this operation.
   * @returns - The normalized string representation.
   */
  async getBreakdownReport(breakdownType: string, params?: { days?: number; endDate?: string; filter?: string }): Promise<unknown> { return this.request<unknown>('GET', `/user_usage_stats/${encodeURIComponent(breakdownType)}/BreakdownReport`, params); }
  /**
   * Retrieves or derives movies report without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.days - The days value required by this operation.
   * @param params.endDate - The end date value required by this operation.
   * @param params.filter - The filter value required by this operation.
   * @returns - The typed get movies report result.
   */
  async getMoviesReport(params?: { days?: number; endDate?: string; filter?: string }): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/MoviesReport', params); }
  /**
   * Retrieves or derives tv shows report without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.days - The days value required by this operation.
   * @param params.endDate - The end date value required by this operation.
   * @param params.filter - The filter value required by this operation.
   * @returns - The typed get tv shows report result.
   */
  async getTvShowsReport(params?: { days?: number; endDate?: string; filter?: string }): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/GetTvShowsReport', params); }
  /**
   * Retrieves or derives duration histogram report without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.days - The days value required by this operation.
   * @param params.endDate - The end date value required by this operation.
   * @param params.filter - The filter value required by this operation.
   * @param params.dataType - The data type value required by this operation.
   * @returns - The typed get duration histogram report result.
   */
  async getDurationHistogramReport(params?: { days?: number; endDate?: string; filter?: string; dataType?: string }): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/DurationHistogramReport', params); }
  /**
   * Retrieves or derives usage user list without mutating Jellyfin state.
   * @returns - The typed get usage user list result.
   */
  async getUsageUserList(): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/user_list'); }
  /**
   * Retrieves or derives usage type filter list without mutating Jellyfin state.
   * @returns - The typed get usage type filter list result.
   */
  async getUsageTypeFilterList(): Promise<unknown> { return this.request<unknown>('GET', '/user_usage_stats/type_filter_list'); }
  /**
   * Retrieves or derives user report data without mutating Jellyfin state.
   * @param userId - The stable Jellyfin user identifier.
   * @param date - The date value required by this operation.
   * @returns - The normalized string representation.
   */
  async getUserReportData(userId: string, date: string): Promise<unknown> { return this.request<unknown>('GET', `/user_usage_stats/${userId}/${date}/GetItems`); }

  // Named lookups
  /**
   * Retrieves or derives artist by name without mutating Jellyfin state.
   * @param name - The name value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getArtistByName(name: string, userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; return this.request<BaseItemDto>('GET', `/Artists/${encodeURIComponent(name)}`, { userId: uid }); }
  /**
   * Retrieves or derives genre by name without mutating Jellyfin state.
   * @param name - The name value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getGenreByName(name: string, userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; return this.request<BaseItemDto>('GET', `/Genres/${encodeURIComponent(name)}`, { userId: uid }); }
  /**
   * Retrieves or derives studio by name without mutating Jellyfin state.
   * @param name - The name value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getStudioByName(name: string, userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; return this.request<BaseItemDto>('GET', `/Studios/${encodeURIComponent(name)}`, { userId: uid }); }
  /**
   * Retrieves or derives person by name without mutating Jellyfin state.
   * @param name - The name value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getPersonByName(name: string, userId?: string): Promise<BaseItemDto> { const uid = userId ?? this.userId; return this.request<BaseItemDto>('GET', `/Persons/${encodeURIComponent(name)}`, { userId: uid }); }

  // Collections
  /**
   * Performs the create collection operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.name - The name value required by this operation.
   * @param params.ids - The ids value required by this operation.
   * @param params.parentId - The parent id value required by this operation.
   * @returns - The typed create collection result.
   */
  async createCollection(params: { name: string; ids?: string[]; parentId?: string }): Promise<{ Id?: string }> { return this.request<{ Id?: string }>('POST', '/Collections', { ...params, ids: params.ids?.join(',') }); }
  /**
   * Performs the add to collection operation through the typed Jellyfin API boundary.
   * @param collectionId - The collection id value required by this operation.
   * @param ids - The ids value required by this operation.
   */
  async addToCollection(collectionId: string, ids: string[]): Promise<void> { await this.request<void>('POST', `/Collections/${collectionId}/Items`, { ids: ids.join(',') }); }
  /**
   * Performs the remove from collection operation through the typed Jellyfin API boundary.
   * @param collectionId - The collection id value required by this operation.
   * @param ids - The ids value required by this operation.
   */
  async removeFromCollection(collectionId: string, ids: string[]): Promise<void> { await this.request<void>('DELETE', `/Collections/${collectionId}/Items`, { ids: ids.join(',') }); }

  // Environment
  /**
   * Retrieves or derives drives without mutating Jellyfin state.
   * @returns - The typed get drives result.
   */
  async getDrives(): Promise<{ Name?: string; Path?: string }[]> { return this.request<{ Name?: string; Path?: string }[]>('GET', '/Environment/Drives'); }
  /**
   * Retrieves or derives directory contents without mutating Jellyfin state.
   * @param path - The API, command, or filesystem path to process.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.includeFiles - The include files value required by this operation.
   * @param params.includeDirectories - The include directories value required by this operation.
   * @returns - The normalized string representation.
   */
  async getDirectoryContents(path: string, params?: { includeFiles?: boolean; includeDirectories?: boolean }): Promise<{ Name?: string; Path?: string; Type?: string }[]> { return this.request<{ Name?: string; Path?: string; Type?: string }[]>('GET', '/Environment/DirectoryContents', { path, ...params }); }
  /**
   * Retrieves or derives network shares without mutating Jellyfin state.
   * @returns - The typed get network shares result.
   */
  async getNetworkShares(): Promise<{ Name?: string; Path?: string }[]> { return this.request<{ Name?: string; Path?: string }[]>('GET', '/Environment/NetworkShares'); }
  /**
   * Retrieves or derives parent path without mutating Jellyfin state.
   * @param path - The API, command, or filesystem path to process.
   * @returns - The normalized string representation.
   */
  async getParentPath(path: string): Promise<string> { return this.request<string>('GET', '/Environment/ParentPath', { path }); }
  /**
   * Produces the validated validate path result used by CLI automation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.path - The API, command, or filesystem path to process.
   * @param params.isFile - The is file value required by this operation.
   * @returns - The typed validate path result.
   */
  async validatePath(params: { path: string; isFile?: boolean }): Promise<void> { await this.request<void>('POST', '/Environment/ValidatePath', undefined, params); }

  // Backup
  /**
   * Retrieves or derives backups without mutating Jellyfin state.
   * @returns - The typed get backups result.
   */
  async getBackups(): Promise<BackupInfo[]> { return this.request<BackupInfo[]>('GET', '/Backup'); }
  /**
   * Performs the create backup operation through the typed Jellyfin API boundary.
   */
  async createBackup(): Promise<void> { await this.request<void>('POST', '/Backup/Create'); }
  /**
   * Implements restore backup for the typed Jellyfin CLI runtime.
   * @param backupPath - The backup path value required by this operation.
   */
  async restoreBackup(backupPath: string): Promise<void> { await this.request<void>('POST', '/Backup/Restore', undefined, { backupPath }); }
  /**
   * Performs the delete backup operation through the typed Jellyfin API boundary.
   * @param backupPath - The backup path value required by this operation.
   */
  async deleteBackup(backupPath: string): Promise<void> { await this.request<void>('DELETE', `/Backup/${encodeURIComponent(backupPath)}`); }

  // Library Structure
  /**
   * Retrieves or derives virtual folders without mutating Jellyfin state.
   * @returns - The typed get virtual folders result.
   */
  async getVirtualFolders(): Promise<VirtualFolderInfo[]> { return this.request<VirtualFolderInfo[]>('GET', '/Library/VirtualFolders'); }
  /**
   * Performs the add virtual folder operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   */
  async addVirtualFolder(params: AddVirtualFolderParams): Promise<void> { const { name, collectionType, paths, refreshLibrary } = params; await this.request<void>('POST', '/Library/VirtualFolders', { name, collectionType, refreshLibrary }, { LibraryOptions: {}, Paths: paths }); }
  /**
   * Performs the remove virtual folder operation through the typed Jellyfin API boundary.
   * @param name - The name value required by this operation.
   * @param refreshLibrary - The refresh library value required by this operation.
   */
  async removeVirtualFolder(name: string, refreshLibrary?: boolean): Promise<void> { await this.request<void>('DELETE', '/Library/VirtualFolders', { name, refreshLibrary }); }
  /**
   * Implements rename virtual folder for the typed Jellyfin CLI runtime.
   * @param name - The name value required by this operation.
   * @param newName - The new name value required by this operation.
   * @param refreshLibrary - The refresh library value required by this operation.
   */
  async renameVirtualFolder(name: string, newName: string, refreshLibrary?: boolean): Promise<void> { await this.request<void>('POST', '/Library/VirtualFolders/Name', { name, newName, refreshLibrary }); }
  /**
   * Performs the add media path operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   */
  async addMediaPath(params: AddMediaPathParams): Promise<void> { const { name, path, networkPath, refreshLibrary } = params; await this.request<void>('POST', '/Library/VirtualFolders/Paths', { refreshLibrary }, { Name: name, PathInfo: { Path: path, NetworkPath: networkPath } }); }
  /**
   * Performs the remove media path operation through the typed Jellyfin API boundary.
   * @param name - The name value required by this operation.
   * @param path - The API, command, or filesystem path to process.
   * @param refreshLibrary - The refresh library value required by this operation.
   */
  async removeMediaPath(name: string, path: string, refreshLibrary?: boolean): Promise<void> { await this.request<void>('DELETE', '/Library/VirtualFolders/Paths', { name, path, refreshLibrary }); }
  /**
   * Performs the update media path operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   */
  async updateMediaPath(params: UpdateMediaPathParams): Promise<void> { const { name, pathInfo } = params; await this.request<void>('POST', '/Library/VirtualFolders/Paths/Update', undefined, { Name: name, PathInfo: pathInfo }); }

  // Scheduled Tasks
  /**
   * Retrieves or derives task triggers without mutating Jellyfin state.
   * @param taskId - The task id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getTaskTriggers(taskId: string): Promise<{ Id?: string; Type?: string; IntervalTicks?: number; TimeOfDayTicks?: number; DayOfWeek?: string[] }[]> { return this.request<{ Id?: string; Type?: string; IntervalTicks?: number; TimeOfDayTicks?: number; DayOfWeek?: string[] }[]>('GET', `/ScheduledTasks/${taskId}/Triggers`); }
  /**
   * Performs the create task trigger operation through the typed Jellyfin API boundary.
   * @param taskId - The task id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.type - The type value required by this operation.
   * @param params.intervalTicks - The interval ticks value required by this operation.
   * @param params.timeOfDayTicks - The time of day ticks value required by this operation.
   * @param params.dayOfWeek - The day of week value required by this operation.
   * @returns - The normalized string representation.
   */
  async createTaskTrigger(taskId: string, params: { type: string; intervalTicks?: number; timeOfDayTicks?: number; dayOfWeek?: string[] }): Promise<void> { await this.request<void>('POST', `/ScheduledTasks/${taskId}/Triggers`, undefined, params); }
  /**
   * Performs the delete task trigger operation through the typed Jellyfin API boundary.
   * @param taskId - The task id value required by this operation.
   * @param triggerId - The trigger id value required by this operation.
   */
  async deleteTaskTrigger(taskId: string, triggerId: string): Promise<void> { await this.request<void>('DELETE', `/ScheduledTasks/${taskId}/Triggers/${triggerId}`); }

  /**
   * Retrieves or derives physical paths without mutating Jellyfin state.
   * @returns - The normalized string representation.
   */
  async getPhysicalPaths(): Promise<string[]> { return this.request<string[]>('GET', '/Library/PhysicalPaths'); }
  /**
   * Retrieves or derives media folders without mutating Jellyfin state.
   * @param isHidden - The is hidden value required by this operation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async getMediaFolders(isHidden?: boolean): Promise<QueryResult<BaseItemDto>> { return this.request<QueryResult<BaseItemDto>>('GET', '/Library/MediaFolders', { isHidden }); }

  // Startup wizard state (read-only)
  /**
   * Retrieves or derives startup configuration without mutating Jellyfin state.
   * @returns - The typed get startup configuration result.
   */
  async getStartupConfiguration(): Promise<StartupConfiguration> {
    return this.request<StartupConfiguration>('GET', '/Startup/Configuration');
  }
  /**
   * Performs the update startup configuration operation through the typed Jellyfin API boundary.
   * @param config - The resolved Jellyfin client configuration.
   */
  async updateStartupConfiguration(config: StartupConfiguration): Promise<void> {
    await this.request<void>('POST', '/Startup/Configuration', undefined, config);
  }
  /**
   * Retrieves or derives startup first user without mutating Jellyfin state.
   * @returns - The typed get startup first user result.
   */
  async getStartupFirstUser(): Promise<StartupFirstUser> {
    return this.request<StartupFirstUser>('GET', '/Startup/FirstUser');
  }
  /**
   * Produces the validated is startup complete result used by CLI automation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async isStartupComplete(): Promise<boolean> {
    return this.request<boolean>('GET', '/Startup/Complete');
  }
}
