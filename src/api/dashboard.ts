import { ApiClientBase } from './base.js';

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

export class DashboardApi extends ApiClientBase {
  async getConfigurationPages(enableInMainMenu?: boolean): Promise<DashboardConfigurationPageInfo[]> {
    return this.request<DashboardConfigurationPageInfo[]>(
      'GET',
      '/web/ConfigurationPages',
      enableInMainMenu === undefined ? undefined : { enableInMainMenu },
    );
  }

  async getConfigurationPage(name: string): Promise<string> {
    return this.request<string>('GET', '/web/ConfigurationPage', { name });
  }
}
