import { ApiClientBase } from './base.js';
import { JellyfinApiError } from './core-api.js';
import type { JellyfinConfig, QueryResult, BaseItemDto, PlaylistCreationResult } from '../types/index.js';

/**
 * Provides playlists api behavior for the Jellyfin client and command runtime.
 */
export class PlaylistsApi extends ApiClientBase {
  /**
   * Creates an instance with the collaborators required by its runtime behavior.
   * @param config - The resolved Jellyfin client configuration.
   */
  constructor(config: JellyfinConfig) {
    super(config);
  }

  /**
   * Performs the create playlist operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.name - The name value required by this operation.
   * @param params.ids - The ids value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.mediaType - The media type value required by this operation.
   * @returns - The typed create playlist result.
   */
  async createPlaylist(params: { name: string; ids?: string[]; userId?: string; mediaType?: string }): Promise<PlaylistCreationResult> {
    const userId = params.userId ?? this.userId;
    if (!userId) throw new JellyfinApiError('User ID required');
    return this.request<PlaylistCreationResult>('POST', '/Playlists', { ...params, userId, ids: params.ids?.join(',') });
  }

  /**
   * Performs the add to playlist operation through the typed Jellyfin API boundary.
   * @param playlistId - The playlist id value required by this operation.
   * @param ids - The ids value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   */
  async addToPlaylist(playlistId: string, ids: string[], userId?: string): Promise<void> {
    await this.request<void>('POST', `/Playlists/${playlistId}/Items`, { ids: ids.join(','), userId: userId ?? this.userId });
  }

  /**
   * Performs the remove from playlist operation through the typed Jellyfin API boundary.
   * @param playlistId - The playlist id value required by this operation.
   * @param entryIds - The entry ids value required by this operation.
   */
  async removeFromPlaylist(playlistId: string, entryIds: string[]): Promise<void> {
    await this.request<void>('DELETE', `/Playlists/${playlistId}/Items`, { entryIds: entryIds.join(',') });
  }

  /**
   * Retrieves or derives playlist items without mutating Jellyfin state.
   * @param playlistId - The playlist id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getPlaylistItems(playlistId: string, params?: { userId?: string; startIndex?: number; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', `/Playlists/${playlistId}/Items`, { ...params, userId });
  }

  /**
   * Performs the delete playlist operation through the typed Jellyfin API boundary.
   * @param playlistId - The playlist id value required by this operation.
   */
  async deletePlaylist(playlistId: string): Promise<void> {
    await this.request<void>('DELETE', `/Playlists/${playlistId}`);
  }

  /**
   * Retrieves or derives playlist without mutating Jellyfin state.
   * @param playlistId - The playlist id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getPlaylist(playlistId: string): Promise<BaseItemDto> {
    return this.request<BaseItemDto>('GET', `/Playlists/${playlistId}`);
  }

  /**
   * Performs the update playlist operation through the typed Jellyfin API boundary.
   * @param playlistId - The playlist id value required by this operation.
   * @param data - The typed payload to format or submit.
   * @param data.Name - The name value required by this operation.
   * @param data.Ids - The ids value required by this operation.
   * @param data.UserId - The user id value required by this operation.
   * @returns - The normalized string representation.
   */
  async updatePlaylist(playlistId: string, data: { Name?: string; Ids?: string[]; UserId?: string }): Promise<void> {
    await this.request<void>('POST', `/Playlists/${playlistId}`, undefined, data);
  }

  /**
   * Retrieves or derives playlist users without mutating Jellyfin state.
   * @param playlistId - The playlist id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getPlaylistUsers(playlistId: string): Promise<{ UserId?: string; CanEdit?: boolean }[]> {
    return this.request<{ UserId?: string; CanEdit?: boolean }[]>('GET', `/Playlists/${playlistId}/Users`);
  }

  /**
   * Performs the set playlist user access operation through the typed Jellyfin API boundary.
   * @param playlistId - The playlist id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param canEdit - The can edit value required by this operation.
   */
  async setPlaylistUserAccess(playlistId: string, userId: string, canEdit: boolean): Promise<void> {
    await this.request<void>('POST', `/Playlists/${playlistId}/Users/${userId}`, undefined, { UserId: userId, CanEdit: canEdit });
  }

  /**
   * Performs the remove playlist user access operation through the typed Jellyfin API boundary.
   * @param playlistId - The playlist id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   */
  async removePlaylistUserAccess(playlistId: string, userId: string): Promise<void> {
    await this.request<void>('DELETE', `/Playlists/${playlistId}/Users/${userId}`);
  }

  /**
   * Implements move playlist item for the typed Jellyfin CLI runtime.
   * @param playlistId - The playlist id value required by this operation.
   * @param itemId - The item id value required by this operation.
   * @param newIndex - The new index value required by this operation.
   */
  async movePlaylistItem(playlistId: string, itemId: string, newIndex: number): Promise<void> {
    await this.request<void>('POST', `/Playlists/${playlistId}/Items/${itemId}/Move/${newIndex}`);
  }

  /**
   * Retrieves or derives playlist instant mix without mutating Jellyfin state.
   * @param playlistId - The playlist id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getPlaylistInstantMix(playlistId: string, params?: { userId?: string; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', `/Playlists/${playlistId}/InstantMix`, { ...params, userId });
  }
}
