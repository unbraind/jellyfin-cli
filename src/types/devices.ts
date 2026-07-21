/**
 * Defines the device info contract used across typed Jellyfin boundaries.
 */
export interface DeviceInfo {
  Name?: string | null;
  CustomName?: string | null;
  AccessToken?: string | null;
  Id?: string | null;
  LastUserName?: string | null;
  AppName?: string | null;
  AppVersion?: string | null;
  LastUserId?: string | null;
  DateLastActivity?: string | null;
  Capabilities?: DeviceCapabilities;
  IconUrl?: string | null;
}

/**
 * Defines the device capabilities contract used across typed Jellyfin boundaries.
 */
export interface DeviceCapabilities {
  PlayableMediaTypes?: string[] | null;
  SupportedCommands?: string[] | null;
  SupportsMediaControl?: boolean;
  SupportsContentUploading?: boolean;
  SupportsSync?: boolean;
  SupportsPersistentIdentifier?: boolean;
  SupportsPersistentIdentifierUninstall?: boolean;
  DeviceProfile?: DeviceProfile;
}

/**
 * Defines the device profile contract used across typed Jellyfin boundaries.
 */
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

/**
 * Defines the direct play profile contract used across typed Jellyfin boundaries.
 */
export interface DirectPlayProfile {
  Container?: string | null;
  AudioCodec?: string | null;
  VideoCodec?: string | null;
  Type?: string | null;
}

/**
 * Defines the transcoding profile contract used across typed Jellyfin boundaries.
 */
export interface TranscodingProfile {
  Container?: string | null;
  Type?: string | null;
  VideoCodec?: string | null;
  AudioCodec?: string | null;
  Protocol?: string | null;
}

/**
 * Defines the container profile contract used across typed Jellyfin boundaries.
 */
export interface ContainerProfile {
  Type?: string | null;
  Container?: string | null;
}

/**
 * Defines the codec profile contract used across typed Jellyfin boundaries.
 */
export interface CodecProfile {
  Type?: string | null;
  Codec?: string | null;
  Container?: string | null;
}

/**
 * Defines the subtitle profile contract used across typed Jellyfin boundaries.
 */
export interface SubtitleProfile {
  Format?: string | null;
  Method?: string | null;
}

/**
 * Defines the device options contract used across typed Jellyfin boundaries.
 */
export interface DeviceOptions {
  CustomName?: string | null;
}
