import { ApiClientBase } from './base.js';
import { JellyfinApiError } from './core-api.js';
import type { JellyfinConfig } from '../types/index.js';

export class UserdataApi extends ApiClientBase {
  constructor(config: JellyfinConfig) {
    super(config);
  }

  async markFavorite(itemId: string, userId?: string): Promise<{ IsFavorite?: boolean }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ IsFavorite?: boolean }>('POST', `/UserFavoriteItems/${itemId}`, { userId: uid });
  }

  async unmarkFavorite(itemId: string, userId?: string): Promise<{ IsFavorite?: boolean }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ IsFavorite?: boolean }>('DELETE', `/UserFavoriteItems/${itemId}`, { userId: uid });
  }

  async markPlayed(itemId: string, userId?: string, datePlayed?: string): Promise<{ Played?: boolean }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ Played?: boolean }>('POST', `/UserPlayedItems/${itemId}`, { userId: uid, datePlayed });
  }

  async unmarkPlayed(itemId: string, userId?: string): Promise<{ Played?: boolean }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ Played?: boolean }>('DELETE', `/UserPlayedItems/${itemId}`, { userId: uid });
  }

  async updateUserItemRating(itemId: string, userId?: string, likes?: boolean): Promise<{ Played?: boolean }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ Played?: boolean }>('POST', `/UserItems/${itemId}/Rating`, { userId: uid, likes });
  }

  async deleteUserItemRating(itemId: string, userId?: string): Promise<{ Played?: boolean }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ Played?: boolean }>('DELETE', `/UserItems/${itemId}/Rating`, { userId: uid });
  }

  async getUserItemData(itemId: string, userId?: string): Promise<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; LastPlayedDate?: string; PlaybackPositionTicks?: number; Rating?: number }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; LastPlayedDate?: string; PlaybackPositionTicks?: number; Rating?: number }>('GET', `/UserItems/${itemId}/UserData`, { userId: uid });
  }

  async updateUserItemData(itemId: string, data: { IsFavorite?: boolean; Played?: boolean; PlayCount?: number; PlaybackPositionTicks?: number; Rating?: number }, userId?: string): Promise<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; PlaybackPositionTicks?: number; Rating?: number }> {
    const uid = userId ?? this.userId;
    if (!uid) throw new JellyfinApiError('User ID required');
    return this.request<{ IsFavorite?: boolean; Played?: boolean; PlayCount?: number; PlaybackPositionTicks?: number; Rating?: number }>('POST', `/UserItems/${itemId}/UserData`, { userId: uid }, data);
  }
}
