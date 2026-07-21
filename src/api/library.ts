import { ApiClientBase } from './base.js';
import type {
  BaseItemDto,
  QueryResult,
  VirtualFolderInfo,
  LibraryOptions,
  QueryFilters,
  RemoteImageInfo,
  ExternalIdInfo,
  ThemeMediaResult,
} from '../types/index.js';

/**
 * Provides library api behavior for the Jellyfin client and command runtime.
 */
export class LibraryApi extends ApiClientBase {
  /**
   * Retrieves or derives virtual folders without mutating Jellyfin state.
   * @returns - The typed get virtual folders result.
   */
  async getVirtualFolders(): Promise<VirtualFolderInfo[]> {
    return this.request<VirtualFolderInfo[]>('GET', '/Library/VirtualFolders');
  }

  /**
   * Performs the add virtual folder operation through the typed Jellyfin API boundary.
   * @param name - The name value required by this operation.
   * @param collectionType - The collection type value required by this operation.
   * @param paths - The paths value required by this operation.
   * @param options - Optional settings that refine the operation.
   */
  async addVirtualFolder(name: string, collectionType?: string, paths?: string[], options?: LibraryOptions): Promise<void> {
    await this.request<void>('POST', '/Library/VirtualFolders', { Name: name, CollectionType: collectionType, Paths: paths?.join('|') }, options ? { LibraryOptions: options } : undefined);
  }

  /**
   * Performs the remove virtual folder operation through the typed Jellyfin API boundary.
   * @param name - The name value required by this operation.
   */
  async removeVirtualFolder(name: string): Promise<void> {
    await this.request<void>('DELETE', '/Library/VirtualFolders', { Name: name });
  }

  /**
   * Implements rename virtual folder for the typed Jellyfin CLI runtime.
   * @param name - The name value required by this operation.
   * @param newName - The new name value required by this operation.
   */
  async renameVirtualFolder(name: string, newName: string): Promise<void> {
    await this.request<void>('POST', '/Library/VirtualFolders/Name', { Name: name, NewName: newName });
  }

  /**
   * Performs the add media path operation through the typed Jellyfin API boundary.
   * @param name - The name value required by this operation.
   * @param path - The API, command, or filesystem path to process.
   * @param options - Optional settings that refine the operation.
   */
  async addMediaPath(name: string, path: string, options?: LibraryOptions): Promise<void> {
    await this.request<void>('POST', '/Library/VirtualFolders/Paths', { Name: name, Path: path }, options ? { LibraryOptions: options } : undefined);
  }

  /**
   * Performs the remove media path operation through the typed Jellyfin API boundary.
   * @param name - The name value required by this operation.
   * @param path - The API, command, or filesystem path to process.
   */
  async removeMediaPath(name: string, path: string): Promise<void> {
    await this.request<void>('DELETE', '/Library/VirtualFolders/Paths', { Name: name, Path: path });
  }

  /**
   * Performs the update library options operation through the typed Jellyfin API boundary.
   * @param id - The id value required by this operation.
   * @param options - Optional settings that refine the operation.
   */
  async updateLibraryOptions(id: string, options: LibraryOptions): Promise<void> {
    await this.request<void>('POST', '/Library/VirtualFolders/LibraryOptions', { Id: id }, options);
  }

  /**
   * Retrieves or derives media folders without mutating Jellyfin state.
   * @returns - The typed get media folders result.
   */
  async getMediaFolders(): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', '/Library/MediaFolders');
  }

  /**
   * Retrieves or derives physical paths without mutating Jellyfin state.
   * @returns - The normalized string representation.
   */
  async getPhysicalPaths(): Promise<string[]> {
    return this.request<string[]>('GET', '/Library/PhysicalPaths');
  }

  /**
   * Retrieves or derives query filters without mutating Jellyfin state.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.parentId - The parent id value required by this operation.
   * @param params.includeItemTypes - The include item types value required by this operation.
   * @returns - The typed get query filters result.
   */
  async getQueryFilters(params?: { userId?: string; parentId?: string; includeItemTypes?: string[] }): Promise<QueryFilters> {
    return this.request<QueryFilters>('GET', '/Items/Filters', params as Record<string, unknown>);
  }

  /**
   * Retrieves or derives theme songs without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param inheritFromParent - The inherit from parent value required by this operation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async getThemeSongs(itemId: string, userId?: string, inheritFromParent?: boolean): Promise<ThemeMediaResult> {
    return this.request<ThemeMediaResult>('GET', `/Items/${itemId}/ThemeSongs`, { userId, inheritFromParent });
  }

  /**
   * Retrieves or derives theme videos without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param inheritFromParent - The inherit from parent value required by this operation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async getThemeVideos(itemId: string, userId?: string, inheritFromParent?: boolean): Promise<ThemeMediaResult> {
    return this.request<ThemeMediaResult>('GET', `/Items/${itemId}/ThemeVideos`, { userId, inheritFromParent });
  }

  /**
   * Retrieves or derives theme media without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param inheritFromParent - The inherit from parent value required by this operation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async getThemeMedia(itemId: string, userId?: string, inheritFromParent?: boolean): Promise<ThemeMediaResult> {
    return this.request<ThemeMediaResult>('GET', `/Items/${itemId}/ThemeMedia`, { userId, inheritFromParent });
  }

  /**
   * Retrieves or derives remote images without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.type - The type value required by this operation.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getRemoteImages(itemId: string, params?: { type?: string; startIndex?: number; limit?: number }): Promise<{ Images?: RemoteImageInfo[]; TotalRecordCount?: number; Providers?: string[] }> {
    return this.request<{ Images?: RemoteImageInfo[]; TotalRecordCount?: number; Providers?: string[] }>('GET', `/Items/${itemId}/RemoteImages`, params);
  }

  /**
   * Retrieves or derives remote image providers without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getRemoteImageProviders(itemId: string): Promise<{ Name?: string | null }[]> {
    return this.request<{ Name?: string | null }[]>('GET', `/Items/${itemId}/RemoteImages/Providers`);
  }

  /**
   * Performs the download remote image operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.type - The type value required by this operation.
   * @param params.imageUrl - The image url value required by this operation.
   * @returns - The normalized string representation.
   */
  async downloadRemoteImage(itemId: string, params?: { type?: string; imageUrl?: string }): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}/RemoteImages/Download`, params);
  }

  /**
   * Retrieves or derives external id infos without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getExternalIdInfos(itemId: string): Promise<ExternalIdInfo[]> {
    return this.request<ExternalIdInfo[]>('GET', `/Items/${itemId}/ExternalIdInfos`);
  }

  /**
   * Retrieves or derives item download without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getItemDownload(itemId: string): Promise<Blob> {
    const response = await fetch(`${this.getBackendUrl()}/Items/${itemId}/Download`, {
      headers: { 'X-Emby-Token': this.apiKey ?? '' },
    });
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    return response.blob();
  }

  /**
   * Performs the report series added operation through the typed Jellyfin API boundary.
   * @param tvdbId - The tvdb id value required by this operation.
   */
  async reportSeriesAdded(tvdbId: string): Promise<void> {
    await this.request<void>('POST', '/Library/Series/Added', { tvdbId });
  }

  /**
   * Performs the report movies added operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.tmdbId - The tmdb id value required by this operation.
   * @param params.imdbId - The imdb id value required by this operation.
   * @returns - The typed report movies added result.
   */
  async reportMoviesAdded(params?: { tmdbId?: string; imdbId?: string }): Promise<void> {
    await this.request<void>('POST', '/Library/Movies/Added', params);
  }
}
