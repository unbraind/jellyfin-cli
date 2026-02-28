import { ApiClientBase } from './base.js';

export class TrickplayApi extends ApiClientBase {
  getTrickplayHlsPlaylistUrl(itemId: string, width: number, params?: { mediaSourceId?: string }): string {
    const searchParams = new URLSearchParams();
    searchParams.append('width', String(width));
    if (params?.mediaSourceId) {
      searchParams.append('mediaSourceId', params.mediaSourceId);
    }
    return `${this.getBackendUrl()}/Videos/${itemId}/Trickplay/${width}/tiles.m3u8?${searchParams.toString()}`;
  }

  getTrickplayTileImageUrl(itemId: string, width: number, index: number, params?: { mediaSourceId?: string }): string {
    const searchParams = new URLSearchParams();
    if (params?.mediaSourceId) {
      searchParams.append('mediaSourceId', params.mediaSourceId);
    }
    return `${this.getBackendUrl()}/Videos/${itemId}/Trickplay/${width}/${index}.jpg?${searchParams.toString()}`;
  }
}
