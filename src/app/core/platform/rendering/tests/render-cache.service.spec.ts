import { TestBed } from '@angular/core/testing';
import { RenderCacheService } from '../render-cache.service';
import { RenderResult } from '../rendering.types';

function makeResult(requestId = 'r1'): RenderResult {
  return {
    requestId,
    success: true,
    component: null,
    inputs: {},
    errors: [],
    durationMs: 10,
    fromCache: false,
    adapter: 'material',
  };
}

describe('RenderCacheService', () => {
  let service: RenderCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [RenderCacheService] });
    service = TestBed.inject(RenderCacheService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('buildKey', () => {
    it('should build key without configHash', () => {
      const key = service.buildKey('text', 'material', 'display');
      expect(key).toBe('text:material:display');
    });

    it('should build key with configHash', () => {
      const key = service.buildKey('text', 'material', 'edit', 'abc123');
      expect(key).toBe('text:material:edit:abc123');
    });
  });

  describe('get / set', () => {
    it('should return null for cache miss', () => {
      expect(service.get('nonexistent')).toBeNull();
    });

    it('should return cached result', () => {
      const result = makeResult();
      service.set('key1', result);
      expect(service.get('key1')).toBeTruthy();
    });

    it('should track hits and misses', () => {
      service.set('key1', makeResult());
      service.get('key1');
      service.get('nonexistent');
      const stats = service.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should compute hit rate', () => {
      service.set('key1', makeResult());
      service.get('key1');
      service.get('key1');
      service.get('nonexistent');
      const stats = service.getStats();
      expect(stats.hitRate).toBeCloseTo(2 / 3, 2);
    });
  });

  describe('has', () => {
    it('should return false for uncached key', () => {
      expect(service.has('k')).toBeFalse();
    });

    it('should return true for cached key', () => {
      service.set('k', makeResult());
      expect(service.has('k')).toBeTrue();
    });
  });

  describe('invalidate', () => {
    it('should remove a specific key', () => {
      service.set('key1', makeResult());
      service.invalidate('key1');
      expect(service.get('key1')).toBeNull();
    });
  });

  describe('invalidateByFieldType', () => {
    it('should remove all keys for a field type', () => {
      service.set('text:material:display', makeResult('r1'));
      service.set('text:material:edit', makeResult('r2'));
      service.set('number:material:display', makeResult('r3'));
      service.invalidateByFieldType('text');
      expect(service.has('text:material:display')).toBeFalse();
      expect(service.has('text:material:edit')).toBeFalse();
      expect(service.has('number:material:display')).toBeTrue();
    });
  });

  describe('clear', () => {
    it('should clear all cached entries', () => {
      service.set('k1', makeResult());
      service.set('k2', makeResult());
      service.clear();
      expect(service.getStats().size).toBe(0);
    });
  });

  describe('size signal', () => {
    it('should reflect current cache size', () => {
      expect(service.size()).toBe(0);
      service.set('k', makeResult());
      expect(service.size()).toBe(1);
      service.clear();
      expect(service.size()).toBe(0);
    });
  });

  describe('resetStats', () => {
    it('should reset hit/miss counters', () => {
      service.set('k', makeResult());
      service.get('k');
      service.get('nonexistent');
      service.resetStats();
      const stats = service.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });
});
