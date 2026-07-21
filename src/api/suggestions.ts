import { ApiClientBase } from './base.js';
import type { BaseItemDto, QueryResult } from '../types/index.js';
import { JellyfinApiError } from './types.js';

/**
 * Provides suggestions api behavior for the Jellyfin client and command runtime.
 */
export class SuggestionsApi extends ApiClientBase {
  /**
   * Retrieves or derives suggestions without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.fields - The fields value required by this operation.
   * @param params.enableImages - The enable images value required by this operation.
   * @param params.imageTypeLimit - The image type limit value required by this operation.
   * @param params.enableImageTypes - The enable image types value required by this operation.
   * @param params.enableUserData - The enable user data value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @returns - The typed get suggestions result.
   */
  async getSuggestions(params?: { userId?: string; parentId?: string; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean; limit?: number }): Promise<BaseItemDto[]> {
    const userId = params?.userId ?? this.userId;
    if (!userId) throw new JellyfinApiError('User ID required');
    const result = await this.request<QueryResult<BaseItemDto>>('GET', `/Users/${userId}/Suggestions`, { ...params, userId: undefined });
    return result.Items ?? [];
  }
}
