import { ApiClientBase } from './base.js';
import type { BaseItemDto, QueryResult } from '../types/index.js';

/**
 * Defines the channel features contract used across typed Jellyfin boundaries.
 */
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

/**
 * Represents the channel media content type values accepted by the typed Jellyfin interface.
 */
export type ChannelMediaContentType = 'Clip' | 'Podcast' | 'Trailer' | 'Movie' | 'Episode' | 'MusicVideo' | 'Unknown';

/**
 * Provides channels api behavior for the Jellyfin client and command runtime.
 */
export class ChannelsApi extends ApiClientBase {
  /**
   * Retrieves or derives channels without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.supportsLatestItems - The supports latest items value required by this operation.
   * @param params.supportsMediaDeletion - The supports media deletion value required by this operation.
   * @param params.isFavorite - The is favorite value required by this operation.
   * @returns - The typed get channels result.
   */
  async getChannels(params?: { userId?: string; startIndex?: number; limit?: number; supportsLatestItems?: boolean; supportsMediaDeletion?: boolean; isFavorite?: boolean }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/Channels', { ...params, userId });
  }

  /**
   * Retrieves or derives all channel features without mutating Jellyfin state.
   * @returns - The typed get all channel features result.
   */
  async getAllChannelFeatures(): Promise<ChannelFeatures[]> {
    return this.request<ChannelFeatures[]>('GET', '/Channels/Features');
  }

  /**
   * Retrieves or derives channel features without mutating Jellyfin state.
   * @param channelId - The channel id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getChannelFeatures(channelId: string): Promise<ChannelFeatures> {
    return this.request<ChannelFeatures>('GET', `/Channels/${channelId}/Features`);
  }

  /**
   * Retrieves or derives channel items without mutating Jellyfin state.
   * @param channelId - The channel id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.folderId - The folder id value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.sortOrder - The sort order value required by this operation.
   * @param params.fields - The fields value required by this operation.
   * @param params.enableImages - The enable images value required by this operation.
   * @param params.imageTypeLimit - The image type limit value required by this operation.
   * @param params.enableImageTypes - The enable image types value required by this operation.
   * @param params.enableUserData - The enable user data value required by this operation.
   * @param params.sortBy - The sort by value required by this operation.
   * @returns - The normalized string representation.
   */
  async getChannelItems(channelId: string, params?: { folderId?: string; userId?: string; startIndex?: number; limit?: number; sortOrder?: string; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean; sortBy?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', `/Channels/${channelId}/Items`, { ...params, userId });
  }

  /**
   * Retrieves or derives latest channel items without mutating Jellyfin state.
   * @param channelId - The channel id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @param params.fields - The fields value required by this operation.
   * @param params.enableImages - The enable images value required by this operation.
   * @param params.imageTypeLimit - The image type limit value required by this operation.
   * @param params.enableImageTypes - The enable image types value required by this operation.
   * @param params.enableUserData - The enable user data value required by this operation.
   * @returns - The normalized string representation.
   */
  async getLatestChannelItems(channelId: string, params?: { userId?: string; limit?: number; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean }): Promise<BaseItemDto[]> {
    const userId = params?.userId ?? this.userId;
    return this.request<BaseItemDto[]>('GET', `/Channels/${channelId}/Latest`, { ...params, userId });
  }
}
