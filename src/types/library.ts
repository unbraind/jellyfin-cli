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
