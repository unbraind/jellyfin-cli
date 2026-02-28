import { ApiClientBase } from './base.js';
import type { BaseItemDto, QueryResult } from '../types/index.js';

export class YearsApi extends ApiClientBase {
  async getYears(params?: { userId?: string; parentId?: string; startIndex?: number; limit?: number; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean; sortBy?: string; sortOrder?: string }): Promise<QueryResult<BaseItemDto>> {
    const userId = params?.userId ?? this.userId;
    return this.request<QueryResult<BaseItemDto>>('GET', '/Years', { ...params, userId });
  }

  async getYear(year: number, params?: { userId?: string; fields?: string[]; enableImages?: boolean; imageTypeLimit?: number; enableImageTypes?: string[]; enableUserData?: boolean }): Promise<BaseItemDto> {
    const userId = params?.userId ?? this.userId;
    return this.request<BaseItemDto>('GET', `/Years/${year}`, { ...params, userId });
  }
}
