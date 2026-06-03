import { getPaginationLimits } from '../services/configService.js';

export async function parsePagination(query, businessId = null) {
  const { defaultPageSize, maxPageSize } = await getPaginationLimits(businessId);
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let pageSize = parseInt(query.pageSize, 10) || defaultPageSize;
  pageSize = Math.min(Math.max(1, pageSize), maxPageSize);
  const sort = query.sort || 'createdAt';
  const order = query.order === 'asc' ? 'asc' : 'desc';
  const search = query.search?.trim() || '';
  return { page, pageSize, sort, order, search, skip: (page - 1) * pageSize };
}

export function paginatedResponse(data, total, { page, pageSize }) {
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 0,
    },
  };
}
