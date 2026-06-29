import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PLATFORM_CONFIG_TOKEN } from '../../kernel/kernel.tokens';
import { QueryOptions, PagedResult, QueryResult } from '../runtime.types';
import { CacheEngineService } from './cache-engine.service';

@Injectable({ providedIn: 'root' })
export class QueryEngineService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_CONFIG_TOKEN);
  private readonly cache = inject(CacheEngineService);

  async fetchOne<T>(
    apiPath: string,
    id: string,
    options: { cacheTtlMs?: number; bypassCache?: boolean } = {},
  ): Promise<QueryResult<T>> {
    const cacheKey = `query:${apiPath}:${id}`;

    if (!options.bypassCache) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached !== undefined) {
        return { data: cached, loading: false, error: null, timestamp: new Date().toISOString() };
      }
    }

    try {
      const url = `${this.config.apiUrl}${apiPath}/${id}`;
      const data = await firstValueFrom(this.http.get<T>(url));
      this.cache.set(cacheKey, data, { ttlMs: options.cacheTtlMs ?? 60_000 });
      return { data, loading: false, error: null, timestamp: new Date().toISOString() };
    } catch (err) {
      return {
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async fetchMany<T>(
    apiPath: string,
    options: QueryOptions & { cacheTtlMs?: number; bypassCache?: boolean } = {},
  ): Promise<QueryResult<PagedResult<T>>> {
    const cacheKey = `query:${apiPath}:list:${JSON.stringify(options)}`;

    if (!options.bypassCache) {
      const cached = this.cache.get<PagedResult<T>>(cacheKey);
      if (cached !== undefined) {
        return { data: cached, loading: false, error: null, timestamp: new Date().toISOString() };
      }
    }

    try {
      const url = `${this.config.apiUrl}${apiPath}`;
      let params = new HttpParams();

      if (options.page !== undefined) params = params.set('page', options.page);
      if (options.size !== undefined) params = params.set('size', options.size);
      if (options.search) params = params.set('search', options.search);
      if (options.sort) {
        params = params.set('sort', `${options.sort.field},${options.sort.direction}`);
      }
      if (options.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (value !== undefined && value !== null) {
            params = params.set(key, String(value));
          }
        }
      }

      const data = await firstValueFrom(this.http.get<PagedResult<T>>(url, { params }));
      this.cache.set(cacheKey, data, { ttlMs: options.cacheTtlMs ?? 30_000 });
      return { data, loading: false, error: null, timestamp: new Date().toISOString() };
    } catch (err) {
      return {
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async post<TRequest, TResponse>(
    apiPath: string,
    body: TRequest,
  ): Promise<QueryResult<TResponse>> {
    try {
      const url = `${this.config.apiUrl}${apiPath}`;
      const data = await firstValueFrom(this.http.post<TResponse>(url, body));
      return { data, loading: false, error: null, timestamp: new Date().toISOString() };
    } catch (err) {
      return {
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async put<TRequest, TResponse>(
    apiPath: string,
    id: string,
    body: TRequest,
  ): Promise<QueryResult<TResponse>> {
    try {
      const url = `${this.config.apiUrl}${apiPath}/${id}`;
      const data = await firstValueFrom(this.http.put<TResponse>(url, body));
      this.cache.invalidate(`query:${apiPath}:${id}`);
      this.cache.deletePattern(new RegExp(`^query:${apiPath}:list:`));
      return { data, loading: false, error: null, timestamp: new Date().toISOString() };
    } catch (err) {
      return {
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async delete(apiPath: string, id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const url = `${this.config.apiUrl}${apiPath}/${id}`;
      await firstValueFrom(this.http.delete(url));
      this.cache.invalidate(`query:${apiPath}:${id}`);
      this.cache.deletePattern(new RegExp(`^query:${apiPath}:list:`));
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  invalidateCache(apiPath: string, id?: string): void {
    if (id) {
      this.cache.delete(`query:${apiPath}:${id}`);
    }
    this.cache.deletePattern(new RegExp(`^query:${apiPath}:`));
  }
}
