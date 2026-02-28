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

export type PlayMethod = 'Transcode' | 'DirectStream' | 'DirectPlay';

export interface PlaybackStopInfo {
  ItemId?: string | null;
  MediaSourceId?: string | null;
  PositionTicks?: number | null;
  PlaySessionId?: string | null;
  LiveStreamId?: string | null;
  PlayMethod?: PlayMethod | null;
}
