import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../tokens/app-config.token';
import { ApiResponse, ModuleResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ModuleApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly base = `${this.config.apiUrl}/v1/modules`;

  getAll(): Observable<ApiResponse<ModuleResponse[]>> {
    return this.http.get<ApiResponse<ModuleResponse[]>>(this.base);
  }

  getById(id: number): Observable<ApiResponse<ModuleResponse>> {
    return this.http.get<ApiResponse<ModuleResponse>>(`${this.base}/${id}`);
  }

  activate(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/activate`, null);
  }

  deactivate(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/deactivate`, null);
  }
}
