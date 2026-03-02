import type { LocalizationOption, CountryInfo, CultureDto, QuickConnectResult } from '../types/index.js';
import { CoreApi } from './core-api.js';

export class JellyfinExtensions extends CoreApi {
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
}
