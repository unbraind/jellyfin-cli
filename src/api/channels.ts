import { ApiClientBase } from './base.js';
import type { BaseItemDto, QueryResult } from '../types/index.js';

export interface ChannelFeatures {
  SupportsMediaDeletion?: boolean;
  SupportsLatestItems?: boolean;
  CanFilter?: boolean;
  ContentTypes?: ChannelMediaContentType[];
  DefaultSortOrder?: string[];
  MaxPageSize?: number;
  AutoRefreshLevels?: number[];
  SupportsSortOrderToggle?: boolean;
  SupportsContentDownloading?: boolean;
}

export type ChannelMediaContentType = 'Clip' | 'Podcast' | 'Trailer' | 'Movie' | 'Episode' | 'MusicVideo' | 'Unknown';

export class ChannelsApi extends ApiClientBase {
  async getChannels(params?: { userId?: string; startIndex?: number; limit?: number; supportsLatestItems?: boolean; supportsMediaDeletion?: boolean; isFavorite?: boolean }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/Channels', { ...params, userId });
  }

  async getAllChannelFeatures(): Promise<ChannelFeatures[]> {
    return this.request<ChannelFeatures[]>('GET', '/Channels/Features');
  }

  async getChannelFeatures(channelId: string): Promise<ChannelFeatures> {
    return this.request<ChannelFeatures>('GET', `/Channels/${channelId}/Features`);
  }

  async getChannelItems(channelId: string, params?: { folderId?: string; userId?: string; startIndex?: number; limit?: number; sortOrder?: string; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean; sortBy?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', `/Channels/${channelId}/Items`, { ...params, userId });
  }

  async getLatestChannelItems(channelId: string, params?: { userId?: string; limit?: number; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean }): Promise<BaseItemDto[]> {
    const userId = params?.userId ?? this.userId;
    return this.request<BaseItemDto[]>('GET', `/Channels/${channelId}/Latest`, { ...params, userId });
  }
}
