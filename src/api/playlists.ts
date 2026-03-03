import { ApiClientBase } from './base.js';
import { JellyfinApiError } from './core-api.js';
import type { JellyfinConfig, QueryResult, BaseItemDto, PlaylistCreationResult } from '../types/index.js';

export class PlaylistsApi extends ApiClientBase {
  constructor(config: JellyfinConfig) {
    super(config);
  }

  async createPlaylist(params: { name: string; ids?: string[]; userId?: string; mediaType?: string }): Promise<PlaylistCreationResult> {
    const userId = params.userId ?? this.userId;
    if (!userId) throw new JellyfinApiError('User ID required');
    return this.request<PlaylistCreationResult>('POST', '/Playlists', { ...params, userId, ids: params.ids?.join(',') });
  }

  async addToPlaylist(playlistId: string, ids: string[], userId?: string): Promise<void> {
    await this.request<void>('POST', `/Playlists/${playlistId}/Items`, { ids: ids.join(','), userId: userId ?? this.userId });
  }

  async removeFromPlaylist(playlistId: string, entryIds: string[]): Promise<void> {
    await this.request<void>('DELETE', `/Playlists/${playlistId}/Items`, { entryIds: entryIds.join(',') });
  }

  async getPlaylistItems(playlistId: string, params?: { userId?: string; startIndex?: number; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', `/Playlists/${playlistId}/Items`, { ...params, userId });
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    await this.request<void>('DELETE', `/Playlists/${playlistId}`);
  }

  async getPlaylist(playlistId: string): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', `/Playlists/${playlistId}`);
  }

  async updatePlaylist(playlistId: string, data: { Name?: string; Ids?: string[]; UserId?: string }): Promise<void> {
    await this.request<void>('POST', `/Playlists/${playlistId}`, undefined, data);
  }

  async getPlaylistUsers(playlistId: string): Promise<{ UserId?: string; CanEdit?: boolean }[]> {
    return this.request<{ UserId?: string; CanEdit?: boolean }[]>('GET', `/Playlists/${playlistId}/Users`);
  }

  async setPlaylistUserAccess(playlistId: string, userId: string, canEdit: boolean): Promise<void> {
    await this.request<void>('POST', `/Playlists/${playlistId}/Users/${userId}`, undefined, { UserId: userId, CanEdit: canEdit });
  }

  async removePlaylistUserAccess(playlistId: string, userId: string): Promise<void> {
    await this.request<void>('DELETE', `/Playlists/${playlistId}/Users/${userId}`);
  }

  async movePlaylistItem(playlistId: string, itemId: string, newIndex: number): Promise<void> {
    await this.request<void>('POST', `/Playlists/${playlistId}/Items/${itemId}/Move/${newIndex}`);
  }

  async getPlaylistInstantMix(playlistId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', `/Playlists/${playlistId}/InstantMix`, { ...params, userId });
  }
}
