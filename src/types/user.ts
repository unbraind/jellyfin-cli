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

export type SubtitlePlaybackMode = 'Default' | 'Always' | 'OnlyForced' | 'None' | 'Smart';
