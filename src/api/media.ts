import { ApiClientBase } from './base.js';
import type {
  BaseItemDto,
  QueryResult,
  RemoteSubtitleInfo,
  MediaSegment,
  LyricsInfo,
  UploadSubtitleDto,
} from '../types/index.js';

export class MediaApi extends ApiClientBase {
  async searchRemoteSubtitles(itemId: string, language: string, isPerfectMatch?: boolean): Promise<RemoteSubtitleInfo[]> {
    return this.request<RemoteSubtitleInfo[]>('GET', `/Items/${itemId}/RemoteSearch/Subtitles/${language}`, { isPerfectMatch });
  }

  async downloadRemoteSubtitle(itemId: string, subtitleId: string): Promise<void> {
    await this.request<void>('POST', `/Items/${itemId}/RemoteSearch/Subtitles/${subtitleId}`);
  }

  async uploadSubtitle(itemId: string, subtitle: UploadSubtitleDto): Promise<void> {
    await this.request<void>('POST', `/Videos/${itemId}/Subtitles`, undefined, subtitle);
  }

  async deleteSubtitle(itemId: string, index: number): Promise<void> {
    await this.request<void>('DELETE', `/Videos/${itemId}/Subtitles/${index}`);
  }

  async getSubtitleProviders(): Promise<{ Name?: string | null }[]> {
    return this.request<{ Name?: string | null }[]>('GET', '/Providers/Subtitles/Subtitles');
  }

  async getMediaSegments(itemId: string): Promise<MediaSegment[]> {
    return this.request<MediaSegment[]>('GET', `/MediaSegments/${itemId}`);
  }

  async createMediaSegment(itemId: string, segment: Partial<MediaSegment>): Promise<MediaSegment> {
    return this.request<MediaSegment>('POST', `/MediaSegments/${itemId}`, undefined, segment);
  }

  async deleteMediaSegments(itemId: string): Promise<void> {
    await this.request<void>('DELETE', `/MediaSegments/${itemId}`);
  }

  async getLyrics(itemId: string): Promise<LyricsInfo> {
    return this.request<LyricsInfo>('GET', `/Audio/${itemId}/Lyrics`);
  }

  async deleteLyrics(lyricsId: string): Promise<void> {
    await this.request<void>('DELETE', `/Lyrics/${lyricsId}`);
  }

  async uploadLyrics(itemId: string, lyrics: Partial<LyricsInfo>): Promise<LyricsInfo> {
    return this.request<LyricsInfo>('POST', `/Lyrics/${itemId}`, undefined, lyrics);
  }

  async searchRemoteLyrics(itemId: string): Promise<RemoteSubtitleInfo[]> {
    return this.request<RemoteSubtitleInfo[]>('GET', `/Items/${itemId}/RemoteSearch/Lyrics`);
  }

  async getLyricProviders(): Promise<{ Name?: string | null }[]> {
    return this.request<{ Name?: string | null }[]>('GET', '/Providers/Lyrics');
  }

  async getChannelFeatures(channelId: string): Promise<{ SupportsMediaDeletion?: boolean; SupportsLatestItems?: boolean; CanFilter?: boolean }> {
    return this.request<{ SupportsMediaDeletion?: boolean; SupportsLatestItems?: boolean; CanFilter?: boolean }>('GET', `/Channels/${channelId}/Features`);
  }

  async getChannelItems(channelId: string, params?: { folderId?: string; userId?: string; startIndex?: number; limit?: number }): Promise<QueryResult<BaseItemDto>> {
    return this.request<QueryResult<BaseItemDto>>('GET', `/Channels/${channelId}/Items`, params as Record<string, unknown>);
  }

  async getLatestChannelItems(channelId: string, userId?: string, limit?: number): Promise<BaseItemDto[]> {
    return this.request<BaseItemDto[]>('GET', `/Channels/${channelId}/Latest`, { userId, limit });
  }

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
