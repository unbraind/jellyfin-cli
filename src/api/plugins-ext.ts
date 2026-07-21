import { ApiClientBase } from './base.js';

// API methods for optional Jellyfin plugins: Meilisearch, TMDb, Telegram, InfuseSync.
// These endpoints are only available when the respective plugin is installed.

/**
 * Provides plugins ext api behavior for the Jellyfin client and command runtime.
 */
export class PluginsExtApi extends ApiClientBase {
  // Library media notification hooks
  /**
   * Implements notify library media updated for the typed Jellyfin CLI runtime.
   * @param updates - The updates value required by this operation.
   * @returns - The typed notify library media updated result.
   */
  async notifyLibraryMediaUpdated(updates: { Path?: string; UpdateType?: string }[]): Promise<void> {
    await this.request<void>('POST', '/Library/Media/Updated', undefined, updates);
  }
  /**
   * Implements notify movies added for the typed Jellyfin CLI runtime.
   * @param updates - The updates value required by this operation.
   * @returns - The typed notify movies added result.
   */
  async notifyMoviesAdded(updates: { Path?: string; UpdateType?: string }[]): Promise<void> {
    await this.request<void>('POST', '/Library/Movies/Added', undefined, updates);
  }
  /**
   * Implements notify movies updated for the typed Jellyfin CLI runtime.
   * @param updates - The updates value required by this operation.
   * @returns - The typed notify movies updated result.
   */
  async notifyMoviesUpdated(updates: { Path?: string; UpdateType?: string }[]): Promise<void> {
    await this.request<void>('POST', '/Library/Movies/Updated', undefined, updates);
  }
  /**
   * Implements notify series added for the typed Jellyfin CLI runtime.
   * @param updates - The updates value required by this operation.
   * @returns - The typed notify series added result.
   */
  async notifySeriesAdded(updates: { Path?: string; UpdateType?: string }[]): Promise<void> {
    await this.request<void>('POST', '/Library/Series/Added', undefined, updates);
  }
  /**
   * Implements notify series updated for the typed Jellyfin CLI runtime.
   * @param updates - The updates value required by this operation.
   * @returns - The typed notify series updated result.
   */
  async notifySeriesUpdated(updates: { Path?: string; UpdateType?: string }[]): Promise<void> {
    await this.request<void>('POST', '/Library/Series/Updated', undefined, updates);
  }

  // Backup manifest (requires path to a backup archive)
  /**
   * Retrieves or derives backup manifest without mutating Jellyfin state.
   * @param path - The API, command, or filesystem path to process.
   * @returns - The normalized string representation.
   */
  async getBackupManifest(path: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', '/Backup/Manifest', { path });
  }

  // Meilisearch plugin
  /**
   * Retrieves or derives meilisearch status without mutating Jellyfin state.
   * @returns - The normalized string representation.
   */
  async getMeilisearchStatus(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', '/meilisearch/status');
  }
  /**
   * Implements reconnect meilisearch for the typed Jellyfin CLI runtime.
   * @returns - The normalized string representation.
   */
  async reconnectMeilisearch(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', '/meilisearch/reconnect');
  }
  /**
   * Implements reindex meilisearch for the typed Jellyfin CLI runtime.
   * @returns - The normalized string representation.
   */
  async reindexMeilisearch(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', '/meilisearch/reindex');
  }

  // TMDb plugin
  /**
   * Retrieves or derives tmdb client configuration without mutating Jellyfin state.
   * @returns - The normalized string representation.
   */
  async getTmdbClientConfiguration(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', '/Tmdb/ClientConfiguration');
  }
  /**
   * Implements refresh tmdb box sets for the typed Jellyfin CLI runtime.
   */
  async refreshTmdbBoxSets(): Promise<void> {
    await this.request<void>('POST', '/TMDbBoxSets/Refresh');
  }

  // Telegram notifier plugin
  /**
   * Implements test telegram notifier for the typed Jellyfin CLI runtime.
   * @returns - The normalized string representation.
   */
  async testTelegramNotifier(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', '/TelegramNotifierApi/TestNotifier');
  }

  // InfuseSync plugin
  /**
   * Performs the create infuse sync checkpoint operation through the typed Jellyfin API boundary.
   * @returns - The typed create infuse sync checkpoint result.
   */
  async createInfuseSyncCheckpoint(): Promise<{ CheckpointId?: string }> {
    return this.request<{ CheckpointId?: string }>('POST', '/InfuseSync/Checkpoint');
  }
  /**
   * Performs the start infuse sync checkpoint operation through the typed Jellyfin API boundary.
   * @param checkpointId - The checkpoint id value required by this operation.
   * @returns - The normalized string representation.
   */
  async startInfuseSyncCheckpoint(checkpointId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('POST', `/InfuseSync/Checkpoint/${encodeURIComponent(checkpointId)}/StartSync`);
  }
  /**
   * Retrieves or derives infuse sync removed items without mutating Jellyfin state.
   * @param checkpointId - The checkpoint id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getInfuseSyncRemovedItems(checkpointId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', `/InfuseSync/Checkpoint/${encodeURIComponent(checkpointId)}/RemovedItems`);
  }
  /**
   * Retrieves or derives infuse sync updated items without mutating Jellyfin state.
   * @param checkpointId - The checkpoint id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getInfuseSyncUpdatedItems(checkpointId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', `/InfuseSync/Checkpoint/${encodeURIComponent(checkpointId)}/UpdatedItems`);
  }
  /**
   * Retrieves or derives infuse sync user data without mutating Jellyfin state.
   * @param checkpointId - The checkpoint id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getInfuseSyncUserData(checkpointId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', `/InfuseSync/Checkpoint/${encodeURIComponent(checkpointId)}/UserData`);
  }
  /**
   * Retrieves or derives infuse sync user folders without mutating Jellyfin state.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - The normalized string representation.
   */
  async getInfuseSyncUserFolders(userId?: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', `/InfuseSync/UserFolders/${userId ?? this.userId}`);
  }
}
