import type { DlnaProfileType, EncodingContext, TranscodeSeekInfo } from './profiles.js';
import type { SubtitleDeliveryMethod } from './profiles.js';

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
  NowPlayingItem?: import('./items.js').BaseItemDto;
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

export interface QueueItem {
  Id?: string | null;
  PlaylistItemId?: string | null;
}
