/**
 * Defines the api key info contract used across typed Jellyfin boundaries.
 */
export interface ApiKeyInfo {
  Id?: number | null;
  AccessToken?: string | null;
  DeviceId?: string | null;
  AppName?: string | null;
  AppVersion?: string | null;
  DeviceName?: string | null;
  UserId?: string | null;
  IsActive?: boolean | null;
  DateCreated?: string | null;
  DateLastActivity?: string | null;
}

/**
 * Defines the api key creation contract used across typed Jellyfin boundaries.
 */
export interface ApiKeyCreation {
  Name?: string | null;
  AppName?: string | null;
  AppVersion?: string | null;
}
