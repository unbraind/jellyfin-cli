export interface JellyfinConfig {
  serverUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  userId?: string;
  timeout?: number;
  outputFormat?: OutputFormat;
}

export type OutputFormat = 'toon' | 'json' | 'table' | 'raw';

export interface UserDto {
  Name?: string | null;
  ServerId?: string | null;
  Id?: string | null;
  PrimaryImageTag?: string | null;
  HasPassword?: boolean;
  HasConfiguredPassword?: boolean;
  HasConfiguredEasyPassword?: boolean;
  EnableAutoLogin?: boolean;
  LastLoginDate?: string | null;
  LastActivityDate?: string | null;
  Configuration?: UserConfiguration;
  Policy?: UserPolicy;
}

export interface UserConfiguration {
  PlayDefaultAudioTrack?: boolean;
  SubtitleLanguagePreference?: string | null;
  DisplayMissingEpisodes?: boolean;
  SubtitleMode?: SubtitlePlaybackMode;
  EnableLocalPassword?: boolean;
  HidePlayedInLatest?: boolean;
  RememberAudioSelections?: boolean;
  RememberSubtitleSelections?: boolean;
  EnableNextEpisodeAutoPlay?: boolean;
}

export interface UserPolicy {
  IsAdministrator?: boolean;
  IsHidden?: boolean;
  IsDisabled?: boolean;
  EnableAllDevices?: boolean;
  EnableAllFolders?: boolean;
  EnableContentDeletion?: boolean;
  EnableRemoteAccess?: boolean;
  EnableLiveTvAccess?: boolean;
  EnableLiveTvManagement?: boolean;
  EnableSyncTranscoding?: boolean;
  EnableMediaConversion?: boolean;
  EnableMediaPlayback?: boolean;
  EnableAudioPlaybackTranscoding?: boolean;
  EnableVideoPlaybackTranscoding?: boolean;
  EnablePlaybackRemuxing?: boolean;
}

export type SubtitlePlaybackMode = 'Default' | 'Always' | 'OnlyForced' | 'None' | 'Smart';

export interface SystemInfo {
  ServerName?: string | null;
  Version?: string | null;
  ProductName?: string | null;
  OperatingSystem?: string | null;
  Id?: string | null;
  LocalAddress?: string | null;
  WanAddress?: string | null;
  HasPendingRestart?: boolean;
  IsShuttingDown?: boolean;
  SupportsLibraryMonitor?: boolean;
  WebSocketPortNumber?: number;
  CompletedInstallations?: InstallationInfo[];
  CanSelfRestart?: boolean;
  CanLaunchWebBrowser?: boolean;
  HasUpdateAvailable?: boolean;
}

export { InstallationInfo } from './plugins.js';
export { PluginInfo, PluginStatus, PluginStatusInfo, RepositoryInfo, InstallationStatus, PluginInstallationCancelled } from './plugins.js';
export { DeviceInfo, DeviceCapabilities, DeviceOptions } from './devices.js';
export { BrandingOptions, ServerConfiguration, ServerEndpoints, ItemCounts } from './server.js';
export { ApiKeyInfo, ApiKeyCreation } from './apikeys.js';
export { NotificationTypeInfo, NotificationOption, NotificationResult, Notification, NotificationLevel } from './notifications.js';

