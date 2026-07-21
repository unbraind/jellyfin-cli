/**
 * Defines the quick connect result contract used across typed Jellyfin boundaries.
 */
export interface QuickConnectResult {
  Secret?: string | null;
  Code?: string | null;
  Authentication?: string | null;
  DeviceId?: string | null;
  DateAdded?: string | null;
}

/**
 * Defines the sync play group contract used across typed Jellyfin boundaries.
 */
export interface SyncPlayGroup {
  GroupId?: string | null;
  PlaylistItemId?: string | null;
  PlayingItemId?: string | null;
  PlayingItemName?: string | null;
  PositionTicks?: number | null;
  IsPaused?: boolean;
  Participants?: SyncPlayParticipant[];
}

/**
 * Defines the sync play participant contract used across typed Jellyfin boundaries.
 */
export interface SyncPlayParticipant {
  UserId?: string | null;
  UserName?: string | null;
  IsInGroup?: boolean;
}

/**
 * Defines the media segment contract used across typed Jellyfin boundaries.
 */
export interface MediaSegment {
  Id?: string | null;
  ItemId?: string | null;
  Type?: string | null;
  StartTicks?: number | null;
  EndTicks?: number | null;
}

/**
 * Defines the lyrics info contract used across typed Jellyfin boundaries.
 */
export interface LyricsInfo {
  Metadata?: LyricsMetadata | null;
  Lyrics?: LyricLine[];
}

/**
 * Defines the lyrics metadata contract used across typed Jellyfin boundaries.
 */
export interface LyricsMetadata {
  Artist?: string | null;
  Album?: string | null;
  Title?: string | null;
  Author?: string | null;
  Length?: number | null;
  By?: string | null;
  Offset?: number | null;
  Creator?: string | null;
  Version?: string | null;
  IsSynced?: boolean;
}

/**
 * Defines the lyric line contract used across typed Jellyfin boundaries.
 */
export interface LyricLine {
  Text?: string | null;
  Start?: number | null;
}

/**
 * Defines the backup info contract used across typed Jellyfin boundaries.
 */
export interface BackupInfo {
  Name?: string | null;
  Path?: string | null;
  Size?: number | null;
  Date?: string | null;
}

/**
 * Defines the display preferences contract used across typed Jellyfin boundaries.
 */
export interface DisplayPreferences {
  Id?: string | null;
  Client?: string | null;
  CustomPrefs?: Record<string, string | null>;
  ScrollDirection?: string | null;
  SortBy?: string | null;
  SortOrder?: string | null;
  ViewType?: string | null;
  IndexBy?: string | null;
  RememberIndexing?: boolean;
  RememberSorting?: boolean;
}

/**
 * Defines the localization option contract used across typed Jellyfin boundaries.
 */
export interface LocalizationOption {
  Name?: string | null;
  Value?: string | null;
}

/**
 * Defines the country info contract used across typed Jellyfin boundaries.
 */
export interface CountryInfo {
  Name?: string | null;
  DisplayName?: string | null;
  ThreeLetterISORegionName?: string | null;
  TwoLetterISORegionName?: string | null;
}

/**
 * Defines the culture dto contract used across typed Jellyfin boundaries.
 */
export interface CultureDto {
  Name?: string | null;
  DisplayName?: string | null;
  ThreeLetterISOLanguageName?: string | null;
  TwoLetterISOLanguageName?: string | null;
  ThreeLetterISORegionName?: string | null;
  TwoLetterISORegionName?: string | null;
}

/**
 * Defines the virtual folder info contract used across typed Jellyfin boundaries.
 */
export interface VirtualFolderInfo {
  Name?: string | null;
  Locations?: string[] | null;
  CollectionType?: string | null;
  LibraryOptions?: LibraryOptions | null;
  ItemId?: string | null;
  PrimaryImageItemId?: string | null;
  RefreshProgress?: number | null;
  RefreshStatus?: string | null;
}

/**
 * Defines the library options contract used across typed Jellyfin boundaries.
 */
export interface LibraryOptions {
  Enabled?: boolean;
  EnablePhotos?: boolean;
  EnableRealtimeMonitor?: boolean;
  EnableLUFSScan?: boolean;
  SaveLocalMetadata?: boolean;
  EnableInternetProviders?: boolean;
  ImportMissingEpisodes?: boolean;
  EnableAutomaticSeriesGrouping?: boolean;
  EnableEmbeddedTitles?: boolean;
  EnableEmbeddedExtrasTitles?: boolean;
  EnableEmbeddedEpisodeInfos?: boolean;
  AutomaticRefreshIntervalDays?: number | null;
  PreferredMetadataLanguage?: string | null;
  MetadataCountryCode?: string | null;
  SeasonZeroDisplayName?: string | null;
  TypeOptions?: TypeOption[] | null;
}

/**
 * Defines the type option contract used across typed Jellyfin boundaries.
 */
export interface TypeOption {
  Type?: string | null;
  ImageFetcherOrder?: string[] | null;
  ImageOptions?: ImageOption[] | null;
  MetadataFetchers?: string[] | null;
  MetadataFetcherOrder?: string[] | null;
}

/**
 * Defines the image option contract used across typed Jellyfin boundaries.
 */
export interface ImageOption {
  Type?: string | null;
  Limit?: number | null;
  MinWidth?: number | null;
  MinHeight?: number | null;
}

/**
 * Defines the query filters contract used across typed Jellyfin boundaries.
 */
