import { ApiClientBase } from './base.js';
import type { JellyfinConfig } from '../types/index.js';

export class CollectionsApi extends ApiClientBase {
  constructor(config: JellyfinConfig) {
    super(config);
  }

  async createCollection(params: { name: string; ids?: string[]; parentId?: string }): Promise<{ Id?: string }> {
    return this.request<{ Id?: string }>('POST', '/Collections', { ...params, ids: params.ids?.join(',') });
  }

  async addToCollection(collectionId: string, ids: string[]): Promise<void> {
    await this.request<void>('POST', `/Collections/${collectionId}/Items`, { ids: ids.join(',') });
  }

  async removeFromCollection(collectionId: string, ids: string[]): Promise<void> {
    await this.request<void>('DELETE', `/Collections/${collectionId}/Items`, { ids: ids.join(',') });
  }
}
