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

export class LibraryApi extends ApiClientBase {
  async getVirtualFolders(): Promise<VirtualFolderInfo[]> {
    return this.request<VirtualFolderInfo[]>('GET', '/Library/VirtualFolders');
  }

  async addVirtualFolder(name: string, collectionType?: string, paths?: string[], options?: LibraryOptions): Promise<void> {
    await this.request<void>('POST', '/Library/VirtualFolders', { Name: name, CollectionType: collectionType, Paths: paths?.join('|') }, options ? { LibraryOptions: options } : undefined);
  }

  async removeVirtualFolder(name: string): Promise<void> {
    await this.request<void>('DELETE', '/Library/VirtualFolders', { Name: name });
  }

  async renameVirtualFolder(name: string, newName: string): Promise<void> {
    await this.request<void>('POST', '/Library/VirtualFolders/Name', { Name: name, NewName: newName });
  }

  async addMediaPath(name: string, path: string, options?: LibraryOptions): Promise<void> {
    await this.request<void>('POST', '/Library/VirtualFolders/Paths', { Name: name, Path: path }, options ? { LibraryOptions: options } : undefined);
  }

  async removeMediaPath(name: string, path: string): Promise<void> {
    await this.request<void>('DELETE', '/Library/VirtualFolders/Paths', { Name: name, Path: path });
  }

  async updateLibraryOptions(id: string, options: LibraryOptions): Promise<void> {
    await this.request<void>('POST', '/Library/VirtualFolders/LibraryOptions', { Id: id }, options);
  }

  async getMediaFolders(): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', '/Library/MediaFolders');
  }

  async getPhysicalPaths(): Promise<string[]> {
    return this.request<string[]>('GET', '/Library/PhysicalPaths');
  }

  async getQueryFilters(params?: { userId?: string; parentId?: string; includeItemTypes?: string[] }): Promise<QueryFilters> {
    return this.request<QueryFilters>('GET', '/Items/Filters', params as Record<string, unknown>);
  }

  async getThemeSongs(itemId: string, userId?: string, inheritFromParent?: boolean): Promise<ThemeMediaResult> {
    return this.request<ThemeMediaResult>('GET', `/Items/${itemId}/ThemeSongs`, { userId, inheritFromParent });
  }

  async getThemeVideos(itemId: string, userId?: string, inheritFromParent?: boolean): Promise<ThemeMediaResult> {
    return this.request<ThemeMediaResult>('GET', `/Items/${itemId}/ThemeVideos`, { userId, inheritFromParent });
  }

  async getThemeMedia(itemId: string, userId?: string, inheritFromParent?: boolean): Promise<ThemeMediaResult> {
    return this.request<ThemeMediaResult>('GET', `/Items/${itemId}/ThemeMedia`, { userId, inheritFromParent });
  }

  async getRemoteImages(itemId: string, params?: { type?: string; startIndex?: number; limit?: number }): Promise<{ Images?: RemoteImageInfo[]; TotalRecordCount?: number; Providers?: string[] }> {
    return this.request<{ Images?: RemoteImageInfo[]; TotalRecordCount?: number; Providers?: string[] }>('GET', `/Items/${itemId}/RemoteImages`, params);
  }

  async getRemoteImageProviders(itemId: string): Promise<{ Name?: string | null }[]> {
    return this.request<{ Name?: string | null }[]>('GET', `/Items/${itemId}/RemoteImages/Providers`);
  }

  async downloadRemoteImage(itemId: string, params?: { type?: string; imageUrl?: string }): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}/RemoteImages/Download`, params);
  }

  async getExternalIdInfos(itemId: string): Promise<ExternalIdInfo[]> {
    return this.request<ExternalIdInfo[]>('GET', `/Items/${itemId}/ExternalIdInfos`);
  }

  async getItemDownload(itemId: string): Promise<Blob> {
    const response = await fetch(`${this.getBackendUrl()}/Items/${itemId}/Download`, {
      headers: { 'X-Emby-Token': this.apiKey ?? '' },
    });
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    return response.blob();
  }

  async reportSeriesAdded(tvdbId: string): Promise<void> {
    await this.request<void>('POST', '/Library/Series/Added', { tvdbId });
  }

  async reportMoviesAdded(params?: { tmdbId?: string; imdbId?: string }): Promise<void> {
    await this.request<void>('POST', '/Library/Movies/Added', params);
  }
}
