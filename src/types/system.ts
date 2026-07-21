/**
 * Defines the system info contract used across typed Jellyfin boundaries.
 */
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
 * Defines the activity log entry contract used across typed Jellyfin boundaries.
 */
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

/**
 * Represents the log level values accepted by the typed Jellyfin interface.
 */
export type LogLevel = 'Trace' | 'Debug' | 'Information' | 'Warning' | 'Error' | 'Critical' | 'None';

/**
 * Defines the activity log query result contract used across typed Jellyfin boundaries.
 */
export interface ActivityLogQueryResult {
  Items?: ActivityLogEntry[] | null;
  TotalRecordCount?: number | null;
}
