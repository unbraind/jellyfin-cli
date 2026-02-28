import { ApiClientBase } from './base.js';
import type { BaseItemDto } from '../types/index.js';

export class SuggestionsApi extends ApiClientBase {
  async getSuggestions(params?: { userId?: string; parentId?: string; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean; limit?: number }): Promise<BaseItemDto[]> {
    const userId = params?.userId ?? this.userId;
    return this.request<BaseItemDto[]>('GET', '/Suggestions', { ...params, userId });
  }
}
