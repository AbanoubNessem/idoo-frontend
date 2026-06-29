import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CacheEngineService } from './cache-engine.service';

describe('CacheEngineService', () => {
  let service: CacheEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CacheEngineService] });
    service = TestBed.inject(CacheEngineService);
    service.clear();
  });

  it('should store and retrieve a value', () => {
    service.set('key1', { name: 'test' });
    expect(service.get('key1')).toEqual({ name: 'test' });
  });

  it('should return undefined for missing key', () => {
    expect(service.get('missing')).toBeUndefined();
  });

  it('should detect has() for existing key', () => {
    service.set('k', 42);
    expect(service.has('k')).toBe(true);
  });

  it('should return false has() for missing', () => {
    expect(service.has('nope')).toBe(false);
  });

  it('should delete a key', () => {
    service.set('del', 'bye');
    service.delete('del');
    expect(service.has('del')).toBe(false);
  });

  it('should expire entries based on TTL', async () => {
    service.set('short', 'value', { ttlMs: 50 });
    expect(service.get('short')).toBe('value');
    await new Promise(r => setTimeout(r, 100));
    expect(service.get('short')).toBeUndefined();
  });

  it('should use getOrSet to cache factory result', () => {
    let calls = 0;
    const factory = () => { calls++; return 'computed'; };
    const v1 = service.getOrSet('calc', factory);
    const v2 = service.getOrSet('calc', factory);
    expect(v1).toBe('computed');
    expect(v2).toBe('computed');
    expect(calls).toBe(1);
  });

  it('should invalidate by prefix', () => {
    service.set('hr:employee:1', { id: 1 });
    service.set('hr:employee:2', { id: 2 });
    service.set('fleet:vehicle:1', { id: 3 });
    service.invalidate('hr:employee');
    expect(service.has('hr:employee:1')).toBe(false);
    expect(service.has('hr:employee:2')).toBe(false);
    expect(service.has('fleet:vehicle:1')).toBe(true);
  });

  it('should delete by pattern', () => {
    service.set('list:page1', []);
    service.set('list:page2', []);
    service.set('detail:1', {});
    const removed = service.deletePattern(/^list:/);
    expect(removed).toBe(2);
    expect(service.has('detail:1')).toBe(true);
  });

  it('should clear all', () => {
    service.set('a', 1);
    service.set('b', 2);
    service.clear();
    expect(service.size()).toBe(0);
  });

  it('should report stats', () => {
    service.set('x', 1);
    service.get('x');
    const stats = service.getStats();
    expect(stats.size).toBe(1);
    expect(stats.hits).toBe(1);
  });
});
