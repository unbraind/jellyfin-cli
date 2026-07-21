import { ApiClientBase } from './base.js';
import type { BaseItemDto, QueryResult } from '../types/index.js';

/**
 * Provides years api behavior for the Jellyfin client and command runtime.
 */
export class YearsApi extends ApiClientBase {
  /**
   * Retrieves or derives years without mutating Jellyfin state.
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
   * @returns - The typed get years result.
   */
  async getYears(params?: { userId?: string; parentId?: string; startIndex?: number; limit?: number; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/Years', { ...params, userId });
  }

  /**
   * Retrieves or derives year without mutating Jellyfin state.
   * @param year - The year value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.fields - The fields value required by this operation.
   * @param params.enableImages - The enable images value required by this operation.
   * @param params.imageTypeLimit - The image type limit value required by this operation.
   * @param params.enableImageTypes - The enable image types value required by this operation.
   * @param params.enableUserData - The enable user data value required by this operation.
   * @returns - The typed get year result.
   */
  async getYear(year: number, params?: { userId?: string; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean }): Promise<BaseItemDto> {
    const userId = params?.userId ?? this.userId;
    return this.request<BaseItemDto>('GET', `/Years/${year}`, { ...params, userId });
  }
}
