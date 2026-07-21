/**
 * Defines the live tv info contract used across typed Jellyfin boundaries.
 */
export interface LiveTvInfo {
  Services?: LiveTvServiceInfo[] | null;
  IsEnabled?: boolean;
  EnabledUsers?: string[] | null;
}

/**
 * Defines the live tv service info contract used across typed Jellyfin boundaries.
 */
export interface LiveTvServiceInfo {
  Name?: string | null;
  Status?: string | null;
  StatusMessage?: string | null;
  Version?: string | null;
  HasUpdateAvailable?: boolean;
  IsVisible?: boolean;
  Tuners?: string[] | null;
}

/**
 * Defines the playlist creation result contract used across typed Jellyfin boundaries.
 */
export interface PlaylistCreationResult {
  Id?: string | null;
  Name?: string | null;
}

/**
 * Defines the recommendation dto contract used across typed Jellyfin boundaries.
 */
export interface RecommendationDto {
  BaselineItemName?: string | null;
  CategoryId?: string | null;
  Items?: BaseItemDto[] | null;
  RecommendationType?: RecommendationType;
}

/**
 * Represents the recommendation type values accepted by the typed Jellyfin interface.
 */
export type RecommendationType = 'SimilarToRecentlyPlayed' | 'SimilarToLiked' | 'HasDirectorFromRecentlyPlayed' | 'HasActorFromRecentlyPlayed' | 'HasLikedDirector' | 'HasLikedActor';

/**
 * Defines the similar item result contract used across typed Jellyfin boundaries.
 */
export interface SimilarItemResult {
  Items?: BaseItemDto[] | null;
  TotalRecordCount?: number | null;
}
import type { BaseItemDto } from './items.js';
