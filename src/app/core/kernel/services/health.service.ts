import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { PLATFORM_CONFIG_TOKEN } from '../kernel.tokens';
import {
  HealthCheckResult,
  HealthStatus,
  IHealthCheck,
  KernelHealthReport,
} from '../kernel.types';
import { VersionService } from './version.service';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly config = inject(PLATFORM_CONFIG_TOKEN);
  private readonly http = inject(HttpClient);
  private readonly versionService = inject(VersionService);
  private readonly checks = new Map<string, IHealthCheck>();

  constructor() {
    this.register(new ApiConnectivityCheck(this.config.apiUrl, this.http));
    this.register(new StorageAvailabilityCheck());
  }

  register(check: IHealthCheck): void {
    this.checks.set(check.name, check);
  }

  unregister(name: string): void {
    this.checks.delete(name);
  }

  async runAll(): Promise<KernelHealthReport> {
    const results = await Promise.all(
      Array.from(this.checks.values()).map(c => this.runCheck(c))
    );

    const overallStatus = this.aggregateStatus(results);

    return {
      overallStatus,
      checks: results,
      generatedAt: new Date().toISOString(),
      platformVersion: this.versionService.getRaw(),
    };
  }

  async runCheck(check: IHealthCheck): Promise<HealthCheckResult> {
    const start = performance.now();
    try {
      const result = await check.check();
      return { ...result, durationMs: performance.now() - start };
    } catch (err) {
      return {
        name: check.name,
        status: 'unhealthy',
        message: err instanceof Error ? err.message : 'Unknown error',
        durationMs: performance.now() - start,
      };
    }
  }

  async isHealthy(): Promise<boolean> {
    const report = await this.runAll();
    return report.overallStatus === 'healthy';
  }

  private aggregateStatus(results: HealthCheckResult[]): HealthStatus {
    if (results.some(r => r.status === 'unhealthy')) return 'unhealthy';
    if (results.some(r => r.status === 'degraded')) return 'degraded';
    return 'healthy';
  }
}

class ApiConnectivityCheck implements IHealthCheck {
  readonly name = 'platform:api-connectivity';
  readonly description = 'Checks that the backend API is reachable';

  constructor(
    private readonly apiUrl: string,
    private readonly http: HttpClient,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const start = performance.now();
    try {
      await firstValueFrom(
        this.http.get(`${this.apiUrl}/v1/health`, { observe: 'response' }).pipe(
          timeout(5_000),
          catchError(() => of(null)),
        ),
      );
      return {
        name: this.name,
        status: 'healthy',
        message: 'API is reachable',
        durationMs: performance.now() - start,
      };
    } catch {
      return {
        name: this.name,
        status: 'degraded',
        message: 'API health check timed out or failed',
        durationMs: performance.now() - start,
      };
    }
  }
}

class StorageAvailabilityCheck implements IHealthCheck {
  readonly name = 'platform:storage-availability';
  readonly description = 'Checks that localStorage and sessionStorage are available';

  async check(): Promise<HealthCheckResult> {
    const start = performance.now();
    try {
      const probe = '__idoo_storage_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      sessionStorage.setItem(probe, '1');
      sessionStorage.removeItem(probe);
      return {
        name: this.name,
        status: 'healthy',
        message: 'Storage is available',
        durationMs: performance.now() - start,
      };
    } catch {
      return {
        name: this.name,
        status: 'unhealthy',
        message: 'Browser storage is unavailable',
        durationMs: performance.now() - start,
      };
    }
  }
}
