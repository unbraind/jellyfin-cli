export interface SystemInfo {
  ServerName?: string | null;
  Version?: string | null;
  ProductName?: string | null;
  OperatingSystem?: string | null;
  Id?: string | null;
  LocalAddress?: string | null;
  WanAddress?: string | null;
  HasPendingRestart?: boolean;
  IsShuttingDown?: boolean;
  SupportsLibraryMonitor?: boolean;
  WebSocketPortNumber?: number;
  CompletedInstallations?: InstallationInfo[];
  CanSelfRestart?: boolean;
  CanLaunchWebBrowser?: boolean;
  HasUpdateAvailable?: boolean;
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

export interface ActivityLogEntry {
  Id?: number | null;
  Name?: string | null;
  Overview?: string | null;
  ShortOverview?: string | null;
  Type?: string | null;
  UserId?: string | null;
  Date?: string | null;
  ItemId?: string | null;
  Severity?: LogLevel;
  ItemName?: string | null;
}

export type LogLevel = 'Trace' | 'Debug' | 'Information' | 'Warning' | 'Error' | 'Critical' | 'None';

export interface ActivityLogQueryResult {
  Items?: ActivityLogEntry[] | null;
  TotalRecordCount?: number | null;
}
