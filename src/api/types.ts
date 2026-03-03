export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      }
    } else {
      searchParams.append(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export class JellyfinApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'JellyfinApiError';
  }
}

export interface ChapterInfo {
  startPositionTicks?: number | null;
  name?: string | null;
  imageTag?: string | null;
  imageDateModified?: string | null;
}

export interface PlaybackInfoResponse {
  mediaSources?: MediaSourceInfo[] | null;
  playSessionId?: string | null;
}

export interface MediaSourceInfo {
  Id?: string | null;
  Name?: string | null;
  Path?: string | null;
  Container?: string | null;
  Bitrate?: number | null;
  Size?: number | null;
  RunTimeTicks?: number | null;
  SupportsDirectPlay?: boolean;
  SupportsDirectStream?: boolean;
  SupportsTranscoding?: boolean;
  IsRemote?: boolean;
}

export interface UserItemData {
  Played?: boolean;
  PlayCount?: number;
  IsFavorite?: boolean;
  PlaybackPositionTicks?: number;
  LastPlayedDate?: string | null;
}
