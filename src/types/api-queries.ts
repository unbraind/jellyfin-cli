/** Query parameters for the Jellyfin item-to-collection lookup. */
export interface ItemCollectionsQueryParams {
  userId?: string;
  startIndex?: number;
  limit?: number;
  fields?: string[];
}

/** Server-side person filters shared by current Jellyfin contracts. */
export interface PersonsQueryParams {
  parentId?: string;
  userId?: string;
  startIndex?: number;
  limit?: number;
  searchTerm?: string;
  nameStartsWith?: string;
  nameLessThan?: string;
  nameStartsWithOrGreater?: string;
}

/** Trailer query controls, including Jellyfin 12 language filtering. */
export interface TrailersQueryParams {
  userId?: string;
  limit?: number;
  startIndex?: number;
  sortBy?: ItemSortField[];
  sortOrder?: SortOrder[];
  audioLanguages?: string[];
  subtitleLanguages?: string[];
}

/** Item sort fields published by the Jellyfin 12 contract. */
export const ITEM_SORT_FIELDS = [
  'Default', 'AiredEpisodeOrder', 'Album', 'AlbumArtist', 'Artist', 'DateCreated',
  'OfficialRating', 'DatePlayed', 'PremiereDate', 'StartDate', 'SortName', 'Name',
  'Random', 'Runtime', 'CommunityRating', 'ProductionYear', 'PlayCount', 'CriticRating',
  'IsFolder', 'IsUnplayed', 'IsPlayed', 'SeriesSortName', 'VideoBitRate', 'AirTime',
  'Studio', 'IsFavoriteOrLiked', 'DateLastContentAdded', 'SeriesDatePlayed',
  'ParentIndexNumber', 'IndexNumber',
] as const;

/** Item sort field accepted by query endpoints. */
export type ItemSortField = typeof ITEM_SORT_FIELDS[number];

/** Sort directions published by current Jellyfin contracts. */
export const SORT_ORDERS = ['Ascending', 'Descending'] as const;

/** Sort direction accepted by query endpoints. */
export type SortOrder = typeof SORT_ORDERS[number];

/** Activity log sort fields published by Jellyfin 12. */
export const ACTIVITY_LOG_SORT_FIELDS = [
  'Name', 'Overiew', 'ShortOverview', 'Type', 'DateCreated', 'Username', 'LogSeverity',
] as const;

/** Activity log sort field accepted by Jellyfin 12. */
export type ActivityLogSortField = typeof ACTIVITY_LOG_SORT_FIELDS[number];

/** Log levels published by the Jellyfin activity-log contract. */
export const ACTIVITY_LOG_SEVERITIES = [
  'Trace', 'Debug', 'Information', 'Warning', 'Error', 'Critical', 'None',
] as const;

/** Log level accepted by the Jellyfin activity-log filter. */
export type ActivityLogSeverity = typeof ACTIVITY_LOG_SEVERITIES[number];

/** Activity-log query controls available in Jellyfin 12. */
export interface ActivityLogQueryParams {
  startIndex?: number;
  limit?: number;
  minDate?: string;
  maxDate?: string;
  hasUserId?: boolean;
  name?: string;
  overview?: string;
  shortOverview?: string;
  type?: string;
  itemId?: string;
  username?: string;
  severity?: ActivityLogSeverity;
  sortBy?: ActivityLogSortField[];
  sortOrder?: SortOrder[];
}