export interface BaseItemDto {
  Name?: string | null;
  ServerId?: string | null;
  Id?: string | null;
  Type?: string | null;
  Container?: string | null;
  IsFolder?: boolean;
  Path?: string | null;
  Overview?: string | null;
  Taglines?: string[] | null;
  Genres?: string[] | null;
  GenreItems?: GenreDto[] | null;
  Studios?: StudioDto[] | null;
  People?: PersonInfo[] | null;
  ProductionYear?: number | null;
  OfficialRating?: string | null;
  CommunityRating?: number | null;
  CriticRating?: number | null;
  RunTimeTicks?: number | null;
  Status?: string | null;
  EndDate?: string | null;
  PremiereDate?: string | null;
  DateCreated?: string | null;
  IndexNumber?: number | null;
  ParentIndexNumber?: number | null;
  IndexNumberEnd?: number | null;
  SeasonId?: string | null;
  SeasonName?: string | null;
  SeriesId?: string | null;
  SeriesName?: string | null;
  SeriesPrimaryImageTag?: string | null;
  SeriesStudio?: string | null;
  MediaType?: string | null;
  CollectionType?: string | null;
  ImageTags?: Record<string, string>;
  BackdropImageTags?: string[] | null;
  ParentBackdropImageTags?: string[] | null;
  ParentBackdropItemId?: string | null;
  ImageBlurHashes?: ImageBlurHashes;
  ChannelId?: string | null;
  ChannelName?: string | null;
  ChannelNumber?: string | null;
  PrimaryImageAspectRatio?: number | null;
  LocationType?: LocationType;
  UserData?: UserItemData;
  PlayAccess?: PlayAccess;
  CanDelete?: boolean;
  CanDownload?: boolean;
  HasSubtitles?: boolean;
  SupportsSync?: boolean;
  ExternalUrls?: ExternalUrl[] | null;
  MediaSources?: MediaSourceInfo[] | null;
  MediaStreams?: MediaStream[] | null;
  PartCount?: number | null;
  AdditionalParts?: BaseItemDto[] | null;
  TrailerCount?: number | null;
  SpecialFeatureCount?: number | null;
  RecursiveItemCount?: number | null;
  ChildCount?: number | null;
  DisplayOrder?: string | null;
  Album?: string | null;
  AlbumId?: string | null;
  AlbumPrimaryImageTag?: string | null;
  AlbumArtist?: string | null;
  AlbumArtists?: NameIdPair[] | null;
  ArtistItems?: NameIdPair[] | null;
  Artists?: string[] | null;
  SongCount?: number | null;
  EpisodeCount?: number | null;
  SeasonCount?: number | null;
  MovieCount?: number | null;
}

export interface UserItemData {
  PlaybackPositionTicks?: number | null;
  PlayCount?: number | null;
  IsFavorite?: boolean;
  Played?: boolean;
  Key?: string | null;
  LastPlayedDate?: string | null;
  UnplayedItemCount?: number | null;
}

export interface ImageBlurHashes {
  Primary?: Record<string, string>;
  Art?: Record<string, string>;
  Backdrop?: Record<string, string>;
  Banner?: Record<string, string>;
  Logo?: Record<string, string>;
  Thumb?: Record<string, string>;
  Disc?: Record<string, string>;
  Box?: Record<string, string>;
  Screenshot?: Record<string, string>;
  Menu?: Record<string, string>;
  Chapter?: Record<string, string>;
  BoxRear?: Record<string, string>;
  Profile?: Record<string, string>;
}

export type LocationType = 'FileSystem' | 'Remote' | 'Virtual' | 'Offline';
export type PlayAccess = 'Full' | 'None' | 'Restricted';

export interface ExternalUrl {
  Name?: string | null;
  Url?: string | null;
}

export interface MediaSourceInfo {
  Id?: string | null;
  Name?: string | null;
  Path?: string | null;
  Protocol?: MediaStreamProtocol;
  Type?: MediaSourceType;
  Container?: string | null;
  Size?: number | null;
  Bitrate?: number | null;
  RunTimeTicks?: number | null;
  MediaStreams?: MediaStream[] | null;
  RequiredHttpHeaders?: Record<string, string>;
  TranscodingUrl?: string | null;
  TranscodingSubProtocol?: string | null;
  TranscodingContainer?: string | null;
  DefaultAudioStreamIndex?: number | null;
  DefaultSubtitleStreamIndex?: number | null;
  SupportsTranscoding?: boolean;
  SupportsDirectPlay?: boolean;
  SupportsDirectStream?: boolean;
  IsRemote?: boolean;
  SupportsProbing?: boolean;
  ReadAtNativeFramerate?: boolean;
}

export interface MediaStream {
  Codec?: string | null;
  CodecTag?: string | null;
  Language?: string | null;
  DisplayTitle?: string | null;
  DisplayLanguage?: string | null;
  Type?: MediaStreamType;
  Index?: number | null;
  IsDefault?: boolean;
  IsForced?: boolean;
  IsExternal?: boolean;
  Height?: number | null;
  Width?: number | null;
  AverageFrameRate?: number | null;
  RealFrameRate?: number | null;
  Profile?: string | null;
  AspectRatio?: string | null;
  Channels?: number | null;
  SampleRate?: number | null;
  BitRate?: number | null;
  BitDepth?: number | null;
  Title?: string | null;
  Path?: string | null;
  PixelFormat?: string | null;
  Level?: number | null;
  IsAnamorphic?: boolean;
  DeliveryMethod?: string | null;
  DeliveryUrl?: string | null;
  SupportsExternalStream?: boolean;
}

