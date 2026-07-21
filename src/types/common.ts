/**
 * Defines the search hint contract used across typed Jellyfin boundaries.
 */
export interface SearchHint {
  Id?: string | null;
  Name?: string | null;
  Type?: string | null;
  RunTimeTicks?: number | null;
  ProductionYear?: number | null;
  PrimaryImageTag?: string | null;
  PrimaryImageAspectRatio?: number | null;
  MediaType?: string | null;
  ThumbImageTag?: string | null;
  ThumbImageItemId?: string | null;
  BackdropImageTag?: string | null;
  BackdropImageItemId?: string | null;
  Series?: string | null;
  ChannelId?: string | null;
  ChannelName?: string | null;
  IndexNumber?: number | null;
  ParentIndexNumber?: number | null;
  Artists?: string[] | null;
  Album?: string | null;
  AlbumId?: string | null;
  AlbumArtist?: string | null;
}

/**
 * Defines the search result contract used across typed Jellyfin boundaries.
 */
export interface SearchResult {
  SearchHints?: SearchHint[] | null;
  TotalRecordCount?: number | null;
}

/**
 * Defines the query result contract used across typed Jellyfin boundaries.
 */
export interface QueryResult<T> {
  Items?: T[] | null;
  TotalRecordCount?: number | null;
  StartIndex?: number | null;
}

/**
 * Defines the items query params contract used across typed Jellyfin boundaries.
 */
export interface ItemsQueryParams {
  ids?: string[];
  excludeItemIds?: string[];
  searchTerm?: string;
  recursive?: boolean;
  sortBy?: string;
  sortOrder?: string;
  startIndex?: number;
  limit?: number;
  includeItemTypes?: string[];
  excludeItemTypes?: string[];
  mediaTypes?: string[];
  genres?: string[];
  genreIds?: string[];
  studioIds?: string[];
  personIds?: string[];
  years?: number[];
  parentIds?: string[];
  parentId?: string;
  isFavorite?: boolean;
  isPlayed?: boolean;
  filters?: string[];
  imageTypes?: string[];
  adjacentTo?: string;
  artistIds?: string[];
  albumArtistIds?: string[];
  contributingArtistIds?: string[];
  albums?: string[];
  albumIds?: string[];
  enableImages?: boolean;
  enableUserData?: boolean;
  fields?: string[];
}

/**
 * Defines the api error contract used across typed Jellyfin boundaries.
 */
export interface ApiError {
  message: string;
  statusCode?: number;
  details?: unknown;
}
