import { ApiClientBase } from './base.js';
import { JellyfinApiError } from './types.js';
import type { BaseItemDto, QueryResult, ItemsQueryParams } from '../types/index.js';

/**
 * Provides items api behavior for the Jellyfin client and command runtime.
 */
export class ItemsApi extends ApiClientBase {
  /**
   * Retrieves or derives items without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @returns - The typed get items result.
   */
  async getItems(params?: ItemsQueryParams & { userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    const path = userId ? `/Users/${userId}/Items` : '/Items';
    return this.request<QueryResult<BaseItemDto>>('GET', path, params as Record<string, unknown>);
  }

  /**
   * Retrieves or derives item without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getItem(itemId: string, userId?: string): Promise<BaseItemDto> {
    const uid = userId ?? this.userId;
    if (uid) {
      return this.request<BaseItemDto>('GET', `/Users/${uid}/Items/${itemId}`);
    }
    return this.request<BaseItemDto>('GET', `/Items/${itemId}`);
  }

  /**
   * Retrieves or derives latest items without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @returns - The typed get latest items result.
   */
  async getLatestItems(params?: { parentId?: string; limit?: number; userId?: string }): Promise<BaseItemDto[]> {
    const userId = params?.userId ?? this.userId;
    if (!userId) {
      throw new JellyfinApiError('User ID required for latest items');
    }
    return this.request<BaseItemDto[]>('GET', `/Users/${userId}/Items/Latest`, params as Record<string, unknown>);
  }

  /**
   * Retrieves or derives resume items without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @returns - The typed get resume items result.
   */
  async getResumeItems(params?: { parentId?: string; limit?: number; userId?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    if (!userId) {
      throw new JellyfinApiError('User ID required for resume items');
    }
    return this.request<QueryResult<BaseItemDto>>('GET', `/Users/${userId}/Items/Resume`, params as Record<string, unknown>);
  }

  /**
   * Performs the delete item operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   */
  async deleteItem(itemId: string): Promise<void> {
    await this.request<void>('DELETE', `/Items/${itemId}`);
  }

  /**
   * Performs the update item operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param item - The item value required by this operation.
   */
  async updateItem(itemId: string, item: Partial<BaseItemDto>): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}`, undefined, item);
  }

  /**
   * Implements refresh item for the typed Jellyfin CLI runtime.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.recursive - The recursive value required by this operation.
   * @param params.replaceAllMetadata - The replace all metadata value required by this operation.
   * @param params.replaceAllImages - The replace all images value required by this operation.
   * @returns - The normalized string representation.
   */
  async refreshItem(itemId: string, params?: { recursive?: boolean; replaceAllMetadata?: boolean; replaceAllImages?: boolean }): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}/Refresh`, params);
  }

  /**
   * Retrieves or derives intros without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getIntros(itemId: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/Intros`);
  }

  /**
   * Retrieves or derives additional parts without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getAdditionalParts(itemId: string): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', `/Videos/${itemId}/AdditionalParts`);
  }

  /**
   * Retrieves or derives special features without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getSpecialFeatures(itemId: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/SpecialFeatures`);
  }

  /**
   * Retrieves or derives local trailers without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getLocalTrailers(itemId: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Users/${this.userId}/Items/${itemId}/LocalTrailers`);
  }

  /**
   * Retrieves or derives ancestors without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getAncestors(itemId: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Items/${itemId}/Ancestors`);
  }

  /**
   * Retrieves or derives items by path without mutating Jellyfin state.
   * @param path - The API, command, or filesystem path to process.
   * @returns - The normalized string representation.
   */
  async getItemsByPath(path: string): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', '/Items/ByPath', { path });
  }
}