export type MediaStreamProtocol = 'Http' | 'Hls' | 'Dash' | 'Rtmp' | 'Rtsp';
export type MediaSourceType = 'Default' | 'Grouping' | 'Placeholder';
export type MediaStreamType = 'Video' | 'Audio' | 'Subtitle' | 'EmbeddedImage' | 'Data' | 'Lyric';

export interface GenreDto {
  Name?: string | null;
  Id?: string | null;
}

export interface StudioDto {
  Name?: string | null;
  Id?: string | null;
}

export interface PersonInfo {
  Name?: string | null;
  Id?: string | null;
  Role?: string | null;
  Type?: string | null;
  PrimaryImageTag?: string | null;
}

export interface NameIdPair {
  Name?: string | null;
  Id?: string | null;
}

export interface SessionInfo {
  PlayState?: PlayerStateInfo;
  AdditionalUsers?: SessionUserInfo[] | null;
  Capabilities?: ClientCapabilities;
  RemoteEndPoint?: string | null;
  PlayableMediaTypes?: string[] | null;
  Id?: string | null;
  UserId?: string | null;
  UserName?: string | null;
  Client?: string | null;
  LastActivityDate?: string | null;
  LastPlaybackCheckIn?: string | null;
  DeviceName?: string | null;
  DeviceId?: string | null;
  ApplicationVersion?: string | null;
  NowPlayingItem?: BaseItemDto;
  NowPlayingQueue?: QueueItem[] | null;
  SupportsRemoteControl?: boolean;
  ServerId?: string | null;
  SupportsMediaControl?: boolean;
  HasCustomDeviceName?: boolean;
  IsActive?: boolean;
}

export interface PlayerStateInfo {
  PositionTicks?: number | null;
  CanSeek?: boolean;
  IsPaused?: boolean;
  IsMuted?: boolean;
  VolumeLevel?: number | null;
  AudioStreamIndex?: number | null;
  SubtitleStreamIndex?: number | null;
  PlayMethod?: string | null;
  RepeatMode?: RepeatMode;
  PlaybackOrder?: PlaybackOrder;
}

export type RepeatMode = 'RepeatNone' | 'RepeatAll' | 'RepeatOne';
export type PlaybackOrder = 'Default' | 'Shuffle';

export interface SessionUserInfo {
  UserId?: string | null;
  UserName?: string | null;
}

export interface ClientCapabilities {
  PlayableMediaTypes?: string[] | null;
  SupportedCommands?: string[] | null;
  SupportsMediaControl?: boolean;
  SupportsPersistentIdentifier?: boolean;
  SupportsSync?: boolean;
  DeviceProfile?: DeviceProfile;
}

export interface DeviceProfile {
  MaxStreamingBitrate?: number | null;
  MaxStaticBitrate?: number | null;
  MusicStreamingTranscodingBitrate?: number | null;
  DirectPlayProfiles?: DirectPlayProfile[] | null;
  TranscodingProfiles?: TranscodingProfile[] | null;
  ContainerProfiles?: ContainerProfile[] | null;
  CodecProfiles?: CodecProfile[] | null;
  SubtitleProfiles?: SubtitleProfile[] | null;
}

export interface DirectPlayProfile {
  Container?: string | null;
  AudioCodec?: string | null;
  VideoCodec?: string | null;
  Type?: DlnaProfileType;
}

export type DlnaProfileType = 'Audio' | 'Video' | 'Photo';

export interface TranscodingProfile {
  Container?: string | null;
  Type?: DlnaProfileType;
  VideoCodec?: string | null;
  AudioCodec?: string | null;
  Protocol?: string | null;
  EstimateContentLength?: boolean;
  EnableMpegtsM2TsMode?: boolean;
  TranscodeSeekInfo?: TranscodeSeekInfo;
  CopyTimestamps?: boolean;
  Context?: EncodingContext;
  EnableSubtitlesInManifest?: boolean;
  MaxAudioChannels?: string | null;
  MinSegments?: number | null;
  SegmentLength?: number | null;
  BreakOnNonKeyFrames?: boolean;
}

export type TranscodeSeekInfo = 'Auto' | 'Bytes';
export type EncodingContext = 'Streaming' | 'Static';

export interface ContainerProfile {
  Type?: DlnaProfileType;
  Container?: string | null;
  Conditions?: ProfileCondition[] | null;
}

