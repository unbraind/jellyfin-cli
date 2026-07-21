import { ApiClientBase } from './base.js';
import type { BaseItemDto, QueryResult, LiveTvInfo } from '../types/index.js';

/**
 * Defines the live tv timer params contract used across typed Jellyfin boundaries.
 */
export interface LiveTvTimerParams {
  programId?: string; channelId?: string; startDate?: string; endDate?: string;
  name?: string; prePaddingSeconds?: number; postPaddingSeconds?: number;
  isPrePaddingRequired?: boolean; isPostPaddingRequired?: boolean; priority?: number;
}

/**
 * Defines the live tv series timer params contract used across typed Jellyfin boundaries.
 */
export interface LiveTvSeriesTimerParams extends LiveTvTimerParams {
  recordAnyTime?: boolean; recordAnyChannel?: boolean; recordNewOnly?: boolean; days?: string[];
}

/**
 * Defines the tuner host info contract used across typed Jellyfin boundaries.
 */
export interface TunerHostInfo {
  Id?: string; Url?: string; Type?: string; UserAgent?: string;
  FriendlyName?: string; DataVersion?: string; DeviceProfileId?: string;
  EnabledTunerCount?: number; AllowHWTranscoding?: boolean; ImportFavoritesOnly?: boolean;
  MinimumRemuxBitrate?: number;
}

/**
 * Defines the listing provider info contract used across typed Jellyfin boundaries.
 */
export interface ListingProviderInfo {
  Id?: string; Type?: string; Username?: string; Password?: string;
  ListingsId?: string; ZipCode?: string; Country?: string; Path?: string;
  EnabledTuners?: string[]; EnableAllTuners?: boolean; NewsCategories?: string[];
  SportsCategories?: string[]; KidsCategories?: string[]; MovieCategories?: string[];
  ChannelMappings?: Record<string, string>[]; MoviePrefix?: string;
  PreferredLanguage?: string; UserAgent?: string;
}

/**
 * Provides live tv api behavior for the Jellyfin client and command runtime.
 */
export class LiveTvApi extends ApiClientBase {
  /**
   * Retrieves or derives live tv info without mutating Jellyfin state.
   * @returns - The typed get live tv info result.
   */
  async getLiveTvInfo(): Promise<LiveTvInfo> {
    return this.request<LiveTvInfo>('GET', '/LiveTv/Info');
  }

