import { ApiClientBase } from './base.js';

// API methods for optional Jellyfin plugins: Meilisearch, TMDb, Telegram, InfuseSync.
// These endpoints are only available when the respective plugin is installed.

export class PluginsExtApi extends ApiClientBase {
  // Library media notification hooks
  async notifyLibraryMediaUpdated(updates: { Path?: string; UpdateType?: string }[]): Promise<void> {
    await this.request<void>('POST', '/Library/Media/Updated', undefined, updates);
  }
  async notifyMoviesAdded(updates: { Path?: string; UpdateType?: string }[]): Promise<void> {
    await this.request<void>('POST', '/Library/Movies/Added', undefined, updates);
  }
  async notifyMoviesUpdated(updates: { Path?: string; UpdateType?: string }[]): Promise<void> {
    await this.request<void>('POST', '/Library/Movies/Updated', undefined, updates);
  }
  async notifySeriesAdded(updates: { Path?: string; UpdateType?: string }[]): Promise<void> {
    await this.request<void>('POST', '/Library/Series/Added', undefined, updates);
  }
  async notifySeriesUpdated(updates: { Path?: string; UpdateType?: string }[]): Promise<void> {
    await this.request<void>('POST', '/Library/Series/Updated', undefined, updates);
  }

  // Backup manifest (requires path to a backup archive)
  async getBackupManifest(path: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', '/Backup/Manifest', { path });
  }

  // Meilisearch plugin
  async getMeilisearchStatus(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', '/meilisearch/status');
  }
  async reconnectMeilisearch(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', '/meilisearch/reconnect');
  }
  async reindexMeilisearch(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', '/meilisearch/reindex');
  }

  // TMDb plugin
  async getTmdbClientConfiguration(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', '/Tmdb/ClientConfiguration');
  }
  async refreshTmdbBoxSets(): Promise<void> {
    await this.request<void>('POST', '/TMDbBoxSets/Refresh');
  }

  // Telegram notifier plugin
  async testTelegramNotifier(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', '/TelegramNotifierApi/TestNotifier');
  }

  // InfuseSync plugin
  async createInfuseSyncCheckpoint(): Promise<{ CheckpointId?: string }> {
    return this.request<{ CheckpointId?: string }>('POST', '/InfuseSync/Checkpoint');
  }
  async startInfuseSyncCheckpoint(checkpointId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('POST', `/InfuseSync/Checkpoint/${encodeURIComponent(checkpointId)}/StartSync`);
  }
  async getInfuseSyncRemovedItems(checkpointId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', `/InfuseSync/Checkpoint/${encodeURIComponent(checkpointId)}/RemovedItems`);
  }
  async getInfuseSyncUpdatedItems(checkpointId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', `/InfuseSync/Checkpoint/${encodeURIComponent(checkpointId)}/UpdatedItems`);
  }
  async getInfuseSyncUserData(checkpointId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', `/InfuseSync/Checkpoint/${encodeURIComponent(checkpointId)}/UserData`);
  }
  async getInfuseSyncUserFolders(userId?: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', `/InfuseSync/UserFolders/${userId ?? this.userId}`);
  }
}