export interface CodecProfile {
  Type?: CodecType;
  Codec?: string | null;
  Container?: string | null;
  Conditions?: ProfileCondition[] | null;
  ApplyConditions?: ProfileCondition[] | null;
}

export type CodecType = 'Video' | 'VideoAudio' | 'Audio';

export interface ProfileCondition {
  Condition?: ProfileConditionType;
  Property?: ProfileConditionValue;
  Value?: string | null;
  IsRequired?: boolean;
}

export type ProfileConditionType = 'Equals' | 'NotEquals' | 'LessThanEqual' | 'GreaterThanEqual' | 'EqualsAny' | 'Contains' | 'NotContains';
export type ProfileConditionValue = 'AudioChannels' | 'AudioBitrate' | 'AudioProfile' | 'Width' | 'Height' | 'Has64BitOffsets' | 'PacketLength' | 'VideoBitrate' | 'VideoProfile' | 'VideoLevel' | 'VideoFramerate' | 'VideoResolution' | 'IsAnamorphic' | 'RefFrames' | 'NumAudioStreams' | 'NumVideoStreams' | 'IsSecondaryAudio' | 'VideoCodecTag' | 'IsAvc' | 'IsInterlaced' | 'AudioSampleRate' | 'AudioBitDepth';

export interface SubtitleProfile {
  Format?: string | null;
  Method?: SubtitleDeliveryMethod;
  DidlMode?: string | null;
  Language?: string | null;
  Container?: string | null;
}

export type SubtitleDeliveryMethod = 'Encode' | 'Embed' | 'External' | 'Hls' | 'VideoTrack';

export interface QueueItem {
  Id?: string | null;
  PlaylistItemId?: string | null;
}

export interface LibraryVirtualFolder {
  Name?: string | null;
  Locations?: string[] | null;
  CollectionType?: string | null;
  LibraryOptions?: LibraryOptions;
  ItemId?: string | null;
  PrimaryImageItemId?: string | null;
  RefreshStatus?: string | null;
}

export interface LibraryOptions {
  Enabled?: boolean;
  EnablePhotos?: boolean;
  EnableRealtimeMonitor?: boolean;
  EnableLUFSScan?: boolean;
  EnableChapterImageExtraction?: boolean;
  ExtractChapterImagesDuringLibraryScan?: boolean;
  EnableTrickplayImageExtraction?: boolean;
  ExtractTrickplayImagesDuringLibraryScan?: boolean;
  PathInfos?: MediaPathInfo[] | null;
  SaveLocalMetadata?: boolean;
  EnableInternetProviders?: boolean;
  EnableAutomaticSeriesGrouping?: boolean;
  EnableEmbeddedTitles?: boolean;
  EnableEmbeddedExtrasTitles?: boolean;
  EnableEmbeddedEpisodeInfos?: boolean;
  AutomaticRefreshIntervalDays?: number | null;
  PreferredMetadataLanguage?: string | null;
  MetadataCountryCode?: string | null;
  SeasonZeroDisplayName?: string | null;
  MetadataSavers?: string[] | null;
  DisabledLocalMetadataReaders?: string[] | null;
  LocalMetadataReaderOrder?: string[] | null;
  DisabledSubtitleFetchers?: string[] | null;
  SubtitleFetcherOrder?: string[] | null;
  DisabledMediaSegmentProviders?: string[] | null;
  MediaSegmentProviderOrder?: string[] | null;
  SkipSubtitlesIfEmbeddedSubtitlesPresent?: boolean;
  SkipSubtitlesIfAudioTrackMatches?: boolean;
  SubtitleDownloadLanguages?: string[] | null;
  RequirePerfectSubtitleMatch?: boolean;
  SaveSubtitlesWithMedia?: boolean;
  SaveLyricsWithMedia?: boolean;
  SaveTrickplayWithMedia?: boolean;
  DisabledLyricFetchers?: string[] | null;
  LyricFetcherOrder?: string[] | null;
  PreferNonstandardArtistsTag?: boolean;
  UseCustomTagDelimiters?: boolean;
  CustomTagDelimiters?: string[] | null;
  DelimiterWhitelist?: string[] | null;
  AutomaticallyAddToCollection?: boolean;
  AllowEmbeddedSubtitles?: AllowEmbeddedSubtitles;
  TypeOptions?: TypeOptions[] | null;
}

