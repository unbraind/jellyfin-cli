export interface ApiKeyInfo {
  Name?: string | null;
  AccessToken?: string | null;
  DateCreated?: string | null;
  DateLastActivity?: string | null;
  AppName?: string | null;
  AppVersion?: string | null;
}

export interface ApiKeyCreation {
  Name?: string | null;
  AppName?: string | null;
  AppVersion?: string | null;
}
