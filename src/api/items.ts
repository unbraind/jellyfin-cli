import { ApiClientBase } from './base.js';
import { JellyfinApiError } from './types.js';
import type { BaseItemDto, QueryResult, ItemsQueryParams } from '../types/index.js';

export class ItemsApi extends ApiClientBase {
  async getItems(params?: ItemsQueryParams & { userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    const path = userId ? `/Users/${userId}/Items` : '/Items';
    return this.request<QueryResult<BaseItemDto>>('GET', path, params as Record<string, unknown>);
  }

  async getItem(itemId: string, userId?: string): Promise<BaseItemDto> {
    const uid = userId ?? this.userId;
    if (uid) {
      return this.request<BaseItemDto>('GET', `/Users/${uid}/Items/${itemId}`);
    }
    return this.request<BaseItemDto>('GET', `/Items/${itemId}`);
  }

  async getLatestItems(params?: { parentId?: string; limit?: number; userId?: string }): Promise<BaseItemDto[]> {
    const userId = params?.userId ?? this.userId;
    if (!userId) {
      throw new JellyfinApiError('User ID required for latest items');
    }
    return this.request<BaseItemDto[]>('GET', `/Users/${userId}/Items/Latest`, params as Record<string, unknown>);
  }

  async getResumeItems(params?: { parentId?: string; limit?: number; userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    if (!userId) {
      throw new JellyfinApiError('User ID required for resume items');
    }
    return this.request<QueryResult<BaseItemDto>>('GET', `/Users/${userId}/Items/Resume`, params as Record<string, unknown>);
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.request<void>('DELETE', `/Items/${itemId}`);
  }

  async updateItem(itemId: string, item: Partial<BaseItemDto>): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}`, undefined, item);
  }

  async refreshItem(itemId: string, params?: { recursive?: boolean; replaceAllMetadata?: boolean; replaceAllImages?: boolean }): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}/Refresh`, params);
  }

  async getIntros(itemId: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/Intros`);
  }

  async getAdditionalParts(itemId: string): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', `/Videos/${itemId}/AdditionalParts`);
  }

  async getSpecialFeatures(itemId: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/SpecialFeatures`);
  }

  async getLocalTrailers(itemId: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/LocalTrailers`);
  }

  async getAncestors(itemId: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Items/${itemId}/Ancestors`);
  }

  async getItemsByPath(path: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', '/Items/ByPath', { path });
  }
}
