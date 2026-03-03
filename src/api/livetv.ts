import { ApiClientBase } from './base.js';
import type { BaseItemDto, QueryResult, LiveTvInfo } from '../types/index.js';

export interface LiveTvTimerParams {
  programId?: string; channelId?: string; startDate?: string; endDate?: string;
  name?: string; prePaddingSeconds?: number; postPaddingSeconds?: number;
  isPrePaddingRequired?: boolean; isPostPaddingRequired?: boolean; priority?: number;
}

export interface LiveTvSeriesTimerParams extends LiveTvTimerParams {
  recordAnyTime?: boolean; recordAnyChannel?: boolean; recordNewOnly?: boolean; days?: string[];
}

export interface TunerHostInfo {
  Id?: string; Url?: string; Type?: string; UserAgent?: string;
  FriendlyName?: string; DataVersion?: string; DeviceProfileId?: string;
  EnabledTunerCount?: number; AllowHWTranscoding?: boolean; ImportFavoritesOnly?: boolean;
  MinimumRemuxBitrate?: number;
}

export interface ListingProviderInfo {
  Id?: string; Type?: string; Username?: string; Password?: string;
  ListingsId?: string; ZipCode?: string; Country?: string; Path?: string;
  EnabledTuners?: string[]; EnableAllTuners?: boolean; NewsCategories?: string[];
  SportsCategories?: string[]; KidsCategories?: string[]; MovieCategories?: string[];
  ChannelMappings?: Record<string, string>[]; MoviePrefix?: string;
  PreferredLanguage?: string; UserAgent?: string;
}

export class LiveTvApi extends ApiClientBase {
  async getLiveTvInfo(): Promise<LiveTvInfo> {
    return this.request<LiveTvInfo>('GET', '/LiveTv/Info');
  }

  async getLiveTvChannels(params?: { startIndex?: number; limit?: number; userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Channels', { ...params, userId });
  }

  async getLiveTvChannel(channelId: string, userId?: string): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', `/LiveTv/Channels/${channelId}`, {
      userId: userId ?? this.userId,
    });
  }

  async getLiveTvPrograms(params?: { channelId?: string; userId?: string; startIndex?: number; limit?: number; minStartDate?: string; maxStartDate?: string; hasAired?: boolean }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Programs', { ...params, userId });
  }

  async getLiveTvProgram(programId: string, userId?: string): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', `/LiveTv/Programs/${programId}`, { userId: userId ?? this.userId });
  }

  async getLiveTvRecordings(params?: { userId?: string; startIndex?: number; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Recordings', { ...params, userId });
  }

  async getLiveTvSeriesRecordings(params?: { userId?: string; startIndex?: number; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Recordings/Series', { ...params, userId });
  }

  async getLiveTvTimer(id: string): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', `/LiveTv/Timers/${id}`);
  }

  async getLiveTvTimers(params?: { channelId?: string }): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Timers', params);
  }

  async getLiveTvTimerDefaults(params?: { programId?: string }): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', '/LiveTv/Timers/Defaults', params);
  }

  async createLiveTvTimer(params: LiveTvTimerParams): Promise<void> {
    await this.request<void>('POST', '/LiveTv/Timers', undefined, params);
  }

  async updateLiveTvTimer(timerId: string, params: LiveTvTimerParams): Promise<void> {
    await this.request<void>('POST', `/LiveTv/Timers/${timerId}`, undefined, params);
  }

  async deleteLiveTvTimer(timerId: string): Promise<void> {
    await this.request<void>('DELETE', `/LiveTv/Timers/${timerId}`);
  }

  async getLiveTvSeriesTimers(): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/SeriesTimers');
  }

  async getLiveTvSeriesTimer(id: string): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', `/LiveTv/SeriesTimers/${id}`);
  }

  async createLiveTvSeriesTimer(params: LiveTvSeriesTimerParams): Promise<void> {
    await this.request<void>('POST', '/LiveTv/SeriesTimers', undefined, params);
  }

  async deleteLiveTvSeriesTimer(id: string): Promise<void> {
    await this.request<void>('DELETE', `/LiveTv/SeriesTimers/${id}`);
  }

  async getLiveTvGuideInfo(): Promise<{ StartDate?: string; EndDate?: string }> {
    return this.request<{ StartDate?: string; EndDate?: string }>('GET', '/LiveTv/GuideInfo');
  }

  async getLiveTvRecommendedPrograms(params?: { userId?: string; limit?: number; isAiring?: boolean; hasAired?: boolean }): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Programs/Recommended', { ...params, userId: params?.userId ?? this.userId });
  }

  async getLiveTvRecordingFolders(): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Recordings/Folders');
  }

  async getLiveTvRecordingGroups(): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', '/LiveTv/Recordings/Groups');
  }

  async getLiveTvRecordingById(id: string): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', `/LiveTv/Recordings/${id}`);
  }

  async deleteLiveTvRecording(id: string): Promise<void> {
    await this.request<void>('DELETE', `/LiveTv/Recordings/${id}`);
  }

  async discoverTuners(): Promise<{ Type?: string; Url?: string }[]> {
    return this.request<{ Type?: string; Url?: string }[]>('GET', '/LiveTv/Tuners/Discover');
  }

  async getTunerHostTypes(): Promise<{ Name?: string; Id?: string }[]> {
    return this.request<{ Name?: string; Id?: string }[]>('GET', '/LiveTv/TunerHosts/Types');
  }

  async getSchedulesDirectCountries(): Promise<unknown> {
    return this.request<unknown>('GET', '/LiveTv/ListingProviders/SchedulesDirect/Countries');
  }

  async addTunerHost(params: TunerHostInfo): Promise<TunerHostInfo> {
    return this.request<TunerHostInfo>('POST', '/LiveTv/TunerHosts', undefined, params);
  }

  async deleteTunerHost(id: string): Promise<void> {
    await this.request<void>('DELETE', '/LiveTv/TunerHosts', { id });
  }

  async resetTuner(tunerId: string): Promise<void> {
    await this.request<void>('POST', `/LiveTv/Tuners/${tunerId}/Reset`);
  }

  async addListingProvider(params: ListingProviderInfo): Promise<ListingProviderInfo> {
    return this.request<ListingProviderInfo>('POST', '/LiveTv/ListingProviders', undefined, params);
  }

  async deleteListingProvider(id: string): Promise<void> {
    await this.request<void>('DELETE', '/LiveTv/ListingProviders', { id });
  }

  async getChannelMappingOptions(params?: { providerId?: string }): Promise<{ TunerChannels?: { Name?: string; Id?: string }[]; ProviderChannels?: { Name?: string; Id?: string }[]; Mappings?: Record<string, string>[]; ProviderName?: string }> {
    return this.request<{ TunerChannels?: { Name?: string; Id?: string }[]; ProviderChannels?: { Name?: string; Id?: string }[]; Mappings?: Record<string, string>[]; ProviderName?: string }>('GET', '/LiveTv/ChannelMappingOptions', params);
  }

  async setChannelMappings(params: { providerId: string; mappings: Record<string, string>[] }): Promise<void> {
    await this.request<void>('POST', '/LiveTv/ChannelMappings', undefined, params);
  }
}

export type { LiveTvInfo };
