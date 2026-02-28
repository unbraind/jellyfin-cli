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
  Type?: string | null;
}

export interface TranscodingProfile {
  Container?: string | null;
  Type?: string | null;
  VideoCodec?: string | null;
  AudioCodec?: string | null;
  Protocol?: string | null;
}

export interface ContainerProfile {
  Type?: string | null;
  Container?: string | null;
}

export interface CodecProfile {
  Type?: string | null;
  Codec?: string | null;
  Container?: string | null;
}

export interface SubtitleProfile {
  Format?: string | null;
  Method?: string | null;
}

export interface DeviceOptions {
  CustomName?: string | null;
}
