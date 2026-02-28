import { ApiClientBase } from './base.js';
import type { BaseItemDto, QueryResult } from '../types/index.js';

export class TvShowsApi extends ApiClientBase {
  async getEpisodes(seriesId: string, params?: { seasonId?: string; userId?: string; fields?: string[]; season?: number; isMissing?: boolean; adjacentTo?: string; startItemId?: string; limit?: number; startIndex?: number; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean; sortBy?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', `/Shows/${seriesId}/Episodes`, { ...params, userId });
  }

  async getSeasons(seriesId: string, params?: { userId?: string; fields?: string[]; isSpecialSeason?: boolean; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean; adjacentTo?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', `/Shows/${seriesId}/Seasons`, { ...params, userId });
  }

  async getNextUpEpisodes(params?: { userId?: string; seriesId?: string; parentId?: string; startIndex?: number; limit?: number; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean; enableTotalRecordCount?: boolean; disableFirstEpisode?: boolean; nextUpDateCutoff?: string; enableResumable?: boolean; enableRewatching?: boolean }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/Shows/NextUp', { ...params, userId });
  }

  async getUpcomingEpisodes(params?: { userId?: string; parentId?: string; startIndex?: number; limit?: number; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/Shows/Upcoming', { ...params, userId });
  }
}