export interface QueryFilters {
  Genres?: NameIdPair[] | null;
  Studios?: NameIdPair[] | null;
  Tags?: string[] | null;
  Years?: number[] | null;
  OfficialRatings?: string[] | null;
  Persons?: NameIdPair[] | null;
  HasSubtitles?: boolean;
  HasTrailer?: boolean;
  HasSpecialFeature?: boolean;
  HasThemeSong?: boolean;
  HasThemeVideo?: boolean;
  IsHD?: boolean;
  IsSD?: boolean;
  Is3D?: boolean;
  Is4K?: boolean;
}

/**
 * Defines the name id pair contract used across typed Jellyfin boundaries.
 */
export interface NameIdPair {
  Name?: string | null;
  Id?: string | null;
}

/**
 * Defines the environment info contract used across typed Jellyfin boundaries.
 */
export interface EnvironmentInfo {
  Drives?: DriveInfo[] | null;
  NetworkShares?: NetworkShare[] | null;
}

/**
 * Defines the drive info contract used across typed Jellyfin boundaries.
 */
export interface DriveInfo {
  Name?: string | null;
  Path?: string | null;
}

/**
 * Defines the network share contract used across typed Jellyfin boundaries.
 */
export interface NetworkShare {
  Name?: string | null;
  Path?: string | null;
  Protocol?: string | null;
}

/**
 * Defines the remote image info contract used across typed Jellyfin boundaries.
 */
export interface RemoteImageInfo {
  ProviderName?: string | null;
  Url?: string | null;
  ThumbnailUrl?: string | null;
  Height?: number | null;
  Width?: number | null;
  CommunityRating?: number | null;
  VoteCount?: number | null;
  Language?: string | null;
  Type?: string | null;
  RatingType?: string | null;
}

/**
 * Defines the remote subtitle info contract used across typed Jellyfin boundaries.
 */
export interface RemoteSubtitleInfo {
  Id?: string | null;
  Name?: string | null;
  Format?: string | null;
  Author?: string | null;
  Comment?: string | null;
  DateCreated?: string | null;
  CommunityRating?: number | null;
  DownloadCount?: number | null;
  IsHashMatch?: boolean;
  ProviderName?: string | null;
  ThreeLetterISOLanguageName?: string | null;
}

/**
 * Defines the external id info contract used across typed Jellyfin boundaries.
 */
export interface ExternalIdInfo {
  Name?: string | null;
  Key?: string | null;
  Url?: string | null;
  Type?: string | null;
}

/**
 * Defines the theme media result contract used across typed Jellyfin boundaries.
 */
export interface ThemeMediaResult {
  Items?: ThemeMediaInfo[] | null;
  TotalRecordCount?: number | null;
  OwnerId?: string | null;
}

/**
 * Defines the theme media info contract used across typed Jellyfin boundaries.
 */
export interface ThemeMediaInfo {
  Id?: string | null;
  Name?: string | null;
  Path?: string | null;
  RunTimeTicks?: number | null;
  Type?: string | null;
}

/**
 * Defines the hls playlist info contract used across typed Jellyfin boundaries.
 */
export interface HlsPlaylistInfo {
  Path?: string | null;
  Protocol?: string | null;
  Playlist?: string | null;
}

/**
 * Defines the create user dto contract used across typed Jellyfin boundaries.
 */
export interface CreateUserDto {
  Name?: string | null;
  Password?: string | null;
}

/**
 * Defines the update user password dto contract used across typed Jellyfin boundaries.
 */
export interface UpdateUserPasswordDto {
  CurrentPw?: string | null;
  NewPw?: string | null;
  ResetPassword?: boolean;
}

/**
 * Defines the upload subtitle dto contract used across typed Jellyfin boundaries.
 */
export interface UploadSubtitleDto {
  Language?: string | null;
  Format?: string | null;
  IsForced?: boolean;
  Data?: string | null;
}

/**
 * Defines the create user result contract used across typed Jellyfin boundaries.
 */
export interface CreateUserResult {
  Id?: string | null;
  Name?: string | null;
  ServerId?: string | null;
}

/**
 * Defines the remote search result contract used across typed Jellyfin boundaries.
 */
export interface RemoteSearchResult {
  Name?: string | null;
  ProductionYear?: number | null;
  PremiereDate?: string | null;
  ImageUrl?: string | null;
  SearchProviderName?: string | null;
  Overview?: string | null;
  ProviderIds?: Record<string, string | null>;
}

/**
 * Defines the remote search query contract used across typed Jellyfin boundaries.
 */
export interface RemoteSearchQuery {
  SearchInfo?: {
    Name?: string | null;
    Year?: number | null;
    ProviderIds?: Record<string, string | null>;
    ItemId?: string | null;
  };
  ItemId?: string | null;
  SearchProviderName?: string | null;
  IncludeDisabledProviders?: boolean;
}

/**
 * Defines the user view contract used across typed Jellyfin boundaries.
 */
export interface UserView {
  Id?: string | null;
  Name?: string | null;
  CollectionType?: string | null;
  ImageTags?: Record<string, string | null>;
  ServerId?: string | null;
  Type?: string | null;
  ParentId?: string | null;
}

/**
 * Defines the user view grouping option contract used across typed Jellyfin boundaries.
 */
export interface UserViewGroupingOption {
  Id?: string | null;
  Name?: string | null;
}

/**
 * Defines the utc time response contract used across typed Jellyfin boundaries.
 */
export interface UtcTimeResponse {
  RequestReceptionTime?: string | null;
  ResponseTransmissionTime?: string | null;
}

/**
 * Defines the startup configuration contract used across typed Jellyfin boundaries.
 */
export interface StartupConfiguration {
  UICulture?: string | null;
  MetadataCountryCode?: string | null;
  PreferredMetadataLanguage?: string | null;
}

/**
 * Defines the startup first user contract used across typed Jellyfin boundaries.
 */
export interface StartupFirstUser {
  Name?: string | null;
  Password?: string | null;
  PasswordHint?: string | null;
}
