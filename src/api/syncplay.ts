import { ApiClientBase } from './base.js';
import type { SyncPlayGroup, SyncPlayParticipant } from '../types/index.js';

export class SyncPlayApi extends ApiClientBase {
  async createGroup(params?: { GroupName?: string }): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/New', undefined, params);
  }

  async joinGroup(groupId: string): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Join', undefined, { GroupId: groupId });
  }

  async leaveGroup(): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Leave');
  }

  async getGroups(): Promise<SyncPlayGroup[]> {
    return this.request<SyncPlayGroup[]>('GET', '/SyncPlay/List');
  }

  async getGroup(groupId: string): Promise<SyncPlayGroup> {
    return this.request<SyncPlayGroup>('GET', `/SyncPlay/${groupId}`);
  }

  async pauseGroup(): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Pause');
  }

  async unpauseGroup(): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Unpause');
  }

  async stopGroup(): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Stop');
  }

  async seekGroup(positionTicks: number): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Seek', undefined, { PositionTicks: positionTicks });
  }

  async nextItem(params?: { PlaylistItemId?: string }): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/NextItem', undefined, params);
  }

  async previousItem(params?: { PlaylistItemId?: string }): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/PreviousItem', undefined, params);
  }

  async setRepeatMode(mode: string): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/SetRepeatMode', undefined, { Mode: mode });
  }

  async setShuffleMode(mode: string): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/SetShuffleMode', undefined, { Mode: mode });
  }

  async setNewQueue(params: { ItemIds?: string[]; StartPositionTicks?: number }): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/SetNewQueue', undefined, params);
  }

  async queueItems(itemIds: string[]): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Queue', undefined, { ItemIds: itemIds });
  }

  async removeFromPlaylist(playlistItemIds: string[]): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/RemoveFromPlaylist', undefined, { PlaylistItemIds: playlistItemIds });
  }

  async movePlaylistItem(playlistItemId: string, newIndex: number): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/MovePlaylistItem', undefined, { PlaylistItemId: playlistItemId, NewIndex: newIndex });
  }

  async setPlaylistItem(playlistItemId: string): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/SetPlaylistItem', undefined, { PlaylistItemId: playlistItemId });
  }

  async reportBuffering(params?: { When?: string; PositionTicks?: number; IsPlaying?: boolean; PlaylistItemId?: string }): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Buffering', undefined, params);
  }

  async reportReady(params?: { When?: string; PositionTicks?: number; IsPlaying?: boolean; PlaylistItemId?: string }): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Ready', undefined, params);
  }

  async setIgnoreWait(ignoreWait: boolean): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/SetIgnoreWait', undefined, { IgnoreWait: ignoreWait });
  }

  async updatePing(ping: number): Promise<void> {
    await this.request<void>('POST', '/SyncPlay/Ping', undefined, { Ping: ping });
  }
}
