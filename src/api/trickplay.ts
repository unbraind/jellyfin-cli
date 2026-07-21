import { ApiClientBase } from './base.js';

/**
 * Provides trickplay api behavior for the Jellyfin client and command runtime.
 */
export class TrickplayApi extends ApiClientBase {
  /**
   * Retrieves or derives trickplay hls playlist url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param width - The width value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @returns - The normalized string representation.
   */
  getTrickplayHlsPlaylistUrl(itemId: string, width: number, params?: { mediaSourceId?: string }): string {
    const searchParams = new URLSearchParams();
    searchParams.append('width', String(width));
    if (params?.mediaSourceId) {
      searchParams.append('mediaSourceId', params.mediaSourceId);
    }
    return `${this.getBackendUrl()}/Videos/${itemId}/Trickplay/${width}/tiles.m3u8?${searchParams.toString()}`;
  }

  /**
   * Retrieves or derives trickplay tile image url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param width - The width value required by this operation.
   * @param index - The index value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @returns - The normalized string representation.
   */
  getTrickplayTileImageUrl(itemId: string, width: number, index: number, params?: { mediaSourceId?: string }): string {
    const searchParams = new URLSearchParams();
    if (params?.mediaSourceId) {
      searchParams.append('mediaSourceId', params.mediaSourceId);
    }
    return `${this.getBackendUrl()}/Videos/${itemId}/Trickplay/${width}/${index}.jpg?${searchParams.toString()}`;
  }
}
