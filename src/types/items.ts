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
