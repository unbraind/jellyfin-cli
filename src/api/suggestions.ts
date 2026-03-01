import { ApiClientBase } from './base.js';
import type { BaseItemDto, QueryResult } from '../types/index.js';
import { JellyfinApiError } from './types.js';

export class SuggestionsApi extends ApiClientBase {
  async getSuggestions(params?: { userId?: string; parentId?: string; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean; limit?: number }): Promise<BaseItemDto[]> {
    const userId = params?.userId ?? this.userId;
    if (!userId) throw new JellyfinApiError('User ID required');
    const result = await this.request<QueryResult<BaseItemDto>>('GET', `/Users/${userId}/Suggestions`, { ...params, userId: undefined });
    return result.Items ?? [];
  }
}
