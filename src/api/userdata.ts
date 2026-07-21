import { ApiClientBase } from './base.js';
import { JellyfinApiError } from './core-api.js';
import type { JellyfinConfig } from '../types/index.js';

/**
 * Provides userdata api behavior for the Jellyfin client and command runtime.
 */
export class UserdataApi extends ApiClientBase {
  /**
   * Creates an instance with the collaborators required by its runtime behavior.
   * @param config - The resolved Jellyfin client configuration.
   */
  constructor(config: JellyfinConfig) {
    super(config);
  }

  /**
   * Implements mark favorite for the typed Jellyfin CLI runtime.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async markFavorite(itemId: string, userId?: string): Promise<{ IsFavorite?: boolean }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ IsFavorite?: boolean }>('POST', `/UserFavoriteItems/${itemId}`, { userId: uid });
  }

  /**
   * Implements unmark favorite for the typed Jellyfin CLI runtime.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async unmarkFavorite(itemId: string, userId?: string): Promise<{ IsFavorite?: boolean }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ IsFavorite?: boolean }>('DELETE', `/UserFavoriteItems/${itemId}`, { userId: uid });
  }

  /**
   * Implements mark played for the typed Jellyfin CLI runtime.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param datePlayed - The date played value required by this operation.
   * @returns - The normalized string representation.
   */
  async markPlayed(itemId: string, userId?: string, datePlayed?: string): Promise<{ Played?: boolean }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ Played?: boolean }>('POST', `/UserPlayedItems/${itemId}`, { userId: uid, datePlayed });
  }

  /**
   * Implements unmark played for the typed Jellyfin CLI runtime.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async unmarkPlayed(itemId: string, userId?: string): Promise<{ Played?: boolean }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ Played?: boolean }>('DELETE', `/UserPlayedItems/${itemId}`, { userId: uid });
  }

  /**
   * Performs the update user item rating operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param likes - The likes value required by this operation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async updateUserItemRating(itemId: string, userId?: string, likes?: boolean): Promise<{ Played?: boolean }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ Played?: boolean }>('POST', `/UserItems/${itemId}/Rating`, { userId: uid, likes });
  }

  /**
   * Performs the delete user item rating operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async deleteUserItemRating(itemId: string, userId?: string): Promise<{ Played?: boolean }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ Played?: boolean }>('DELETE', `/UserItems/${itemId}/Rating`, { userId: uid });
  }

  /**
   * Retrieves or derives user item data without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getUserItemData(itemId: string, userId?: string): Promise<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; LastPlayedDate?: string; PlaybackPositionTicks?: number; Rating?: number }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; LastPlayedDate?: string; PlaybackPositionTicks?: number; Rating?: number }>('GET', `/UserItems/${itemId}/UserData`, { userId: uid });
  }

  /**
   * Performs the update user item data operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param data - The typed payload to format or submit.
   * @param data.IsFavorite - The is favorite value required by this operation.
   * @param data.Played - The played value required by this operation.
   * @param data.PlayCount - The play count value required by this operation.
   * @param data.PlaybackPositionTicks - The playback position ticks value required by this operation.
   * @param data.Rating - The rating value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async updateUserItemData(itemId: string, data: { IsFavorite?: boolean; Played?: boolean; PlayCount?: number; PlaybackPositionTicks?: number; Rating?: number }, userId?: string): Promise<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; PlaybackPositionTicks?: number; Rating?: number }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; PlaybackPositionTicks?: number; Rating?: number }>('POST', `/UserItems/${itemId}/UserData`, { userId: uid }, data);
  }
}
