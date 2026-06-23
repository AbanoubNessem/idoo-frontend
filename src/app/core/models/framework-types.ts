export interface Tenant {
  id: string;
  code: string;
  name: string;
  domain: string;
}

export interface Company {
  id: string;
  code: string;
  name: string;
  legalName?: string;
  country?: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  companyId: string;
  isMain?: boolean;
}

export interface FiscalYear {
  id: string;
  code: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED';
}

export interface QueryCriteria {
  page: number;
  size: number;
  sort?: { field: string; direction: 'asc' | 'desc' };
  filters?: Record<string, any>;
  search?: string;
}

export interface PaginatedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}
