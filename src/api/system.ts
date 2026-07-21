import { ApiClientBase } from './base.js';
import type {
  LocalizationOption,
  CountryInfo,
  CultureDto,
  BackupInfo,
} from '../types/index.js';

/**
 * Provides system api behavior for the Jellyfin client and command runtime.
 */
export class SystemApi extends ApiClientBase {
  /**
   * Retrieves or derives system storage info without mutating Jellyfin state.
   * @returns - The typed get system storage info result.
   */
  async getSystemStorageInfo(): Promise<{ DataPaths?: string[]; CachePath?: string; InternalMetadataPath?: string; LogPath?: string; TranscodingTempPath?: string }> {
    return this.request<{ DataPaths?: string[]; CachePath?: string; InternalMetadataPath?: string; LogPath?: string; TranscodingTempPath?: string }>('GET', '/System/Info/Storage');
  }

  /**
   * Retrieves or derives system logs without mutating Jellyfin state.
   * @returns - The typed get system logs result.
   */
  async getSystemLogs(): Promise<{ Name?: string; DateCreated?: string; Size?: number }[]> {
    return this.request<{ Name?: string; DateCreated?: string; Size?: number }[]>('GET', '/System/Logs');
  }

  /**
   * Retrieves or derives system log file without mutating Jellyfin state.
   * @param name - The name value required by this operation.
   * @returns - The normalized string representation.
   */
  async getSystemLogFile(name: string): Promise<string> {
    const response = await fetch(`${this.getBackendUrl()}/System/Logs/Log?name=${encodeURIComponent(name)}`, {
      headers: { 'X-Emby-Token': this.apiKey ?? '' },
    });
    if (!response.ok) {
      throw new Error(`Failed to get log file: ${response.status}`);
    }
    return response.text();
  }

  /**
   * Implements ping system for the typed Jellyfin CLI runtime.
   * @returns - The normalized string representation.
   */
  async pingSystem(): Promise<string> {
    return this.request<string>('GET', '/System/Ping');
  }

  /**
   * Retrieves or derives localization options without mutating Jellyfin state.
   * @returns - The typed get localization options result.
   */
  async getLocalizationOptions(): Promise<LocalizationOption[]> {
    return this.request<LocalizationOption[]>('GET', '/Localization/Options');
  }

  /**
   * Retrieves or derives countries without mutating Jellyfin state.
   * @returns - The typed get countries result.
   */
  async getCountries(): Promise<CountryInfo[]> {
    return this.request<CountryInfo[]>('GET', '/Localization/Countries');
  }

  /**
   * Retrieves or derives cultures without mutating Jellyfin state.
   * @returns - The typed get cultures result.
   */
  async getCultures(): Promise<CultureDto[]> {
    return this.request<CultureDto[]>('GET', '/Localization/Cultures');
  }

  /**
   * Retrieves or derives parental ratings without mutating Jellyfin state.
   * @returns - The typed get parental ratings result.
   */
  async getParentalRatings(): Promise<{ Name?: string; Value?: number }[]> {
    return this.request<{ Name?: string; Value?: number }[]>('GET', '/Localization/ParentalRatings');
  }

  /**
   * Retrieves or derives rating systems without mutating Jellyfin state.
   * @returns - The typed get rating systems result.
   */
  async getRatingSystems(): Promise<{ Name?: string; CountryCode?: string }[]> {
    return this.request<{ Name?: string; CountryCode?: string }[]>('GET', '/Localization/RatingSystems');
  }

  /**
   * Retrieves or derives ratings without mutating Jellyfin state.
   * @param countryCode - The country code value required by this operation.
   * @returns - The normalized string representation.
   */
  async getRatings(countryCode: string): Promise<{ Name?: string; Value?: number }[]> {
    return this.request<{ Name?: string; Value?: number }[]>('GET', '/Localization/Ratings', { countryCode });
  }

  /**
   * Retrieves or derives network shares without mutating Jellyfin state.
   * @returns - The typed get network shares result.
   */
  async getNetworkShares(): Promise<{ Name?: string; Path?: string }[]> {
    return this.request<{ Name?: string; Path?: string }[]>('GET', '/Environment/NetworkShares');
  }

  /**
   * Retrieves or derives drives without mutating Jellyfin state.
   * @returns - The typed get drives result.
   */
  async getDrives(): Promise<{ Name?: string; Path?: string }[]> {
    return this.request<{ Name?: string; Path?: string }[]>('GET', '/Environment/Drives');
  }

  /**
   * Retrieves or derives directory contents without mutating Jellyfin state.
   * @param path - The API, command, or filesystem path to process.
   * @returns - The normalized string representation.
   */
  async getDirectoryContents(path: string): Promise<{ Name?: string; Path?: string; Type?: string }[]> {
    return this.request<{ Name?: string; Path?: string; Type?: string }[]>('GET', '/Environment/DirectoryContents', { path });
  }

