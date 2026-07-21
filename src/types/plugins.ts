/**
 * Defines the plugin info contract used across typed Jellyfin boundaries.
 */
export interface PluginInfo {
  Name?: string | null;
  Version?: string | null;
  ConfigurationFileName?: string | null;
  Description?: string | null;
  Id?: string | null;
  CanUninstall?: boolean;
  HasImage?: boolean;
  Status?: PluginStatus;
  AssemblyFilePath?: string | null;
  DataFolderPath?: string | null;
}

/**
 * Represents the plugin status values accepted by the typed Jellyfin interface.
 */
export type PluginStatus = 'Active' | 'Restart' | 'Disabled' | 'Malfunctioned' | 'NotLoaded' | 'Superseded';

/**
 * Defines the plugin status info contract used across typed Jellyfin boundaries.
 */
export interface PluginStatusInfo {
  Name?: string | null;
  Version?: string | null;
  Status?: PluginStatus;
  StatusMessage?: string | null;
}

/**
 * Defines the repository info contract used across typed Jellyfin boundaries.
 */
export interface RepositoryInfo {
  Name?: string | null;
  Url?: string | null;
  Enabled?: boolean;
}

/**
 * Defines the installation info contract used across typed Jellyfin boundaries.
 */
export interface InstallationInfo {
  Id?: string | null;
  Name?: string | null;
  Version?: string | null;
  Changelog?: string | null;
  SourceUrl?: string | null;
  Guid?: string | null;
  Status?: InstallationStatus;
}

/**
 * Represents the installation status values accepted by the typed Jellyfin interface.
 */
export type InstallationStatus = 'Queued' | 'Installing' | 'Completed' | 'Failed' | 'Cancelled';

/**
 * Defines the plugin installation cancelled contract used across typed Jellyfin boundaries.
 */
export interface PluginInstallationCancelled {
  Id?: string | null;
  Name?: string | null;
}
