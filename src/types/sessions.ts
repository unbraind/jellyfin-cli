import type { DlnaProfileType, EncodingContext, TranscodeSeekInfo } from './profiles.js';
import type { SubtitleDeliveryMethod } from './profiles.js';

/**
 * Defines the session info contract used across typed Jellyfin boundaries.
 */
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

/**
 * Defines the player state info contract used across typed Jellyfin boundaries.
 */
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

/**
 * Represents the repeat mode values accepted by the typed Jellyfin interface.
 */
export type RepeatMode = 'RepeatNone' | 'RepeatAll' | 'RepeatOne';
/**
 * Represents the playback order values accepted by the typed Jellyfin interface.
 */
export type PlaybackOrder = 'Default' | 'Shuffle';

/**
 * Defines the session user info contract used across typed Jellyfin boundaries.
 */
export interface SessionUserInfo {
  UserId?: string | null;
  UserName?: string | null;
}

/**
 * Defines the client capabilities contract used across typed Jellyfin boundaries.
 */
export interface ClientCapabilities {
  PlayableMediaTypes?: string[] | null;
  SupportedCommands?: string[] | null;
  SupportsMediaControl?: boolean;
  SupportsPersistentIdentifier?: boolean;
  SupportsSync?: boolean;
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
  Type?: DlnaProfileType;
}

/**
 * Defines the transcoding profile contract used across typed Jellyfin boundaries.
 */
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

/**
 * Defines the container profile contract used across typed Jellyfin boundaries.
 */
export interface ContainerProfile {
  Type?: DlnaProfileType;
  Container?: string | null;
  Conditions?: ProfileCondition[] | null;
}

/**
 * Defines the codec profile contract used across typed Jellyfin boundaries.
 */
export interface CodecProfile {
  Type?: CodecType;
  Codec?: string | null;
  Container?: string | null;
  Conditions?: ProfileCondition[] | null;
  ApplyConditions?: ProfileCondition[] | null;
}

/**
 * Represents the codec type values accepted by the typed Jellyfin interface.
 */
export type CodecType = 'Video' | 'VideoAudio' | 'Audio';

/**
 * Defines the profile condition contract used across typed Jellyfin boundaries.
 */
export interface ProfileCondition {
  Condition?: ProfileConditionType;
  Property?: ProfileConditionValue;
  Value?: string | null;
  IsRequired?: boolean;
}

/**
 * Represents the profile condition type values accepted by the typed Jellyfin interface.
 */
export type ProfileConditionType = 'Equals' | 'NotEquals' | 'LessThanEqual' | 'GreaterThanEqual' | 'EqualsAny' | 'Contains' | 'NotContains';
/**
 * Represents the profile condition value values accepted by the typed Jellyfin interface.
 */
export type ProfileConditionValue = 'AudioChannels' | 'AudioBitrate' | 'AudioProfile' | 'Width' | 'Height' | 'Has64BitOffsets' | 'PacketLength' | 'VideoBitrate' | 'VideoProfile' | 'VideoLevel' | 'VideoFramerate' | 'VideoResolution' | 'IsAnamorphic' | 'RefFrames' | 'NumAudioStreams' | 'NumVideoStreams' | 'IsSecondaryAudio' | 'VideoCodecTag' | 'IsAvc' | 'IsInterlaced' | 'AudioSampleRate' | 'AudioBitDepth';

/**
 * Defines the subtitle profile contract used across typed Jellyfin boundaries.
 */
export interface SubtitleProfile {
  Format?: string | null;
  Method?: SubtitleDeliveryMethod;
  DidlMode?: string | null;
  Language?: string | null;
  Container?: string | null;
}

/**
 * Defines the queue item contract used across typed Jellyfin boundaries.
 */
export interface QueueItem {
  Id?: string | null;
  PlaylistItemId?: string | null;
}
import type { BaseItemDto } from './items.js';
