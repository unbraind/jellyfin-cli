import { ApiClientBase } from './base.js';
import type { JellyfinConfig } from '../types/index.js';

/**
 * Provides collections api behavior for the Jellyfin client and command runtime.
 */
export class CollectionsApi extends ApiClientBase {
  /**
   * Creates an instance with the collaborators required by its runtime behavior.
   * @param config - The resolved Jellyfin client configuration.
   */
  constructor(config: JellyfinConfig) {
    super(config);
  }

  /**
   * Performs the create collection operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.name - The name value required by this operation.
   * @param params.ids - The ids value required by this operation.
   * @param params.parentId - The parent id value required by this operation.
   * @returns - The typed create collection result.
   */
  async createCollection(params: { name: string; ids?: string[]; parentId?: string }): Promise<{ Id?: string }> {
    return this.request<{ Id?: string }>('POST', '/Collections', { ...params, ids: params.ids?.join(',') });
  }

  /**
   * Performs the add to collection operation through the typed Jellyfin API boundary.
   * @param collectionId - The collection id value required by this operation.
   * @param ids - The ids value required by this operation.
   */
  async addToCollection(collectionId: string, ids: string[]): Promise<void> {
    await this.request<void>('POST', `/Collections/${collectionId}/Items`, { ids: ids.join(',') });
  }

  /**
   * Performs the remove from collection operation through the typed Jellyfin API boundary.
   * @param collectionId - The collection id value required by this operation.
   * @param ids - The ids value required by this operation.
   */
  async removeFromCollection(collectionId: string, ids: string[]): Promise<void> {
    await this.request<void>('DELETE', `/Collections/${collectionId}/Items`, { ids: ids.join(',') });
  }
}
