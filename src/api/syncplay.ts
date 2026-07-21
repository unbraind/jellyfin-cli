import { ApiClientBase } from './base.js';
import type { SyncPlayGroup } from '../types/index.js';

/**
 * Provides sync play api behavior for the Jellyfin client and command runtime.
 */
export class SyncPlayApi extends ApiClientBase {
  /**
   * Performs the create group operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.GroupName - The group name value required by this operation.
   * @returns - The typed create group result.
   */
  async createGroup(params?: { GroupName?: string }): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/New', undefined, params);
  }

  /**
   * Performs the join group operation through the typed Jellyfin API boundary.
   * @param groupId - The group id value required by this operation.
   */
  async joinGroup(groupId: string): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Join', undefined, { GroupId: groupId });
  }

  /**
   * Performs the leave group operation through the typed Jellyfin API boundary.
   */
  async leaveGroup(): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Leave');
  }

  /**
   * Retrieves or derives groups without mutating Jellyfin state.
   * @returns - The typed get groups result.
   */
  async getGroups(): Promise<SyncPlayGroup[]> {
    return this.request<SyncPlayGroup[]>('GET', '/SyncPlay/List');
  }

  /**
   * Retrieves or derives group without mutating Jellyfin state.
   * @param groupId - The group id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getGroup(groupId: string): Promise<SyncPlayGroup> {
    return this.request<SyncPlayGroup>('GET', `/SyncPlay/${groupId}`);
  }

  /**
   * Implements pause group for the typed Jellyfin CLI runtime.
   */
  async pauseGroup(): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Pause');
  }

  /**
   * Implements unpause group for the typed Jellyfin CLI runtime.
   */
  async unpauseGroup(): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Unpause');
  }

  /**
   * Performs the stop group operation through the typed Jellyfin API boundary.
   */
  async stopGroup(): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Stop');
  }

  /**
   * Implements seek group for the typed Jellyfin CLI runtime.
   * @param positionTicks - The position ticks value required by this operation.
   */
  async seekGroup(positionTicks: number): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Seek', undefined, { PositionTicks: positionTicks });
  }

  /**
   * Implements next item for the typed Jellyfin CLI runtime.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.PlaylistItemId - The playlist item id value required by this operation.
   * @returns - The typed next item result.
   */
  async nextItem(params?: { PlaylistItemId?: string }): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/NextItem', undefined, params);
  }

  /**
   * Implements previous item for the typed Jellyfin CLI runtime.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.PlaylistItemId - The playlist item id value required by this operation.
   * @returns - The typed previous item result.
   */
  async previousItem(params?: { PlaylistItemId?: string }): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/PreviousItem', undefined, params);
  }

  /**
   * Performs the set repeat mode operation through the typed Jellyfin API boundary.
   * @param mode - The mode value required by this operation.
   */
  async setRepeatMode(mode: string): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/SetRepeatMode', undefined, { Mode: mode });
  }

  /**
   * Performs the set shuffle mode operation through the typed Jellyfin API boundary.
   * @param mode - The mode value required by this operation.
   */
  async setShuffleMode(mode: string): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/SetShuffleMode', undefined, { Mode: mode });
  }

  /**
   * Performs the set new queue operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.ItemIds - The item ids value required by this operation.
   * @param params.StartPositionTicks - The start position ticks value required by this operation.
   * @returns - The typed set new queue result.
   */
  async setNewQueue(params: { ItemIds?: string[]; StartPositionTicks?: number }): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/SetNewQueue', undefined, params);
  }

  /**
   * Implements queue items for the typed Jellyfin CLI runtime.
   * @param itemIds - The item ids value required by this operation.
   */
  async queueItems(itemIds: string[]): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Queue', undefined, { ItemIds: itemIds });
  }

  /**
   * Performs the remove from playlist operation through the typed Jellyfin API boundary.
   * @param playlistItemIds - The playlist item ids value required by this operation.
   */
  async removeFromPlaylist(playlistItemIds: string[]): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/RemoveFromPlaylist', undefined, { PlaylistItemIds: playlistItemIds });
  }

  /**
   * Implements move playlist item for the typed Jellyfin CLI runtime.
   * @param playlistItemId - The playlist item id value required by this operation.
   * @param newIndex - The new index value required by this operation.
   */
  async movePlaylistItem(playlistItemId: string, newIndex: number): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/MovePlaylistItem', undefined, { PlaylistItemId: playlistItemId, NewIndex: newIndex });
  }

  /**
   * Performs the set playlist item operation through the typed Jellyfin API boundary.
   * @param playlistItemId - The playlist item id value required by this operation.
   */
  async setPlaylistItem(playlistItemId: string): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/SetPlaylistItem', undefined, { PlaylistItemId: playlistItemId });
  }

  /**
   * Performs the report buffering operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.When - The when value required by this operation.
   * @param params.PositionTicks - The position ticks value required by this operation.
   * @param params.IsPlaying - The is playing value required by this operation.
   * @param params.PlaylistItemId - The playlist item id value required by this operation.
   * @returns - The typed report buffering result.
   */
  async reportBuffering(params?: { When?: string; PositionTicks?: number; IsPlaying?: boolean; PlaylistItemId?: string }): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Buffering', undefined, params);
  }

  /**
   * Performs the report ready operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.When - The when value required by this operation.
   * @param params.PositionTicks - The position ticks value required by this operation.
   * @param params.IsPlaying - The is playing value required by this operation.
   * @param params.PlaylistItemId - The playlist item id value required by this operation.
   * @returns - The typed report ready result.
   */
  async reportReady(params?: { When?: string; PositionTicks?: number; IsPlaying?: boolean; PlaylistItemId?: string }): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Ready', undefined, params);
  }

  /**
   * Performs the set ignore wait operation through the typed Jellyfin API boundary.
   * @param ignoreWait - The ignore wait value required by this operation.
   */
  async setIgnoreWait(ignoreWait: boolean): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/SetIgnoreWait', undefined, { IgnoreWait: ignoreWait });
  }

  /**
   * Performs the update ping operation through the typed Jellyfin API boundary.
   * @param ping - The ping value required by this operation.
   */
  async updatePing(ping: number): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Ping', undefined, { Ping: ping });
  }
}
