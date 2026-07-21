import { ApiClientBase } from './base.js';
import type {
  BaseItemDto,
  QueryResult,
  RemoteSubtitleInfo,
  MediaSegment,
  LyricsInfo,
  UploadSubtitleDto,
} from '../types/index.js';

/**
 * Provides media api behavior for the Jellyfin client and command runtime.
 */
export class MediaApi extends ApiClientBase {
  /**
   * Retrieves or derives remote subtitles without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param language - The language value required by this operation.
   * @param isPerfectMatch - The is perfect match value required by this operation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async searchRemoteSubtitles(itemId: string, language: string, isPerfectMatch?: boolean): Promise<RemoteSubtitleInfo[]> {
    return this.request<RemoteSubtitleInfo[]>('GET', `/Items/${itemId}/RemoteSearch/Subtitles/${language}`, { isPerfectMatch });
  }

  /**
   * Performs the download remote subtitle operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param subtitleId - The subtitle id value required by this operation.
   */
  async downloadRemoteSubtitle(itemId: string, subtitleId: string): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}/RemoteSearch/Subtitles/${subtitleId}`);
  }

  /**
   * Performs the upload subtitle operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param subtitle - The subtitle value required by this operation.
   */
  async uploadSubtitle(itemId: string, subtitle: UploadSubtitleDto): Promise<void> {
    await this.request<void>('POST', `/Videos/${itemId}/Subtitles`, undefined, subtitle);
  }

  /**
   * Performs the delete subtitle operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param index - The index value required by this operation.
   */
  async deleteSubtitle(itemId: string, index: number): Promise<void> {
    await this.request<void>('DELETE', `/Videos/${itemId}/Subtitles/${index}`);
  }

  /**
   * Retrieves or derives subtitle providers without mutating Jellyfin state.
   * @returns - The typed get subtitle providers result.
   */
  async getSubtitleProviders(): Promise<{ Name?: string | null }[]> {
    return this.request<{ Name?: string | null }[]>('GET', '/Providers/Subtitles/Subtitles');
  }

  /**
   * Retrieves or derives media segments without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getMediaSegments(itemId: string): Promise<MediaSegment[]> {
    return this.request<MediaSegment[]>('GET', `/MediaSegments/${itemId}`);
  }

  /**
   * Performs the create media segment operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param segment - The segment value required by this operation.
   * @returns - The normalized string representation.
   */
  async createMediaSegment(itemId: string, segment: Partial<MediaSegment>): Promise<MediaSegment> {
    return this.request<MediaSegment>('POST', `/MediaSegments/${itemId}`, undefined, segment);
  }

  /**
   * Performs the delete media segments operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   */
  async deleteMediaSegments(itemId: string): Promise<void> {
    await this.request<void>('DELETE', `/MediaSegments/${itemId}`);
  }

  /**
   * Retrieves or derives lyrics without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getLyrics(itemId: string): Promise<LyricsInfo> {
    return this.request<LyricsInfo>('GET', `/Audio/${itemId}/Lyrics`);
  }

  /**
   * Performs the delete lyrics operation through the typed Jellyfin API boundary.
   * @param lyricsId - The lyrics id value required by this operation.
   */
  async deleteLyrics(lyricsId: string): Promise<void> {
    await this.request<void>('DELETE', `/Lyrics/${lyricsId}`);
  }

  /**
   * Performs the upload lyrics operation through the typed Jellyfin API boundary.
   * @param itemId - The item id value required by this operation.
   * @param lyrics - The lyrics value required by this operation.
   * @returns - The normalized string representation.
   */
  async uploadLyrics(itemId: string, lyrics: Partial<LyricsInfo>): Promise<LyricsInfo> {
    return this.request<LyricsInfo>('POST', `/Lyrics/${itemId}`, undefined, lyrics);
  }

  /**
   * Retrieves or derives remote lyrics without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @returns - The normalized string representation.
   */
  async searchRemoteLyrics(itemId: string): Promise<RemoteSubtitleInfo[]> {
    return this.request<RemoteSubtitleInfo[]>('GET', `/Items/${itemId}/RemoteSearch/Lyrics`);
  }

  /**
   * Retrieves or derives lyric providers without mutating Jellyfin state.
   * @returns - The typed get lyric providers result.
   */
  async getLyricProviders(): Promise<{ Name?: string | null }[]> {
    return this.request<{ Name?: string | null }[]>('GET', '/Providers/Lyrics');
  }

  /**
   * Retrieves or derives channel features without mutating Jellyfin state.
   * @param channelId - The channel id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getChannelFeatures(channelId: string): Promise<{ SupportsMediaDeletion?: boolean; SupportsLatestItems?: boolean; CanFilter?: boolean }> {
    return this.request<{ SupportsMediaDeletion?: boolean; SupportsLatestItems?: boolean; CanFilter?: boolean }>('GET', `/Channels/${channelId}/Features`);
  }

  /**
   * Retrieves or derives channel items without mutating Jellyfin state.
   * @param channelId - The channel id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.folderId - The folder id value required by this operation.
   * @param params.userId - The stable Jellyfin user identifier.
   * @param params.startIndex - The start index value required by this operation.
   * @param params.limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getChannelItems(channelId: string, params?: { folderId?: string; userId?: string; startIndex?: number; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', `/Channels/${channelId}/Items`, params as Record<string, unknown>);
  }

  /**
   * Retrieves or derives latest channel items without mutating Jellyfin state.
   * @param channelId - The channel id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param limit - The limit value required by this operation.
   * @returns - The normalized string representation.
   */
  async getLatestChannelItems(channelId: string, userId?: string, limit?: number): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Channels/${channelId}/Latest`, { userId, limit });
  }

  /**
   * Retrieves or derives hls master playlist url without mutating Jellyfin state.
   * @param itemId - The item id value required by this operation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.mediaSourceId - The media source id value required by this operation.
   * @param params.audioStreamIndex - The audio stream index value required by this operation.
   * @param params.subtitleStreamIndex - The subtitle stream index value required by this operation.
   * @param params.maxStreamingBitrate - The max streaming bitrate value required by this operation.
   * @param params.videoCodec - The video codec value required by this operation.
   * @param params.audioCodec - The audio codec value required by this operation.
   * @returns - The normalized string representation.
   */
  getHlsMasterPlaylistUrl(itemId: string, params?: { mediaSourceId?: string; audioStreamIndex?: number; subtitleStreamIndex?: number; maxStreamingBitrate?: number; videoCodec?: string; audioCodec?: string }): string {
    const queryParams = { ...params, userId: this.userId };
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const qs = searchParams.toString();
    return `${this.getBackendUrl()}/Videos/${itemId}/master.m3u8${qs ? `?${qs}` : ''}`;
  }
}
