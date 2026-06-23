import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../tokens/app-config.token';
import { ApiResponse, PageResponse, PageParams, CompanyResponse, CreateCompanyRequest, UpdateCompanyRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class CompanyApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly base = `${this.config.apiUrl}/v1/companies`;

  getAll(params?: PageParams & { name?: string; status?: string }): Observable<ApiResponse<PageResponse<CompanyResponse>>> {
    return this.http.get<ApiResponse<PageResponse<CompanyResponse>>>(this.base, { params: params as Record<string, string | number> });
  }

  getById(id: string): Observable<ApiResponse<CompanyResponse>> {
    return this.http.get<ApiResponse<CompanyResponse>>(`${this.base}/${id}`);
  }

  create(body: CreateCompanyRequest): Observable<ApiResponse<CompanyResponse>> {
    return this.http.post<ApiResponse<CompanyResponse>>(this.base, body);
  }

  update(id: string, body: UpdateCompanyRequest): Observable<ApiResponse<CompanyResponse>> {
    return this.http.put<ApiResponse<CompanyResponse>>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  activate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/activate`, null);
  }

  deactivate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/deactivate`, null);
  }
}
