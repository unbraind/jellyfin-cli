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

export class UsersApi extends ApiClientBase {
  async createUser(user: CreateUserDto): Promise<CreateUserResult> {
    return this.request<CreateUserResult>('POST', '/Users/New', undefined, user);
  }

  async updateUser(userId: string, user: Partial<UserDto>): Promise<void> {
    await this.request<void>('POST', `/Users/${userId}`, undefined, user);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.request<void>('DELETE', `/Users/${userId}`);
  }

  async updateUserPassword(userId: string, password: UpdateUserPasswordDto): Promise<void> {
    await this.request<void>('POST', '/Users/Password', { userId }, password);
  }

  async updateUserPolicy(userId: string, policy: Partial<UserPolicy>): Promise<void> {
    await this.request<void>('POST', `/Users/${userId}/Policy`, undefined, policy);
  }

  async updateUserConfiguration(userId: string, config: Partial<UserConfiguration>): Promise<void> {
    await this.request<void>('POST', '/Users/Configuration', { userId }, config);
  }

  async getDisplayPreferences(displayPreferencesId: string, userId?: string, client?: string): Promise<DisplayPreferences> {
    return this.request<DisplayPreferences>('GET', `/DisplayPreferences/${displayPreferencesId}`, { userId, client });
  }

  async updateDisplayPreferences(displayPreferencesId: string, prefs: DisplayPreferences, userId?: string, client?: string): Promise<void> {
    await this.request<void>('POST', `/DisplayPreferences/${displayPreferencesId}`, { userId, client }, prefs);
  }

  async getPublicUsers(): Promise<UserDto[]> {
    return this.request<UserDto[]>('GET', '/Users/Public');
  }

  async forgotPassword(username: string): Promise<{ Name?: string; PinConfirmation?: boolean }> {
    return this.request<{ Name?: string; PinConfirmation?: boolean }>('POST', '/Users/ForgotPassword', undefined, { EnteredUsername: username });
  }

  async forgotPasswordPin(pin: string): Promise<{ Success?: boolean; UsersReset?: string[] }> {
    return this.request<{ Success?: boolean; UsersReset?: string[] }>('POST', '/Users/ForgotPassword/Pin', undefined, { Pin: pin });
  }

  async quickConnectInitiate(): Promise<QuickConnectResult> {
    return this.request<QuickConnectResult>('POST', '/QuickConnect/Initiate');
  }

  async quickConnectConnect(secret: string): Promise<QuickConnectResult> {
    return this.request<QuickConnectResult>('GET', '/QuickConnect/Connect', { secret });
  }

  async quickConnectAuthorize(code: string, userId?: string): Promise<boolean> {
    return this.request<boolean>('POST', '/QuickConnect/Authorize', { code, userId });
  }

  async quickConnectEnabled(): Promise<boolean> {
    return this.request<boolean>('GET', '/QuickConnect/Enabled');
  }

  async authenticateWithQuickConnect(secret: string): Promise<UserDto> {
    const result = await this.request<UserDto>('POST', '/Users/AuthenticateWithQuickConnect', undefined, { Secret: secret });
    if (result.Id) {
      this.userId = result.Id;
    }
    return result;
  }
}
