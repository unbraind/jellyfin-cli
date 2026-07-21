import { ApiClientBase } from './base.js';
import type { BaseItemDto, QueryResult } from '../types/index.js';

/**
 * Provides music genres api behavior for the Jellyfin client and command runtime.
 */
export class MusicGenresApi extends ApiClientBase {
  /**
   * Retrieves or derives music genres without mutating Jellyfin state.
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
   * @param params.sortBy - The sort by value required by this operation.
   * @param params.sortOrder - The sort order value required by this operation.
   * @returns - The typed get music genres result.
   */
  async getMusicGenres(params?: { userId?: string; parentId?: string; startIndex?: number; limit?: number; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/MusicGenres', { ...params, userId });
  }

  /**
   * Retrieves or derives music genre without mutating Jellyfin state.
   * @param name - The name value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.fields - The fields value required by this operation.
   * @param params.enableImages - The enable images value required by this operation.
   * @param params.imageTypeLimit - The image type limit value required by this operation.
   * @param params.enableImageTypes - The enable image types value required by this operation.
   * @param params.enableUserData - The enable user data value required by this operation.
   * @returns - The normalized string representation.
   */
  async getMusicGenre(name: string, params?: { userId?: string; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean }): Promise<BaseItemDto> {
    const userId = params?.userId ?? this.userId;
    return this.request<BaseItemDto>('GET', `/MusicGenres/${encodeURIComponent(name)}`, { ...params, userId });
  }
}
