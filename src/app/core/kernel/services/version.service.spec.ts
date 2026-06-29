import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { VersionService } from './version.service';
import { PLATFORM_CONFIG_TOKEN } from '../kernel.tokens';

describe('VersionService', () => {
  let service: VersionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VersionService,
        { provide: PLATFORM_CONFIG_TOKEN, useValue: { apiUrl: 'http://localhost', production: false, platformVersion: '1.2.3', bootTimeoutMs: 10000, enableHotReload: false, featureFlags: [] } },
      ],
    });
    service = TestBed.inject(VersionService);
  });

  it('should parse version correctly', () => {
    const version = service.getVersion();
    expect(version.major).toBe(1);
    expect(version.minor).toBe(2);
    expect(version.patch).toBe(3);
    expect(version.raw).toBe('1.2.3');
  });

  it('should satisfy ^ range', () => {
    expect(service.satisfies('^1.0.0')).toBe(true);
    expect(service.satisfies('^1.2.0')).toBe(true);
    expect(service.satisfies('^2.0.0')).toBe(false);
  });

  it('should satisfy ~ range', () => {
    expect(service.satisfies('~1.2.0')).toBe(true);
    expect(service.satisfies('~1.2.3')).toBe(true);
    expect(service.satisfies('~1.3.0')).toBe(false);
  });

  it('should satisfy >= range', () => {
    expect(service.satisfies('>=1.0.0')).toBe(true);
    expect(service.satisfies('>=1.2.3')).toBe(true);
    expect(service.satisfies('>=2.0.0')).toBe(false);
  });

  it('should match exact version', () => {
    expect(service.satisfies('1.2.3')).toBe(true);
    expect(service.satisfies('1.2.4')).toBe(false);
  });

  it('should satisfy wildcard *', () => {
    expect(service.satisfies('*')).toBe(true);
  });

  it('should compare versions correctly', () => {
    expect(service.compareVersions('2.0.0', '1.0.0')).toBe(1);
    expect(service.compareVersions('1.0.0', '2.0.0')).toBe(-1);
    expect(service.compareVersions('1.0.0', '1.0.0')).toBe(0);
  });

  it('should return raw version string', () => {
    expect(service.getRaw()).toBe('1.2.3');
  });
});
