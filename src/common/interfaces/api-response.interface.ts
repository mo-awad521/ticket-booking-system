export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  timestamp: string;
  path?: string;
  errors?: ValidationError[] | null;
}

export interface ValidationError {
  field: string;
  messages: string[];
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
