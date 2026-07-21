/**
 * Defines the notification type info contract used across typed Jellyfin boundaries.
 */
export interface NotificationTypeInfo {
  Type?: string | null;
  Name?: string | null;
  Enabled?: boolean;
  Category?: string | null;
}

/**
 * Defines the notification option contract used across typed Jellyfin boundaries.
 */
export interface NotificationOption {
  Type?: string | null;
  Enabled?: boolean;
  SendToUsers?: string | null;
  Title?: string | null;
  Description?: string | null;
}

/**
 * Defines the notification result contract used across typed Jellyfin boundaries.
 */
export interface NotificationResult {
  Notifications?: Notification[] | null;
  TotalRecordCount?: number | null;
}

/**
 * Defines the notification contract used across typed Jellyfin boundaries.
 */
export interface Notification {
  Id?: string | null;
  UserId?: string | null;
  Date?: string | null;
  IsRead?: boolean;
  Name?: string | null;
  Description?: string | null;
  Url?: string | null;
  Level?: NotificationLevel;
}

/**
 * Represents the notification level values accepted by the typed Jellyfin interface.
 */
export type NotificationLevel = 'Normal' | 'Warning' | 'Error';
