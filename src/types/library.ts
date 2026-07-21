/**
 * Defines the library virtual folder contract used across typed Jellyfin boundaries.
 */
export interface LibraryVirtualFolder {
  Name?: string | null;
  Locations?: string[] | null;
  CollectionType?: string | null;
  LibraryOptions?: LibraryOptions;
  ItemId?: string | null;
  PrimaryImageItemId?: string | null;
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

/**
 * Represents the allow embedded subtitles values accepted by the typed Jellyfin interface.
 */
export type AllowEmbeddedSubtitles = 'AllowAll' | 'AllowText' | 'AllowNone' | 'AllowImage';

/**
 * Defines the media path info contract used across typed Jellyfin boundaries.
 */
export interface MediaPathInfo {
  Path?: string | null;
  NetworkPath?: string | null;
}

/**
 * Defines the type options contract used across typed Jellyfin boundaries.
 */
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

/**
 * Defines the image option contract used across typed Jellyfin boundaries.
 */
export interface ImageOption {
  Type?: ImageType | null;
  Limit?: number | null;
  MinWidth?: number | null;
}

/**
 * Represents the image type values accepted by the typed Jellyfin interface.
 */
export type ImageType = 'Primary' | 'Art' | 'Backdrop' | 'Banner' | 'Logo' | 'Thumb' | 'Disc' | 'Box' | 'Screenshot' | 'Menu' | 'Chapter' | 'BoxRear' | 'Profile';
