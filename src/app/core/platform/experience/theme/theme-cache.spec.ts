import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ThemeCacheService } from './theme-cache.service';
import { THEME_CACHE_TTL_MS } from './theme.tokens';
import { PLATFORM_LIGHT_THEME, PLATFORM_DARK_THEME } from './theme.constants';

describe('ThemeCacheService', () => {
  let svc: ThemeCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: THEME_CACHE_TTL_MS, useValue: 200 }],
    });
    svc = TestBed.inject(ThemeCacheService);
  });

  it('is created', () => expect(svc).toBeTruthy());

  it('stores and retrieves a theme', () => {
    svc.set(PLATFORM_LIGHT_THEME);
    expect(svc.get('platform-light')).toBe(PLATFORM_LIGHT_THEME);
  });

  it('returns null for unknown theme', () => {
    expect(svc.get('nonexistent')).toBeNull();
  });

  it('has() returns true for cached theme', () => {
    svc.set(PLATFORM_LIGHT_THEME);
    expect(svc.has('platform-light')).toBeTrue();
  });

  it('has() returns false for uncached theme', () => {
    expect(svc.has('unknown')).toBeFalse();
  });

  it('evicts expired entries', fakeAsync(() => {
    svc.set(PLATFORM_LIGHT_THEME);
    tick(300);
    expect(svc.get('platform-light')).toBeNull();
  }));

  it('has() evicts expired entries', fakeAsync(() => {
    svc.set(PLATFORM_LIGHT_THEME);
    tick(300);
    expect(svc.has('platform-light')).toBeFalse();
  }));

  it('invalidate() removes a theme', () => {
    svc.set(PLATFORM_LIGHT_THEME);
    svc.invalidate('platform-light');
    expect(svc.get('platform-light')).toBeNull();
  });

  it('clear() removes all themes', () => {
    svc.set(PLATFORM_LIGHT_THEME);
    svc.set(PLATFORM_DARK_THEME);
    svc.clear();
    expect(svc.size()).toBe(0);
  });

  it('size() counts live entries', () => {
    svc.set(PLATFORM_LIGHT_THEME);
    svc.set(PLATFORM_DARK_THEME);
    expect(svc.size()).toBe(2);
  });

  it('stats() returns hit counts', () => {
    svc.set(PLATFORM_LIGHT_THEME);
    svc.get('platform-light');
    svc.get('platform-light');
    const stats = svc.stats();
    const entry = stats.find(s => s.id === 'platform-light');
    expect(entry?.hitCount).toBe(2);
  });
});
