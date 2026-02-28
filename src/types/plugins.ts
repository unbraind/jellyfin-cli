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

export type PluginStatus = 'Active' | 'Restart' | 'Disabled' | 'Malfunctioned' | 'NotLoaded' | 'Superseded';

export interface PluginStatusInfo {
  Name?: string | null;
  Version?: string | null;
  Status?: PluginStatus;
  StatusMessage?: string | null;
}

export interface RepositoryInfo {
  Name?: string | null;
  Url?: string | null;
  Enabled?: boolean;
}

export interface InstallationInfo {
  Id?: string | null;
  Name?: string | null;
  Version?: string | null;
  Changelog?: string | null;
  SourceUrl?: string | null;
  Guid?: string | null;
  Status?: InstallationStatus;
}

export type InstallationStatus = 'Queued' | 'Installing' | 'Completed' | 'Failed' | 'Cancelled';

export interface PluginInstallationCancelled {
  Id?: string | null;
  Name?: string | null;
}
