export interface LiveTvInfo {
  Services?: LiveTvServiceInfo[] | null;
  IsEnabled?: boolean;
  EnabledUsers?: string[] | null;
}

export interface LiveTvServiceInfo {
  Name?: string | null;
  Status?: string | null;
  StatusMessage?: string | null;
  Version?: string | null;
  HasUpdateAvailable?: boolean;
  IsVisible?: boolean;
  Tuners?: string[] | null;
}

export interface PlaylistCreationResult {
  Id?: string | null;
  Name?: string | null;
}

export interface RecommendationDto {
  BaselineItemName?: string | null;
  CategoryId?: string | null;
  Items?: import('./items.js').BaseItemDto[] | null;
  RecommendationType?: RecommendationType;
}

export type RecommendationType = 'SimilarToRecentlyPlayed' | 'SimilarToLiked' | 'HasDirectorFromRecentlyPlayed' | 'HasActorFromRecentlyPlayed' | 'HasLikedDirector' | 'HasLikedActor';

export interface SimilarItemResult {
  Items?: import('./items.js').BaseItemDto[] | null;
  TotalRecordCount?: number | null;
}
