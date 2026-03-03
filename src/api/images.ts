import { ApiClientBase } from './base.js';

export interface ItemImageInfo {
  Path?: string | null;
  Type?: string | null;
  DateModified?: string | null;
  Size?: number | null;
  Width?: number | null;
  Height?: number | null;
  BlurHash?: string | null;
}

export class ImagesApi extends ApiClientBase {
  async getItemImages(itemId: string): Promise<ItemImageInfo[]> {
    return this.request<ItemImageInfo[]>('GET', `/Items/${itemId}/Images`);
  }

  getItemImage(itemId: string, imageType: string, params?: { tag?: string; maxWidth?: number; maxHeight?: number; width?: number; height?: number; quality?: number; fillWidth?: number; fillHeight?: number; cropWhitespace?: boolean; addPlayedIndicator?: boolean; blur?: number; backgroundColor?: string; foregroundLayer?: string; imageIndex?: number }): string {
    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
    }
    const qs = searchParams.toString();
    return `${this.getBackendUrl()}/Items/${itemId}/Images/${imageType}${qs ? `?${qs}` : ''}`;
  }

  async deleteItemImage(itemId: string, imageType: string, imageIndex?: number): Promise<void> {
    const path = imageIndex !== undefined ? `/Items/${itemId}/Images/${imageType}/${imageIndex}` : `/Items/${itemId}/Images/${imageType}`;
    await this.request<void>('DELETE', path);
  }

  async uploadItemImage(itemId: string, imageType: string, imageData: Buffer | Blob, _params?: { imageIndex?: number }): Promise<void> {
    const formData = new FormData();
    formData.append('data', imageData);
    const response = await fetch(`${this.getBackendUrl()}/Items/${itemId}/Images`, {
      method: 'POST',
      headers: {
        'X-Emby-Token': this.apiKey ?? '',
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.status}`);
    }
  }

  async setItemImageIndex(itemId: string, imageType: string, imageIndex: number, newIndex: number): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}/Images/${imageType}/${imageIndex}/Index`, { newIndex });
  }

  async deleteUserImage(userId: string, imageType: string, imageIndex?: number): Promise<void> {
    const path = imageIndex !== undefined ? `/Users/${userId}/Images/${imageType}/${imageIndex}` : `/Users/${userId}/Images/${imageType}`;
    await this.request<void>('DELETE', path);
  }

  async uploadUserImage(userId: string, imageType: string, imageData: Buffer | Blob): Promise<void> {
    const formData = new FormData();
    formData.append('data', imageData);
    const response = await fetch(`${this.getBackendUrl()}/Users/${userId}/Images/${imageType}`, {
      method: 'POST',
      headers: {
        'X-Emby-Token': this.apiKey ?? '',
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`Failed to upload user image: ${response.status}`);
    }
  }

  getArtistImage(artistId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string }): string {
    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
    }
    const qs = searchParams.toString();
    return `${this.getBackendUrl()}/Artists/${artistId}/Images/${imageType}${qs ? `?${qs}` : ''}`;
  }

  getGenreImage(genreId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string }): string {
    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
    }
    const qs = searchParams.toString();
    return `${this.getBackendUrl()}/Genres/${genreId}/Images/${imageType}${qs ? `?${qs}` : ''}`;
  }

  getMusicGenreImage(musicGenreId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string }): string {
    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
    }
    const qs = searchParams.toString();
    return `${this.getBackendUrl()}/MusicGenres/${musicGenreId}/Images/${imageType}${qs ? `?${qs}` : ''}`;
  }

  getPersonImage(personId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string }): string {
    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
    }
    const qs = searchParams.toString();
    return `${this.getBackendUrl()}/Persons/${personId}/Images/${imageType}${qs ? `?${qs}` : ''}`;
  }

  getStudioImage(studioId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string }): string {
    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
    }
    const qs = searchParams.toString();
    return `${this.getBackendUrl()}/Studios/${studioId}/Images/${imageType}${qs ? `?${qs}` : ''}`;
  }

  getUserImage(userId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string; imageIndex?: number }): string {
    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
    }
    const qs = searchParams.toString();
    return `${this.getBackendUrl()}/Users/${userId}/Images/${imageType}${qs ? `?${qs}` : ''}`;
  }
}
