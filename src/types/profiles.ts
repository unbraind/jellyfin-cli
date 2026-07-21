/**
 * Represents the dlna profile type values accepted by the typed Jellyfin interface.
 */
export type DlnaProfileType = 'Audio' | 'Video' | 'Photo';
/**
 * Represents the transcode seek info values accepted by the typed Jellyfin interface.
 */
export type TranscodeSeekInfo = 'Auto' | 'Bytes';
/**
 * Represents the encoding context values accepted by the typed Jellyfin interface.
 */
export type EncodingContext = 'Streaming' | 'Static';
/**
 * Represents the subtitle delivery method values accepted by the typed Jellyfin interface.
 */
export type SubtitleDeliveryMethod = 'Encode' | 'Embed' | 'External' | 'Hls' | 'VideoTrack';
