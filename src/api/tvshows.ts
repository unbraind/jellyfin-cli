import { ApiClientBase } from './base.js';
import type { BaseItemDto, QueryResult } from '../types/index.js';

/**
 * Provides tv shows api behavior for the Jellyfin client and command runtime.
 */
export class TvShowsApi extends ApiClientBase {
  /**
   * Retrieves or derives episodes without mutating Jellyfin state.
   * @param seriesId - The series id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.seasonId - The season id value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.fields - The fields value required by this operation.
   * @param params.season - The season value required by this operation.
   * @param params.isMissing - The is missing value required by this operation.
   * @param params.adjacentTo - The adjacent to value required by this operation.
   * @param params.startItemId - The start item id value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.enableImages - The enable images value required by this operation.
   * @param params.imageTypeLimit - The image type limit value required by this operation.
   * @param params.enableImageTypes - The enable image types value required by this operation.
   * @param params.enableUserData - The enable user data value required by this operation.
   * @param params.sortBy - The sort by value required by this operation.
   * @returns - The normalized string representation.
   */
  async getEpisodes(seriesId: string, params?: { seasonId?: string; userId?: string; fields?: string[]; season?: number; isMissing?: boolean; adjacentTo?: string; startItemId?: string; limit?: number; startIndex?: number; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean; sortBy?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', `/Shows/${seriesId}/Episodes`, { ...params, userId });
  }

  /**
   * Retrieves or derives seasons without mutating Jellyfin state.
   * @param seriesId - The series id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.fields - The fields value required by this operation.
   * @param params.isSpecialSeason - The is special season value required by this operation.
   * @param params.enableImages - The enable images value required by this operation.
   * @param params.imageTypeLimit - The image type limit value required by this operation.
   * @param params.enableImageTypes - The enable image types value required by this operation.
   * @param params.enableUserData - The enable user data value required by this operation.
   * @param params.adjacentTo - The adjacent to value required by this operation.
   * @returns - The normalized string representation.
   */
  async getSeasons(seriesId: string, params?: { userId?: string; fields?: string[]; isSpecialSeason?: boolean; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean; adjacentTo?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', `/Shows/${seriesId}/Seasons`, { ...params, userId });
  }

  /**
   * Retrieves or derives next up episodes without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.seriesId - The series id value required by this operation.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.fields - The fields value required by this operation.
   * @param params.enableImages - The enable images value required by this operation.
   * @param params.imageTypeLimit - The image type limit value required by this operation.
   * @param params.enableImageTypes - The enable image types value required by this operation.
   * @param params.enableUserData - The enable user data value required by this operation.
   * @param params.enableTotalRecordCount - The enable total record count value required by this operation.
   * @param params.disableFirstEpisode - The disable first episode value required by this operation.
   * @param params.nextUpDateCutoff - The next up date cutoff value required by this operation.
   * @param params.enableResumable - The enable resumable value required by this operation.
   * @param params.enableRewatching - The enable rewatching value required by this operation.
   * @returns - The typed get next up episodes result.
   */
  async getNextUpEpisodes(params?: { userId?: string; seriesId?: string; parentId?: string; startIndex?: number; limit?: number; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean; enableTotalRecordCount?: boolean; disableFirstEpisode?: boolean; nextUpDateCutoff?: string; enableResumable?: boolean; enableRewatching?: boolean }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/Shows/NextUp', { ...params, userId });
  }

  /**
   * Retrieves or derives upcoming episodes without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.fields - The fields value required by this operation.
   * @param params.enableImages - The enable images value required by this operation.
   * @param params.imageTypeLimit - The image type limit value required by this operation.
   * @param params.enableImageTypes - The enable image types value required by this operation.
   * @param params.enableUserData - The enable user data value required by this operation.
   * @returns - The typed get upcoming episodes result.
   */
  async getUpcomingEpisodes(params?: { userId?: string; parentId?: string; startIndex?: number; limit?: number; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/Shows/Upcoming', { ...params, userId });
  }

  /**
   * Retrieves or derives similar shows without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getSimilarShows(itemId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', `/Shows/${itemId}/Similar`, { ...params, userId });
  }
}
