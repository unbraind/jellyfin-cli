import { ApiClientBase } from './base.js';

/**
 * Defines the dashboard configuration page info contract used across typed Jellyfin boundaries.
 */
export interface DashboardConfigurationPageInfo {
  Name?: string | null;
  PluginId?: string | null;
  EmbeddedResourcePath?: string | null;
  MenuSection?: string | null;
  MenuIcon?: string | null;
  DisplayName?: string | null;
  IsMainConfigPage?: boolean | null;
  EnableInMainMenu?: boolean | null;
}

/**
 * Provides dashboard api behavior for the Jellyfin client and command runtime.
 */
export class DashboardApi extends ApiClientBase {
  /**
   * Retrieves or derives configuration pages without mutating Jellyfin state.
   * @param enableInMainMenu - The enable in main menu value required by this operation.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async getConfigurationPages(enableInMainMenu?: boolean): Promise<DashboardConfigurationPageInfo[]> {
    return this.request<DashboardConfigurationPageInfo[]>(
      'GET',
      '/web/ConfigurationPages',
      enableInMainMenu === undefined ? undefined : { enableInMainMenu },
    );
  }

  /**
   * Retrieves or derives configuration page without mutating Jellyfin state.
   * @param name - The name value required by this operation.
   * @returns - The normalized string representation.
   */
  async getConfigurationPage(name: string): Promise<string> {
    return this.request<string>('GET', '/web/ConfigurationPage', { name });
  }
}
