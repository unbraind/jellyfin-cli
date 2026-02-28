import { ApiClientBase } from './base.js';
import type {
  LocalizationOption,
  CountryInfo,
  CultureDto,
  EnvironmentInfo,
  BackupInfo,
} from '../types/index.js';

export class SystemApi extends ApiClientBase {
  async getSystemStorageInfo(): Promise<{ DataPaths?: string[]; CachePath?: string; InternalMetadataPath?: string; LogPath?: string; TranscodingTempPath?: string }> {
    return this.request<{ DataPaths?: string[]; CachePath?: string; InternalMetadataPath?: string; LogPath?: string; TranscodingTempPath?: string }>('GET', '/System/Info/Storage');
  }

  async getSystemLogs(): Promise<{ Name?: string; DateCreated?: string; Size?: number }[]> {
    return this.request<{ Name?: string; DateCreated?: string; Size?: number }[]>('GET', '/System/Logs');
  }

  async getSystemLogFile(name: string): Promise<string> {
    const response = await fetch(`${this.getBackendUrl()}/System/Logs/Log?name=${encodeURIComponent(name)}`, {
      headers: { 'X-Emby-Token': this.apiKey ?? '' },
    });
    if (!response.ok) {
      throw new Error(`Failed to get log file: ${response.status}`);
    }
    return response.text();
  }

  async pingSystem(): Promise<string> {
    return this.request<string>('GET', '/System/Ping');
  }

  async getLocalizationOptions(): Promise<LocalizationOption[]> {
    return this.request<LocalizationOption[]>('GET', '/Localization/Options');
  }

  async getCountries(): Promise<CountryInfo[]> {
    return this.request<CountryInfo[]>('GET', '/Localization/Countries');
  }

  async getCultures(): Promise<CultureDto[]> {
    return this.request<CultureDto[]>('GET', '/Localization/Cultures');
  }

  async getParentalRatings(): Promise<{ Name?: string; Value?: number }[]> {
    return this.request<{ Name?: string; Value?: number }[]>('GET', '/Localization/ParentalRatings');
  }

  async getRatingSystems(): Promise<{ Name?: string; CountryCode?: string }[]> {
    return this.request<{ Name?: string; CountryCode?: string }[]>('GET', '/Localization/RatingSystems');
  }

  async getRatings(countryCode: string): Promise<{ Name?: string; Value?: number }[]> {
    return this.request<{ Name?: string; Value?: number }[]>('GET', '/Localization/Ratings', { countryCode });
  }

  async getNetworkShares(): Promise<{ Name?: string; Path?: string }[]> {
    return this.request<{ Name?: string; Path?: string }[]>('GET', '/Environment/NetworkShares');
  }

  async getDrives(): Promise<{ Name?: string; Path?: string }[]> {
    return this.request<{ Name?: string; Path?: string }[]>('GET', '/Environment/Drives');
  }

  async getDirectoryContents(path: string): Promise<{ Name?: string; Path?: string; Type?: string }[]> {
    return this.request<{ Name?: string; Path?: string; Type?: string }[]>('GET', '/Environment/DirectoryContents', { path });
  }

  async getParentPath(path: string): Promise<{ Path?: string }> {
    return this.request<{ Path?: string }>('GET', '/Environment/ParentPath', { path });
  }

  async validatePath(params?: { path?: string; validateWriteable?: boolean; isFile?: boolean }): Promise<{ IsValid?: boolean }> {
    return this.request<{ IsValid?: boolean }>('GET', '/Environment/ValidatePath', params as Record<string, unknown>);
  }

  async getBackups(): Promise<BackupInfo[]> {
    return this.request<BackupInfo[]>('GET', '/Backup');
  }

  async createBackup(): Promise<void> {
    await this.request<void>('POST', '/Backup');
  }

  async restoreBackup(backupPath: string): Promise<void> {
    await this.request<void>('POST', `/Backup/${encodeURIComponent(backupPath)}`);
  }

  async deleteBackup(backupPath: string): Promise<void> {
    await this.request<void>('DELETE', `/Backup/${encodeURIComponent(backupPath)}`);
  }

  async uploadClientLog(params?: { DeviceId?: string; AppName?: string; AppVersion?: string }): Promise<void> {
    await this.request<void>('POST', '/ClientLog/Document', params as Record<string, unknown>);
  }

  async getStartupInfo(): Promise<{ UICulture?: string; MetadataCountryCode?: string; PreferredMetadataLanguage?: string }> {
    return this.request<{ UICulture?: string; MetadataCountryCode?: string; PreferredMetadataLanguage?: string }>('GET', '/Startup/Configuration');
  }

  async setStartupInfo(info: { UICulture?: string; MetadataCountryCode?: string; PreferredMetadataLanguage?: string }): Promise<void> {
    await this.request<void>('POST', '/Startup/Configuration', undefined, info);
  }

  async getStartupRemoteAccess(): Promise<{ EnableRemoteAccess?: boolean; EnableAutomaticPortMapping?: boolean }> {
    return this.request<{ EnableRemoteAccess?: boolean; EnableAutomaticPortMapping?: boolean }>('GET', '/Startup/RemoteAccess');
  }

  async setStartupRemoteAccess(settings: { EnableRemoteAccess?: boolean; EnableAutomaticPortMapping?: boolean }): Promise<void> {
    await this.request<void>('POST', '/Startup/RemoteAccess', undefined, settings);
  }

  async isStartupComplete(): Promise<boolean> {
    return this.request<boolean>('GET', '/Startup/Complete');
  }

  async completeStartup(): Promise<void> {
    await this.request<void>('POST', '/Startup/Complete');
  }
}
