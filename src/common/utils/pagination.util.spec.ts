import { PaginationUtil } from './pagination.util';

describe('PaginationUtil', () => {
  it('builds a paginated result', () => {
    const result = PaginationUtil.buildResult(['a', 'b'], 25, 2, 10);

    expect(result).toEqual({
      items: ['a', 'b'],
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('computes skip offset', () => {
    expect(PaginationUtil.getSkip(1, 20)).toBe(0);
    expect(PaginationUtil.getSkip(3, 20)).toBe(40);
  });

  it('parses ascending and descending sort', () => {
    expect(PaginationUtil.parseSort('name')).toEqual({ name: 1 });
    expect(PaginationUtil.parseSort('-createdAt')).toEqual({ createdAt: -1 });
  });

  it('falls back to default sort', () => {
    expect(PaginationUtil.parseSort(undefined)).toEqual({ createdAt: -1 });
    expect(PaginationUtil.parseSort('')).toEqual({ createdAt: -1 });
  });
});
