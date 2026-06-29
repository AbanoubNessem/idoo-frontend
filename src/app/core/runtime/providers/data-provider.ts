import { inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DataProvider, QueryOptions, PagedResult } from '../runtime.types';
import { PLATFORM_CONFIG_TOKEN } from '../../kernel/kernel.tokens';
import { CacheEngineService } from '../engines/cache-engine.service';

export abstract class AbstractDataProvider<T> implements DataProvider<T> {
  abstract readonly name: string;
  abstract readonly apiPath: string;

  protected readonly http = inject(HttpClient);
  protected readonly config = inject(PLATFORM_CONFIG_TOKEN);
  protected readonly cache = inject(CacheEngineService);

  protected get baseUrl(): string {
    return `${this.config.apiUrl}${this.apiPath}`;
  }

  async getOne(id: string): Promise<T> {
    return this.cache.getOrSetAsync(
      `${this.name}:${id}`,
      () => firstValueFrom(this.http.get<T>(`${this.baseUrl}/${id}`)),
      { ttlMs: 60_000 },
    );
  }

  async getMany(options: QueryOptions = {}): Promise<PagedResult<T>> {
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

    return firstValueFrom(this.http.get<PagedResult<T>>(this.baseUrl, { params }));
  }

  async create(data: Partial<T>): Promise<T> {
    const result = await firstValueFrom(this.http.post<T>(this.baseUrl, data));
    this.cache.invalidate(this.name);
    return result;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const result = await firstValueFrom(this.http.put<T>(`${this.baseUrl}/${id}`, data));
    this.cache.delete(`${this.name}:${id}`);
    this.cache.deletePattern(new RegExp(`^${this.name}:list:`));
    return result;
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
    this.cache.delete(`${this.name}:${id}`);
    this.cache.deletePattern(new RegExp(`^${this.name}:list:`));
  }

  protected invalidateCache(id?: string): void {
    if (id) {
      this.cache.delete(`${this.name}:${id}`);
    }
    this.cache.invalidate(this.name);
  }
}