  /**
   * Retrieves or derives parent path without mutating Jellyfin state.
   * @param path - The API, command, or filesystem path to process.
   * @returns - The normalized string representation.
   */
  async getParentPath(path: string): Promise<{ Path?: string }> {
    return this.request<{ Path?: string }>('GET', '/Environment/ParentPath', { path });
  }

  /**
   * Produces the validated validate path result used by CLI automation.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.path - The API, command, or filesystem path to process.
   * @param params.validateWriteable - The validate writeable value required by this operation.
   * @param params.isFile - The is file value required by this operation.
   * @returns - The typed validate path result.
   */
  async validatePath(params?: { path?: string; validateWriteable?: boolean; isFile?: boolean }): Promise<{ IsValid?: boolean }> {
    return this.request<{ IsValid?: boolean }>('GET', '/Environment/ValidatePath', params as Record<string, unknown>);
  }

  /**
   * Retrieves or derives backups without mutating Jellyfin state.
   * @returns - The typed get backups result.
   */
  async getBackups(): Promise<BackupInfo[]> {
    return this.request<BackupInfo[]>('GET', '/Backup');
  }

  /**
   * Performs the create backup operation through the typed Jellyfin API boundary.
   */
  async createBackup(): Promise<void> {
    await this.request<void>('POST', '/Backup');
  }

  /**
   * Implements restore backup for the typed Jellyfin CLI runtime.
   * @param backupPath - The backup path value required by this operation.
   */
  async restoreBackup(backupPath: string): Promise<void> {
    await this.request<void>('POST', `/Backup/${encodeURIComponent(backupPath)}`);
  }

  /**
   * Performs the delete backup operation through the typed Jellyfin API boundary.
   * @param backupPath - The backup path value required by this operation.
   */
  async deleteBackup(backupPath: string): Promise<void> {
    await this.request<void>('DELETE', `/Backup/${encodeURIComponent(backupPath)}`);
  }

  /**
   * Performs the upload client log operation through the typed Jellyfin API boundary.
   * @param params - Optional request parameters forwarded to the Jellyfin endpoint.
   * @param params.DeviceId - The device id value required by this operation.
   * @param params.AppName - The app name value required by this operation.
   * @param params.AppVersion - The app version value required by this operation.
   * @returns - The typed upload client log result.
   */
  async uploadClientLog(params?: { DeviceId?: string; AppName?: string; AppVersion?: string }): Promise<void> {
    await this.request<void>('POST', '/ClientLog/Document', params as Record<string, unknown>);
  }

  /**
   * Retrieves or derives startup info without mutating Jellyfin state.
   * @returns - The typed get startup info result.
   */
  async getStartupInfo(): Promise<{ UICulture?: string; MetadataCountryCode?: string; PreferredMetadataLanguage?: string }> {
    return this.request<{ UICulture?: string; MetadataCountryCode?: string; PreferredMetadataLanguage?: string }>('GET', '/Startup/Configuration');
  }

  /**
   * Performs the set startup info operation through the typed Jellyfin API boundary.
   * @param info - The info value required by this operation.
   * @param info.UICulture - The uiculture value required by this operation.
   * @param info.MetadataCountryCode - The metadata country code value required by this operation.
   * @param info.PreferredMetadataLanguage - The preferred metadata language value required by this operation.
   * @returns - The typed set startup info result.
   */
  async setStartupInfo(info: { UICulture?: string; MetadataCountryCode?: string; PreferredMetadataLanguage?: string }): Promise<void> {
    await this.request<void>('POST', '/Startup/Configuration', undefined, info);
  }

  /**
   * Retrieves or derives startup remote access without mutating Jellyfin state.
   * @returns - The typed get startup remote access result.
   */
  async getStartupRemoteAccess(): Promise<{ EnableRemoteAccess?: boolean; EnableAutomaticPortMapping?: boolean }> {
    return this.request<{ EnableRemoteAccess?: boolean; EnableAutomaticPortMapping?: boolean }>('GET', '/Startup/RemoteAccess');
  }

  /**
   * Performs the set startup remote access operation through the typed Jellyfin API boundary.
   * @param settings - The settings value required by this operation.
   * @param settings.EnableRemoteAccess - The enable remote access value required by this operation.
   * @param settings.EnableAutomaticPortMapping - The enable automatic port mapping value required by this operation.
   * @returns - The typed set startup remote access result.
   */
  async setStartupRemoteAccess(settings: { EnableRemoteAccess?: boolean; EnableAutomaticPortMapping?: boolean }): Promise<void> {
    await this.request<void>('POST', '/Startup/RemoteAccess', undefined, settings);
  }

  /**
   * Produces the validated is startup complete result used by CLI automation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async isStartupComplete(): Promise<boolean> {
    return this.request<boolean>('GET', '/Startup/Complete');
  }

  /**
   * Implements complete startup for the typed Jellyfin CLI runtime.
   */
  async completeStartup(): Promise<void> {
    await this.request<void>('POST', '/Startup/Complete');
  }
}
