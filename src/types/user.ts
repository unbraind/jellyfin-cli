/**
 * Defines the user dto contract used across typed Jellyfin boundaries.
 */
export interface UserDto {
  Name?: string | null;
  ServerId?: string | null;
  Id?: string | null;
  PrimaryImageTag?: string | null;
  HasPassword?: boolean;
  HasConfiguredPassword?: boolean;
  HasConfiguredEasyPassword?: boolean;
  EnableAutoLogin?: boolean;
  LastLoginDate?: string | null;
  LastActivityDate?: string | null;
  Configuration?: UserConfiguration;
  Policy?: UserPolicy;
}

/**
 * Response returned by Jellyfin after username/password authentication.
 * The access token authorizes subsequent requests while `User` identifies the
 * authenticated account. All fields are nullable in Jellyfin's OpenAPI schema.
 */
export interface AuthenticationResult {
  User?: UserDto | null;
  SessionInfo?: SessionInfo | null;
  AccessToken?: string | null;
  ServerId?: string | null;
}

/**
 * Defines the user configuration contract used across typed Jellyfin boundaries.
 */
export interface UserConfiguration {
  PlayDefaultAudioTrack?: boolean;
  SubtitleLanguagePreference?: string | null;
  DisplayMissingEpisodes?: boolean;
  SubtitleMode?: SubtitlePlaybackMode;
  EnableLocalPassword?: boolean;
  HidePlayedInLatest?: boolean;
  RememberAudioSelections?: boolean;
  RememberSubtitleSelections?: boolean;
  EnableNextEpisodeAutoPlay?: boolean;
}

/**
 * Defines the user policy contract used across typed Jellyfin boundaries.
 */
export interface UserPolicy {
  IsAdministrator?: boolean;
  IsHidden?: boolean;
  IsDisabled?: boolean;
  EnableAllDevices?: boolean;
  EnableAllFolders?: boolean;
  EnableContentDeletion?: boolean;
  EnableRemoteAccess?: boolean;
  EnableLiveTvAccess?: boolean;
  EnableLiveTvManagement?: boolean;
  EnableSyncTranscoding?: boolean;
  EnableMediaConversion?: boolean;
  EnableMediaPlayback?: boolean;
  EnableAudioPlaybackTranscoding?: boolean;
  EnableVideoPlaybackTranscoding?: boolean;
  EnablePlaybackRemuxing?: boolean;
}

/**
 * Represents the subtitle playback mode values accepted by the typed Jellyfin interface.
 */
export type SubtitlePlaybackMode = 'Default' | 'Always' | 'OnlyForced' | 'None' | 'Smart';
import type { SessionInfo } from './sessions.js';
