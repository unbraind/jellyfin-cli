/**
 * Defines the playback progress info contract used across typed Jellyfin boundaries.
 */
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

/**
 * Represents the play method values accepted by the typed Jellyfin interface.
 */
export type PlayMethod = 'Transcode' | 'DirectStream' | 'DirectPlay';

/**
 * Defines the playback stop info contract used across typed Jellyfin boundaries.
 */
export interface PlaybackStopInfo {
  ItemId?: string | null;
  MediaSourceId?: string | null;
  PositionTicks?: number | null;
  PlaySessionId?: string | null;
  LiveStreamId?: string | null;
  PlayMethod?: PlayMethod | null;
}
