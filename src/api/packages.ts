import { ApiClientBase } from './base.js';
import type { InstallationInfo, RepositoryInfo } from '../types/index.js';

/**
 * Defines the package info contract used across typed Jellyfin boundaries.
 */
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

/**
 * Defines the package version info contract used across typed Jellyfin boundaries.
 */
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

/**
 * Provides packages api behavior for the Jellyfin client and command runtime.
 */
export class PackagesApi extends ApiClientBase {
  /**
   * Retrieves or derives packages without mutating Jellyfin state.
   * @returns - The typed get packages result.
   */
  async getPackages(): Promise<PackageInfo[]> {
    return this.request<PackageInfo[]>('GET', '/Packages');
  }

  /**
   * Retrieves or derives package info without mutating Jellyfin state.
   * @param packageId - The package id value required by this operation.
   * @returns - The normalized string representation.
   */
  async getPackageInfo(packageId: string): Promise<PackageInfo> {
    return this.request<PackageInfo>('GET', `/Packages/${packageId}`);
  }

  /**
   * Implements install package for the typed Jellyfin CLI runtime.
   * @param packageId - The package id value required by this operation.
   * @param version - The version value required by this operation.
   * @param repositoryUrl - The repository url value required by this operation.
   */
  async installPackage(packageId: string, version?: string, repositoryUrl?: string): Promise<void> {
    await this.request<void>('POST', `/Packages/Installed/${packageId}`, { version, repositoryUrl });
  }

  /**
   * Performs the cancel package installation operation through the typed Jellyfin API boundary.
   * @param installationId - The installation id value required by this operation.
   */
  async cancelPackageInstallation(installationId: string): Promise<void> {
    await this.request<void>('DELETE', `/Packages/Installing/${installationId}`);
  }

  /**
   * Retrieves or derives repositories without mutating Jellyfin state.
   * @returns - The typed get repositories result.
   */
  async getRepositories(): Promise<RepositoryInfo[]> {
    return this.request<RepositoryInfo[]>('GET', '/Repositories');
  }

  /**
   * Performs the set repositories operation through the typed Jellyfin API boundary.
   * @param repositories - The repositories value required by this operation.
   */
  async setRepositories(repositories: RepositoryInfo[]): Promise<void> {
    await this.request<void>('POST', '/Repositories', undefined, repositories);
  }

  /**
   * Retrieves or derives installing packages without mutating Jellyfin state.
   * @returns - The typed get installing packages result.
   */
  async getInstallingPackages(): Promise<InstallationInfo[]> {
    return this.request<InstallationInfo[]>('GET', '/Packages/Installing');
  }
}
