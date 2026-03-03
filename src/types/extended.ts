export interface QuickConnectResult {
  Secret?: string | null;
  Code?: string | null;
  Authentication?: string | null;
  DeviceId?: string | null;
  DateAdded?: string | null;
}

export interface SyncPlayGroup {
  GroupId?: string | null;
  PlaylistItemId?: string | null;
  PlayingItemId?: string | null;
  PlayingItemName?: string | null;
  PositionTicks?: number | null;
  IsPaused?: boolean;
  Participants?: SyncPlayParticipant[];
}

export interface SyncPlayParticipant {
  UserId?: string | null;
  UserName?: string | null;
  IsInGroup?: boolean;
}

export interface MediaSegment {
  Id?: string | null;
  ItemId?: string | null;
  Type?: string | null;
  StartTicks?: number | null;
  EndTicks?: number | null;
}

export interface LyricsInfo {
  Metadata?: LyricsMetadata | null;
  Lyrics?: LyricLine[];
}

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

export interface LyricLine {
  Text?: string | null;
  Start?: number | null;
}

export interface BackupInfo {
  Name?: string | null;
  Path?: string | null;
  Size?: number | null;
  Date?: string | null;
}

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

export interface LocalizationOption {
  Name?: string | null;
  Value?: string | null;
}

export interface CountryInfo {
  Name?: string | null;
  DisplayName?: string | null;
  ThreeLetterISORegionName?: string | null;
  TwoLetterISORegionName?: string | null;
}

export interface CultureDto {
  Name?: string | null;
  DisplayName?: string | null;
  ThreeLetterISOLanguageName?: string | null;
  TwoLetterISOLanguageName?: string | null;
  ThreeLetterISORegionName?: string | null;
  TwoLetterISORegionName?: string | null;
}

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

export interface TypeOption {
  Type?: string | null;
  ImageFetcherOrder?: string[] | null;
  ImageOptions?: ImageOption[] | null;
  MetadataFetchers?: string[] | null;
  MetadataFetcherOrder?: string[] | null;
}

export interface ImageOption {
  Type?: string | null;
  Limit?: number | null;
  MinWidth?: number | null;
  MinHeight?: number | null;
}

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

export interface NameIdPair {
  Name?: string | null;
  Id?: string | null;
}

export interface EnvironmentInfo {
  Drives?: DriveInfo[] | null;
  NetworkShares?: NetworkShare[] | null;
}

export interface DriveInfo {
  Name?: string | null;
  Path?: string | null;
}

export interface NetworkShare {
  Name?: string | null;
  Path?: string | null;
  Protocol?: string | null;
}

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

export interface ExternalIdInfo {
  Name?: string | null;
  Key?: string | null;
  Url?: string | null;
  Type?: string | null;
}

export interface ThemeMediaResult {
  Items?: ThemeMediaInfo[] | null;
  TotalRecordCount?: number | null;
  OwnerId?: string | null;
}

export interface ThemeMediaInfo {
  Id?: string | null;
  Name?: string | null;
  Path?: string | null;
  RunTimeTicks?: number | null;
  Type?: string | null;
}

export interface HlsPlaylistInfo {
  Path?: string | null;
  Protocol?: string | null;
  Playlist?: string | null;
}

export interface CreateUserDto {
  Name?: string | null;
  Password?: string | null;
}

export interface UpdateUserPasswordDto {
  CurrentPw?: string | null;
  NewPw?: string | null;
  ResetPassword?: boolean;
}

export interface UploadSubtitleDto {
  Language?: string | null;
  Format?: string | null;
  IsForced?: boolean;
  Data?: string | null;
}

export interface CreateUserResult {
  Id?: string | null;
  Name?: string | null;
  ServerId?: string | null;
}

export interface RemoteSearchResult {
  Name?: string | null;
  ProductionYear?: number | null;
  PremiereDate?: string | null;
  ImageUrl?: string | null;
  SearchProviderName?: string | null;
  Overview?: string | null;
  ProviderIds?: Record<string, string | null>;
}

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

export interface UserView {
  Id?: string | null;
  Name?: string | null;
  CollectionType?: string | null;
  ImageTags?: Record<string, string | null>;
  ServerId?: string | null;
  Type?: string | null;
  ParentId?: string | null;
}

export interface UserViewGroupingOption {
  Id?: string | null;
  Name?: string | null;
}

export interface UtcTimeResponse {
  RequestReceptionTime?: string | null;
  ResponseTransmissionTime?: string | null;
}

export interface StartupConfiguration {
  UICulture?: string | null;
  MetadataCountryCode?: string | null;
  PreferredMetadataLanguage?: string | null;
}

export interface StartupFirstUser {
  Name?: string | null;
  Password?: string | null;
  PasswordHint?: string | null;
}