export type AllowEmbeddedSubtitles = 'AllowAll' | 'AllowText' | 'AllowNone' | 'AllowImage';

export interface MediaPathInfo {
  Path?: string | null;
  NetworkPath?: string | null;
}

export interface TypeOptions {
  Type?: string | null;
  MetadataFetchers?: string[] | null;
  MetadataFetcherOrder?: string[] | null;
  ImageFetchers?: string[] | null;
  ImageFetcherOrder?: string[] | null;
  ImageOptions?: ImageOption[] | null;
  MaxRefreshDays?: number | null;
  EnableInternetProviders?: boolean;
}

export interface ImageOption {
  Type?: ImageType | null;
  Limit?: number | null;
  MinWidth?: number | null;
}

export type ImageType = 'Primary' | 'Art' | 'Backdrop' | 'Banner' | 'Logo' | 'Thumb' | 'Disc' | 'Box' | 'Screenshot' | 'Menu' | 'Chapter' | 'BoxRear' | 'Profile';

export interface ScheduledTaskInfo {
  Name?: string | null;
  State?: TaskState;
  Id?: string | null;
  LastExecutionResult?: TaskResult;
  Triggers?: TaskTriggerInfo[] | null;
  Description?: string | null;
  Category?: string | null;
  IsHidden?: boolean;
  Key?: string | null;
}

export type TaskState = 'Idle' | 'Cancelling' | 'Running';

export interface TaskResult {
  StartTimeUtc?: string | null;
  EndTimeUtc?: string | null;
  Status?: TaskCompletionStatus;
  Name?: string | null;
  Key?: string | null;
  Id?: string | null;
  ErrorMessage?: string | null;
  LongErrorMessage?: string | null;
}

export type TaskCompletionStatus = 'Completed' | 'Failed' | 'Cancelled' | 'Aborted';

export interface TaskTriggerInfo {
  Type?: string | null;
  TimeOfDayTicks?: number | null;
  IntervalTicks?: number | null;
  DayOfWeek?: DayOfWeek | null;
}

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface PlaybackProgressInfo {
  ItemId?: string | null;
  MediaSourceId?: string | null;
  PositionTicks?: number | null;
  IsPaused?: boolean;
  IsMuted?: boolean;
  PlaySessionId?: string | null;
  LiveStreamId?: string | null;
  PlayMethod?: PlayMethod | null;
  AudioStreamIndex?: number | null;
  SubtitleStreamIndex?: number | null;
  VolumeLevel?: number | null;
  EventName?: string | null;
  CanSeek?: boolean;
  PlaybackStartTimeTicks?: number | null;
  BufferAheadMs?: number | null;
}

export type PlayMethod = 'Transcode' | 'DirectStream' | 'DirectPlay';

export interface PlaybackStopInfo {
  ItemId?: string | null;
  MediaSourceId?: string | null;
  PositionTicks?: number | null;
  PlaySessionId?: string | null;
  LiveStreamId?: string | null;
  PlayMethod?: PlayMethod | null;
}

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

export interface SearchResult {
  SearchHints?: SearchHint[] | null;
  TotalRecordCount?: number | null;
}

export interface QueryResult<T> {
  Items?: T[] | null;
  TotalRecordCount?: number | null;
  StartIndex?: number | null;
}

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

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: unknown;
}

export interface ActivityLogEntry {
  Id?: number | null;
  Name?: string | null;
  Overview?: string | null;
  ShortOverview?: string | null;
  Type?: string | null;
  UserId?: string | null;
  Date?: string | null;
  ItemId?: string | null;
  Severity?: LogLevel;
  ItemName?: string | null;
}

export type LogLevel = 'Trace' | 'Debug' | 'Information' | 'Warning' | 'Error' | 'Critical' | 'None';

export interface ActivityLogQueryResult {
  Items?: ActivityLogEntry[] | null;
  TotalRecordCount?: number | null;
}

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
  Items?: BaseItemDto[] | null;
  RecommendationType?: RecommendationType;
}

export type RecommendationType = 'SimilarToRecentlyPlayed' | 'SimilarToLiked' | 'HasDirectorFromRecentlyPlayed' | 'HasActorFromRecentlyPlayed' | 'HasLikedDirector' | 'HasLikedActor';

export interface SimilarItemResult {
  Items?: BaseItemDto[] | null;
  TotalRecordCount?: number | null;
}
