/**
 * Produces the validated build query string result used by CLI automation.
 * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
 * @returns - The normalized string representation.
 */
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

/**
 * Provides jellyfin api error behavior for the Jellyfin client and command runtime.
 */
export class JellyfinApiError extends Error {
  public statusCode: number | undefined;
  public details: unknown;

  /**
   * Creates an instance with the collaborators required by its runtime behavior.
   * @param message - The message value required by this operation.
   * @param statusCode - The status code value required by this operation.
   * @param details - Optional structured diagnostic details.
   */
  constructor(
    message: string,
    statusCode?: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'JellyfinApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Defines the chapter info contract used across typed Jellyfin boundaries.
 */
export interface ChapterInfo {
  startPositionTicks?: number | null;
  name?: string | null;
  imageTag?: string | null;
  imageDateModified?: string | null;
}

/**
 * Defines the playback info response contract used across typed Jellyfin boundaries.
 */
export interface PlaybackInfoResponse {
  mediaSources?: MediaSourceInfo[] | null;
  playSessionId?: string | null;
}

/**
 * Defines the media source info contract used across typed Jellyfin boundaries.
 */
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

/**
 * Defines the user item data contract used across typed Jellyfin boundaries.
 */
export interface UserItemData {
  Played?: boolean;
  PlayCount?: number;
  IsFavorite?: boolean;
  PlaybackPositionTicks?: number;
  LastPlayedDate?: string | null;
}
