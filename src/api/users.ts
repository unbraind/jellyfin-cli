import { ApiClientBase } from './base.js';
import type {
  UserDto,
  UserPolicy,
  UserConfiguration,
  CreateUserDto,
  UpdateUserPasswordDto,
  CreateUserResult,
  QuickConnectResult,
  DisplayPreferences,
} from '../types/index.js';

/**
 * Provides users api behavior for the Jellyfin client and command runtime.
 */
export class UsersApi extends ApiClientBase {
  /**
   * Performs the create user operation through the typed Jellyfin API boundary.
   * @param user - The user value required by this operation.
   * @returns - The typed create user result.
   */
  async createUser(user: CreateUserDto): Promise<CreateUserResult> {
    return this.request<CreateUserResult>('POST', '/Users/New', undefined, user);
  }

  /**
   * Performs the update user operation through the typed Jellyfin API boundary.
   * @param userId - The stable Jellyfin user identifier.
   * @param user - The user value required by this operation.
   */
  async updateUser(userId: string, user: Partial<UserDto>): Promise<void> {
    await this.request<void>('POST', `/Users/${userId}`, undefined, user);
  }

  /**
   * Performs the delete user operation through the typed Jellyfin API boundary.
   * @param userId - The stable Jellyfin user identifier.
   */
  async deleteUser(userId: string): Promise<void> {
    await this.request<void>('DELETE', `/Users/${userId}`);
  }

  /**
   * Performs the update user password operation through the typed Jellyfin API boundary.
   * @param userId - The stable Jellyfin user identifier.
   * @param password - The password value required by this operation.
   */
  async updateUserPassword(userId: string, password: UpdateUserPasswordDto): Promise<void> {
    await this.request<void>('POST', '/Users/Password', { userId }, password);
  }

  /**
   * Performs the update user policy operation through the typed Jellyfin API boundary.
   * @param userId - The stable Jellyfin user identifier.
   * @param policy - The policy value required by this operation.
   */
  async updateUserPolicy(userId: string, policy: Partial<UserPolicy>): Promise<void> {
    await this.request<void>('POST', `/Users/${userId}/Policy`, undefined, policy);
  }

  /**
   * Performs the update user configuration operation through the typed Jellyfin API boundary.
   * @param userId - The stable Jellyfin user identifier.
   * @param config - The resolved Jellyfin client configuration.
   */
  async updateUserConfiguration(userId: string, config: Partial<UserConfiguration>): Promise<void> {
    await this.request<void>('POST', '/Users/Configuration', { userId }, config);
  }

  /**
   * Retrieves or derives display preferences without mutating Jellyfin state.
   * @param displayPreferencesId - The display preferences id value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param client - The client value required by this operation.
   * @returns - The normalized string representation.
   */
  async getDisplayPreferences(displayPreferencesId: string, userId?: string, client?: string): Promise<DisplayPreferences> {
    return this.request<DisplayPreferences>('GET', `/DisplayPreferences/${displayPreferencesId}`, { userId, client });
  }

  /**
   * Performs the update display preferences operation through the typed Jellyfin API boundary.
   * @param displayPreferencesId - The display preferences id value required by this operation.
   * @param prefs - The prefs value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @param client - The client value required by this operation.
   */
  async updateDisplayPreferences(displayPreferencesId: string, prefs: DisplayPreferences, userId?: string, client?: string): Promise<void> {
    await this.request<void>('POST', `/DisplayPreferences/${displayPreferencesId}`, { userId, client }, prefs);
  }

  /**
   * Retrieves or derives public users without mutating Jellyfin state.
   * @returns - The typed get public users result.
   */
  async getPublicUsers(): Promise<UserDto[]> {
    return this.request<UserDto[]>('GET', '/Users/Public');
  }

  /**
   * Implements forgot password for the typed Jellyfin CLI runtime.
   * @param username - The username value required by this operation.
   * @returns - The normalized string representation.
   */
  async forgotPassword(username: string): Promise<{ Name?: string; PinConfirmation?: boolean }> {
    return this.request<{ Name?: string; PinConfirmation?: boolean }>('POST', '/Users/ForgotPassword', undefined, { EnteredUsername: username });
  }

  /**
   * Implements forgot password pin for the typed Jellyfin CLI runtime.
   * @param pin - The pin value required by this operation.
   * @returns - The normalized string representation.
   */
  async forgotPasswordPin(pin: string): Promise<{ Success?: boolean; UsersReset?: string[] }> {
    return this.request<{ Success?: boolean; UsersReset?: string[] }>('POST', '/Users/ForgotPassword/Pin', undefined, { Pin: pin });
  }

  /**
   * Implements quick connect initiate for the typed Jellyfin CLI runtime.
   * @returns - The typed quick connect initiate result.
   */
  async quickConnectInitiate(): Promise<QuickConnectResult> {
    return this.request<QuickConnectResult>('POST', '/QuickConnect/Initiate');
  }

  /**
   * Implements quick connect connect for the typed Jellyfin CLI runtime.
   * @param secret - The secret value required by this operation.
   * @returns - The normalized string representation.
   */
  async quickConnectConnect(secret: string): Promise<QuickConnectResult> {
    return this.request<QuickConnectResult>('GET', '/QuickConnect/Connect', { secret });
  }

  /**
   * Implements quick connect authorize for the typed Jellyfin CLI runtime.
   * @param code - The code value required by this operation.
   * @param userId - The stable Jellyfin user identifier.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async quickConnectAuthorize(code: string, userId?: string): Promise<boolean> {
    return this.request<boolean>('POST', '/QuickConnect/Authorize', { code, userId });
  }

  /**
   * Implements quick connect enabled for the typed Jellyfin CLI runtime.
   * @returns - Whether the inspected value satisfies the documented condition.
   */
  async quickConnectEnabled(): Promise<boolean> {
    return this.request<boolean>('GET', '/QuickConnect/Enabled');
  }

  /**
   * Implements authenticate with quick connect for the typed Jellyfin CLI runtime.
   * @param secret - The secret value required by this operation.
   * @returns - The normalized string representation.
   */
  async authenticateWithQuickConnect(secret: string): Promise<UserDto> {
    const result = await this.request<UserDto>('POST', '/Users/AuthenticateWithQuickConnect', undefined, { Secret: secret });
    if (result.Id) {
      this.userId = result.Id;
    }
    return result;
  }
}
