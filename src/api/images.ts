import { ApiClientBase } from './base.js';

/**
 * Defines the item image info contract used across typed Jellyfin boundaries.
 */
export interface ItemImageInfo {
  Path?: string | null;
  Type?: string | null;
  DateModified?: string | null;
  Size?: number | null;
  Width?: number | null;
  Height?: number | null;
  BlurHash?: string | null;
}

/**
 * Provides images api behavior for the Jellyfin client and command runtime.
 */
export class ImagesApi extends ApiClientBase {
  private buildImageUrl(
    path: string,
    params?: Record<string, string | number | boolean | null | undefined>,
  ): string {
    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
    }
    const qs = searchParams.toString();
    return `${this.getBackendUrl()}${path}${qs ? `?${qs}` : ''}`;
  }

  /**
   * Retrieves or derives item images without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getItemImages(itemId: string): Promise<ItemImageInfo[]> {
    return this.request<ItemImageInfo[]>('GET', `/Items/${itemId}/Images`);
  }

  /**
   * Retrieves or derives item image without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.tag - The tag value required by this operation.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.width - The width value required by this operation.
   * @param params.height - The height value required by this operation.
   * @param params.quality - The quality value required by this operation.
   * @param params.fillWidth - The fill width value required by this operation.
   * @param params.fillHeight - The fill height value required by this operation.
   * @param params.cropWhitespace - The crop whitespace value required by this operation.
   * @param params.addPlayedIndicator - The add played indicator value required by this operation.
   * @param params.blur - The blur value required by this operation.
   * @param params.backgroundColor - The background color value required by this operation.
   * @param params.foregroundLayer - The foreground layer value required by this operation.
   * @param params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
  getItemImage(itemId: string, imageType: string, params?: {
    tag?: string;
    maxWidth?: number;
    maxHeight?: number;
    width?: number;
    height?: number;
    quality?: number;
    fillWidth?: number;
    fillHeight?: number;
    cropWhitespace?: boolean;
    addPlayedIndicator?: boolean;
    blur?: number;
    backgroundColor?: string;
    foregroundLayer?: string;
    imageIndex?: number;
  }): string {
    return this.buildImageUrl(`/Items/${itemId}/Images/${imageType}`, params);
  }

  /**
   * Performs the delete item image operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param imageIndex - The image index value required by this operation.
   */
  async deleteItemImage(itemId: string, imageType: string, imageIndex?: number): Promise<void> {
    const path = imageIndex !== undefined ? `/Items/${itemId}/Images/${imageType}/${imageIndex}` : `/Items/${itemId}/Images/${imageType}`;
    await this.request<void>('DELETE', path);
  }

  /**
   * Performs the upload item image operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param imageData - The image data value required by this operation.
   * @param _params - The params value required by this operation.
   * @param _params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
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

  /**
   * Performs the set item image index operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param imageIndex - The image index value required by this operation.
   * @param newIndex - The new index value required by this operation.
   */
  async setItemImageIndex(itemId: string, imageType: string, imageIndex: number, newIndex: number): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}/Images/${imageType}/${imageIndex}/Index`, { newIndex });
  }

  /**
   * Performs the delete user image operation through the typed Jellyfin API boundary.
   * @param userId - The stable Jellyfin user identifier.
   * @param imageType - The image type value required by this operation.
   * @param imageIndex - The image index value required by this operation.
   */
  async deleteUserImage(userId: string, imageType: string, imageIndex?: number): Promise<void> {
    const path = imageIndex !== undefined ? `/Users/${userId}/Images/${imageType}/${imageIndex}` : `/Users/${userId}/Images/${imageType}`;
    await this.request<void>('DELETE', path);
  }

  /**
   * Performs the upload user image operation through the typed Jellyfin API boundary.
   * @param userId - The stable Jellyfin user identifier.
   * @param imageType - The image type value required by this operation.
   * @param imageData - The image data value required by this operation.
   */
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

  /**
   * Retrieves or derives artist image without mutating Jellyfin state.
   * @param artistId - The artist id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.tag - The tag value required by this operation.
   * @param params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
  getArtistImage(artistId: string, imageType: string, params?: {
    maxWidth?: number;
    maxHeight?: number;
    tag?: string;
    imageIndex?: number;
  }): string {
    const path = params?.imageIndex !== undefined
      ? `/Artists/${artistId}/Images/${imageType}/${params.imageIndex}`
      : `/Artists/${artistId}/Images/${imageType}`;
    return this.buildImageUrl(path, {
      maxWidth: params?.maxWidth,
      maxHeight: params?.maxHeight,
      tag: params?.tag,
    });
  }

  /**
   * Retrieves or derives genre image without mutating Jellyfin state.
   * @param genreId - The genre id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.tag - The tag value required by this operation.
   * @param params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
  getGenreImage(genreId: string, imageType: string, params?: {
    maxWidth?: number;
    maxHeight?: number;
    tag?: string;
    imageIndex?: number;
  }): string {
    const path = params?.imageIndex !== undefined
      ? `/Genres/${genreId}/Images/${imageType}/${params.imageIndex}`
      : `/Genres/${genreId}/Images/${imageType}`;
    return this.buildImageUrl(path, {
      maxWidth: params?.maxWidth,
      maxHeight: params?.maxHeight,
      tag: params?.tag,
    });
  }

  /**
   * Retrieves or derives music genre image without mutating Jellyfin state.
   * @param musicGenreId - The music genre id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.tag - The tag value required by this operation.
   * @param params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
  getMusicGenreImage(musicGenreId: string, imageType: string, params?: {
    maxWidth?: number;
    maxHeight?: number;
    tag?: string;
    imageIndex?: number;
  }): string {
    const path = params?.imageIndex !== undefined
      ? `/MusicGenres/${musicGenreId}/Images/${imageType}/${params.imageIndex}`
      : `/MusicGenres/${musicGenreId}/Images/${imageType}`;
    return this.buildImageUrl(path, {
      maxWidth: params?.maxWidth,
      maxHeight: params?.maxHeight,
      tag: params?.tag,
    });
  }

  /**
   * Retrieves or derives person image without mutating Jellyfin state.
   * @param personId - The person id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.tag - The tag value required by this operation.
   * @param params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
  getPersonImage(personId: string, imageType: string, params?: {
    maxWidth?: number;
    maxHeight?: number;
    tag?: string;
    imageIndex?: number;
  }): string {
    const path = params?.imageIndex !== undefined
      ? `/Persons/${personId}/Images/${imageType}/${params.imageIndex}`
      : `/Persons/${personId}/Images/${imageType}`;
    return this.buildImageUrl(path, {
      maxWidth: params?.maxWidth,
      maxHeight: params?.maxHeight,
      tag: params?.tag,
    });
  }

  /**
   * Retrieves or derives studio image without mutating Jellyfin state.
   * @param studioId - The studio id value required by this operation.
   * @param imageType - The image type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.tag - The tag value required by this operation.
   * @param params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
  getStudioImage(studioId: string, imageType: string, params?: {
    maxWidth?: number;
    maxHeight?: number;
    tag?: string;
    imageIndex?: number;
  }): string {
    const path = params?.imageIndex !== undefined
      ? `/Studios/${studioId}/Images/${imageType}/${params.imageIndex}`
      : `/Studios/${studioId}/Images/${imageType}`;
    return this.buildImageUrl(path, {
      maxWidth: params?.maxWidth,
      maxHeight: params?.maxHeight,
      tag: params?.tag,
    });
  }

  /**
   * Retrieves or derives user image without mutating Jellyfin state.
   * @param userId - The stable Jellyfin user identifier.
   * @param imageType - The image type value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.maxWidth - The max width value required by this operation.
   * @param params.maxHeight - The max height value required by this operation.
   * @param params.tag - The tag value required by this operation.
   * @param params.imageIndex - The image index value required by this operation.
   * @returns - The normalized string representation.
   */
  getUserImage(userId: string, imageType: string, params?: { maxWidth?: number; maxHeight?: number; tag?: string; imageIndex?: number }): string {
    return this.buildImageUrl(`/Users/${userId}/Images/${imageType}`, params);
  }
}