  /**
   * Retrieves or derives live tv channels without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @returns - The typed get live tv channels result.
   */
  async getLiveTvChannels(params?: { startIndex?: number; limit?: number; userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Channels', { ...params, userId });
  }

  /**
   * Retrieves or derives live tv channel without mutating Jellyfin state.
   * @param channelId - The channel id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getLiveTvChannel(channelId: string, userId?: string): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', `/LiveTv/Channels/${channelId}`, {
      userId: userId ?? this.userId,
    });
  }

  /**
   * Retrieves or derives live tv programs without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.channelId - The channel id value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.minStartDate - The min start date value required by this operation.
   * @param params.maxStartDate - The max start date value required by this operation.
   * @param params.hasAired - The has aired value required by this operation.
   * @returns - The typed get live tv programs result.
   */
  async getLiveTvPrograms(params?: { channelId?: string; userId?: string; startIndex?: number; limit?: number; minStartDate?: string; maxStartDate?: string; hasAired?: boolean }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Programs', { ...params, userId });
  }

  /**
   * Retrieves or derives live tv program without mutating Jellyfin state.
   * @param programId - The program id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getLiveTvProgram(programId: string, userId?: string): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', `/LiveTv/Programs/${programId}`, { userId: userId ?? this.userId });
  }

  /**
   * Retrieves or derives live tv recordings without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @returns - The typed get live tv recordings result.
   */
  async getLiveTvRecordings(params?: { userId?: string; startIndex?: number; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Recordings', { ...params, userId });
  }

  /**
   * Retrieves or derives live tv series recordings without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @returns - The typed get live tv series recordings result.
   */
  async getLiveTvSeriesRecordings(params?: { userId?: string; startIndex?: number; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Recordings/Series', { ...params, userId });
  }

  /**
   * Retrieves or derives live tv timer without mutating Jellyfin state.
   * @param id - The id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getLiveTvTimer(id: string): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', `/LiveTv/Timers/${id}`);
  }

  /**
   * Retrieves or derives live tv timers without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.channelId - The channel id value required by this operation.
   * @returns - The typed get live tv timers result.
   */
  async getLiveTvTimers(params?: { channelId?: string }): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Timers', params);
  }

  /**
   * Retrieves or derives live tv timer defaults without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.programId - The program id value required by this operation.
   * @returns - The typed get live tv timer defaults result.
   */
  async getLiveTvTimerDefaults(params?: { programId?: string }): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', '/LiveTv/Timers/Defaults', params);
  }

  /**
   * Performs the create live tv timer operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   */
  async createLiveTvTimer(params: LiveTvTimerParams): Promise<void> {
    await this.request<void>('POST', '/LiveTv/Timers', undefined, params);
  }

  /**
   * Performs the update live tv timer operation through the typed Jellyfin API boundary.
   * @param timerId - The timer id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   */
  async updateLiveTvTimer(timerId: string, params: LiveTvTimerParams): Promise<void> {
    await this.request<void>('POST', `/LiveTv/Timers/${timerId}`, undefined, params);
  }

  /**
   * Performs the delete live tv timer operation through the typed Jellyfin API boundary.
   * @param timerId - The timer id value required by this operation.
   */
  async deleteLiveTvTimer(timerId: string): Promise<void> {
    await this.request<void>('DELETE', `/LiveTv/Timers/${timerId}`);
  }

  /**
   * Retrieves or derives live tv series timers without mutating Jellyfin state.
   * @returns - The typed get live tv series timers result.
   */
  async getLiveTvSeriesTimers(): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/SeriesTimers');
  }

  /**
   * Retrieves or derives live tv series timer without mutating Jellyfin state.
   * @param id - The id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getLiveTvSeriesTimer(id: string): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', `/LiveTv/SeriesTimers/${id}`);
  }

  /**
   * Performs the create live tv series timer operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   */
  async createLiveTvSeriesTimer(params: LiveTvSeriesTimerParams): Promise<void> {
    await this.request<void>('POST', '/LiveTv/SeriesTimers', undefined, params);
  }

  /**
   * Performs the delete live tv series timer operation through the typed Jellyfin API boundary.
   * @param id - The id value required by this operation.
   */
  async deleteLiveTvSeriesTimer(id: string): Promise<void> {
    await this.request<void>('DELETE', `/LiveTv/SeriesTimers/${id}`);
  }

  /**
   * Retrieves or derives live tv guide info without mutating Jellyfin state.
   * @returns - The typed get live tv guide info result.
   */
  async getLiveTvGuideInfo(): Promise<{ StartDate?: string; EndDate?: string }> {
    return this.request<{ StartDate?: string; EndDate?: string }>('GET', '/LiveTv/GuideInfo');
  }

