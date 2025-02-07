export interface Pagination {
  totalDocs?: number;
  limit?: number;
  totalPages?: number;
  page?: number;
  pagingCounter?: number;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
  prevPage?: any;
  nextPage?: any;
}

export interface ApiResponse<T> {
  data: T;
  code: number;
  pagination?: Pagination;
  message: string;
}
