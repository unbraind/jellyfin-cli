import { ApiClientBase } from './base.js';
import type { InstallationInfo, RepositoryInfo } from '../types/index.js';

export interface PackageInfo {
  name?: string | null;
  description?: string | null;
  overview?: string | null;
  owner?: string | null;
  category?: string | null;
  guid?: string | null;
  imageUrl?: string | null;
  versions?: PackageVersionInfo[];
}

export interface PackageVersionInfo {
  version?: string | null;
  VersionNumber?: string | null;
  changelog?: string | null;
  targetAbi?: string | null;
  sourceUrl?: string | null;
  checksum?: string | null;
  timestamp?: string | null;
  repositoryName?: string | null;
  repositoryUrl?: string | null;
}

export class PackagesApi extends ApiClientBase {
  async getPackages(): Promise<PackageInfo[]> {
    return this.request<PackageInfo[]>('GET', '/Packages');
  }

  async getPackageInfo(packageId: string): Promise<PackageInfo> {
    return this.request<PackageInfo>('GET', `/Packages/${packageId}`);
  }

  async installPackage(packageId: string, version?: string, repositoryUrl?: string): Promise<void> {
    await this.request<void>('POST', `/Packages/Installed/${packageId}`, { version, repositoryUrl });
  }

  async cancelPackageInstallation(installationId: string): Promise<void> {
    await this.request<void>('DELETE', `/Packages/Installing/${installationId}`);
  }

  async getRepositories(): Promise<RepositoryInfo[]> {
    return this.request<RepositoryInfo[]>('GET', '/Repositories');
  }

  async setRepositories(repositories: RepositoryInfo[]): Promise<void> {
    await this.request<void>('POST', '/Repositories', undefined, repositories);
  }

  async getInstallingPackages(): Promise<InstallationInfo[]> {
    return this.request<InstallationInfo[]>('GET', '/Packages/Installing');
  }
}