  /**
   * Retrieves or derives live tv recommended programs without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @param params.isAiring - The is airing value required by this operation.
   * @param params.hasAired - The has aired value required by this operation.
   * @returns - The typed get live tv recommended programs result.
   */
  async getLiveTvRecommendedPrograms(params?: { userId?: string; limit?: number; isAiring?: boolean; hasAired?: boolean }): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Programs/Recommended', { ...params, userId: params?.userId ?? this.userId });
  }

  /**
   * Retrieves or derives live tv recording folders without mutating Jellyfin state.
   * @returns - The typed get live tv recording folders result.
   */
  async getLiveTvRecordingFolders(): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Recordings/Folders');
  }

  /**
   * Retrieves or derives live tv recording groups without mutating Jellyfin state.
   * @returns - The typed get live tv recording groups result.
   */
  async getLiveTvRecordingGroups(): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Recordings/Groups');
  }

  /**
   * Retrieves or derives live tv recording by id without mutating Jellyfin state.
   * @param id - The id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getLiveTvRecordingById(id: string): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', `/LiveTv/Recordings/${id}`);
  }

  /**
   * Performs the delete live tv recording operation through the typed Jellyfin API boundary.
   * @param id - The id value required by this operation.
   */
  async deleteLiveTvRecording(id: string): Promise<void> {
    await this.request<void>('DELETE', `/LiveTv/Recordings/${id}`);
  }

  /**
   * Implements discover tuners for the typed Jellyfin CLI runtime.
   * @returns - The typed discover tuners result.
   */
  async discoverTuners(): Promise<{ Type?: string; Url?: string }[]> {
    return this.request<{ Type?: string; Url?: string }[]>('GET', '/LiveTv/Tuners/Discover');
  }

  /**
   * Retrieves or derives tuner host types without mutating Jellyfin state.
   * @returns - The typed get tuner host types result.
   */
  async getTunerHostTypes(): Promise<{ Name?: string; Id?: string }[]> {
    return this.request<{ Name?: string; Id?: string }[]>('GET', '/LiveTv/TunerHosts/Types');
  }

  /**
   * Retrieves or derives schedules direct countries without mutating Jellyfin state.
   * @returns - The typed get schedules direct countries result.
   */
  async getSchedulesDirectCountries(): Promise<unknown> {
    return this.request<unknown>('GET', '/LiveTv/ListingProviders/SchedulesDirect/Countries');
  }

  /**
   * Performs the add tuner host operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @returns - The typed add tuner host result.
   */
  async addTunerHost(params: TunerHostInfo): Promise<TunerHostInfo> {
    return this.request<TunerHostInfo>('POST', '/LiveTv/TunerHosts', undefined, params);
  }

  /**
   * Performs the delete tuner host operation through the typed Jellyfin API boundary.
   * @param id - The id value required by this operation.
   */
  async deleteTunerHost(id: string): Promise<void> {
    await this.request<void>('DELETE', '/LiveTv/TunerHosts', { id });
  }

  /**
   * Implements reset tuner for the typed Jellyfin CLI runtime.
   * @param tunerId - The tuner id value required by this operation.
   */
  async resetTuner(tunerId: string): Promise<void> {
    await this.request<void>('POST', `/LiveTv/Tuners/${tunerId}/Reset`);
  }

  /**
   * Performs the add listing provider operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @returns - The typed add listing provider result.
   */
  async addListingProvider(params: ListingProviderInfo): Promise<ListingProviderInfo> {
    return this.request<ListingProviderInfo>('POST', '/LiveTv/ListingProviders', undefined, params);
  }

  /**
   * Performs the delete listing provider operation through the typed Jellyfin API boundary.
   * @param id - The id value required by this operation.
   */
  async deleteListingProvider(id: string): Promise<void> {
    await this.request<void>('DELETE', '/LiveTv/ListingProviders', { id });
  }

  /**
   * Retrieves or derives channel mapping options without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.providerId - The provider id value required by this operation.
   * @returns - The typed get channel mapping options result.
   */
  async getChannelMappingOptions(params?: { providerId?: string }): Promise<{ TunerChannels?: { Name?: string; Id?: string }[]; ProviderChannels?: { Name?: string; Id?: string }[]; Mappings?: Record<string, string>[]; ProviderName?: string }> {
    return this.request<{ TunerChannels?: { Name?: string; Id?: string }[]; ProviderChannels?: { Name?: string; Id?: string }[]; Mappings?: Record<string, string>[]; ProviderName?: string }>('GET', '/LiveTv/ChannelMappingOptions', params);
  }

  /**
   * Performs the set channel mappings operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.providerId - The provider id value required by this operation.
   * @param params.mappings - The mappings value required by this operation.
   * @returns - The typed set channel mappings result.
   */
  async setChannelMappings(params: { providerId: string; mappings: Record<string, string>[] }): Promise<void> {
    await this.request<void>('POST', '/LiveTv/ChannelMappings', undefined, params);
  }
}

export type { LiveTvInfo };
