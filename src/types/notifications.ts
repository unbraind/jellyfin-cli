export interface NotificationTypeInfo {
  Type?: string | null;
  Name?: string | null;
  Enabled?: boolean;
  Category?: string | null;
}

export interface NotificationOption {
  Type?: string | null;
  Enabled?: boolean;
  SendToUsers?: string | null;
  Title?: string | null;
  Description?: string | null;
}

export interface NotificationResult {
  Notifications?: Notification[] | null;
  TotalRecordCount?: number | null;
}

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

export type NotificationLevel = 'Normal' | 'Warning' | 'Error';
