import { PaginatedResult } from '../interfaces';

export class PaginationUtil {
  static buildResult<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static parseSort(
    sort?: string,
    defaultSort: Record<string, 1 | -1> = { createdAt: -1 },
  ): Record<string, 1 | -1> {
    if (!sort || sort.trim().length === 0) {
      return defaultSort;
    }

    const direction: 1 | -1 = sort.startsWith('-') ? -1 : 1;
    const field = sort.replace(/^-/, '');

    if (!field) {
      return defaultSort;
    }

    return { [field]: direction };
  }
}
