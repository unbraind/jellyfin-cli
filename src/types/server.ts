export interface BrandingOptions {
  LoginDisclaimer?: string | null;
  CustomCss?: string | null;
  SplashscreenEnabled?: boolean;
}

export interface ServerConfiguration {
  EnableUPnP?: boolean;
  PublicPort?: number | null;
  PublicHttpsPort?: number | null;
  HttpServerPortNumber?: number | null;
  HttpsPortNumber?: number | null;
  EnableHttps?: boolean;
  EnableNormalizedItemByNameIds?: boolean;
  CertificatePath?: string | null;
  CertificatePassword?: string | null;
  IsPortAuthorized?: boolean;
  AutoRunWebApp?: boolean;
  EnableRemoteAccess?: boolean;
  LogAllQueryTimes?: boolean;
  EnableCaseSensitiveItemIds?: boolean;
  MetadataPath?: string | null;
  MetadataNetworkPath?: string | null;
  PreferredMetadataLanguage?: string | null;
  MetadataCountryCode?: string | null;
  SortRemoveCharacters?: string[] | null;
  SortRemoveWords?: string[] | null;
  LibraryMonitorDelay?: number | null;
  EnableDashboardResponseCaching?: boolean;
  DashboardSourcePath?: string | null;
  ImageSavingConvention?: string | null;
  EnableAutomaticRestart?: boolean;
  ServerName?: string | null;
  WanDdns?: string | null;
  UICulture?: string | null;
  SaveMetadataHidden?: boolean;
  RemoteClientBitrateLimit?: number | null;
  SchemaVersion?: number | null;
  DisplaySpecialsWithinSeasons?: boolean;
  LocalNetworkSubnets?: string[] | null;
  LocalNetworkAddresses?: string[] | null;
  EnableExternalContentInSuggestions?: boolean;
  RequireHttps?: boolean;
  IsBehindProxy?: boolean;
  RemoteIPFilter?: string[] | null;
  IsRemoteIPFilterBlacklist?: boolean;
  ImageExtractionTimeoutMs?: number | null;
  PathSubstitutions?: PathSubstitution[] | null;
  UninstalledPlugins?: string[] | null;
  EnableSlowResponseWarning?: boolean;
  SlowResponseThresholdMs?: number | null;
  CorsHosts?: string[] | null;
  LibraryScanFanoutConcurrency?: number | null;
  LibraryMetadataRefreshConcurrency?: number | null;
  RemoveOldPlugins?: boolean;
  DisablePluginImages?: boolean;
}

export interface PathSubstitution {
  From?: string | null;
  To?: string | null;
}

export interface ServerEndpoints {
  IsLocal?: boolean;
  IsInNetwork?: boolean;
}

export interface ItemCounts {
  MovieCount?: number | null;
  SeriesCount?: number | null;
  EpisodeCount?: number | null;
  ArtistCount?: number | null;
  ProgramCount?: number | null;
  TrailerCount?: number | null;
  SongCount?: number | null;
  AlbumCount?: number | null;
  MusicVideoCount?: number | null;
  BoxSetCount?: number | null;
  BookCount?: number | null;
  ItemCount?: number | null;
}
