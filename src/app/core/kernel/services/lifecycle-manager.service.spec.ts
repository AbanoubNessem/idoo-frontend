import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LifecycleManagerService } from './lifecycle-manager.service';

describe('LifecycleManagerService', () => {
  let service: LifecycleManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LifecycleManagerService] });
    service = TestBed.inject(LifecycleManagerService);
    service.clear();
  });

  it('should register and emit a hook', async () => {
    const calls: string[] = [];
    service.on('beforeBoot', async () => { calls.push('beforeBoot'); });
    await service.emit('beforeBoot');
    expect(calls).toEqual(['beforeBoot']);
  });

  it('should call multiple hooks in registration order', async () => {
    const calls: number[] = [];
    service.on('afterBoot', async () => { calls.push(1); });
    service.on('afterBoot', async () => { calls.push(2); });
    await service.emit('afterBoot');
    expect(calls).toEqual([1, 2]);
  });

  it('should unregister a hook via returned fn', async () => {
    const calls: string[] = [];
    const off = service.on('onError', async () => { calls.push('called'); });
    off();
    await service.emit('onError');
    expect(calls).toHaveLength(0);
  });

  it('should not emit for different hook type', async () => {
    const calls: string[] = [];
    service.on('beforeBoot', async () => { calls.push('hit'); });
    await service.emit('afterBoot');
    expect(calls).toHaveLength(0);
  });

  it('should count hooks', () => {
    service.on('beforeShutdown', async () => {});
    service.on('beforeShutdown', async () => {});
    expect(service.hookCount('beforeShutdown')).toBe(2);
  });

  it('should clear hooks by type', () => {
    service.on('afterBoot', async () => {});
    service.clear('afterBoot');
    expect(service.hookCount('afterBoot')).toBe(0);
  });

  it('should clear all hooks', () => {
    service.on('beforeBoot', async () => {});
    service.on('afterBoot', async () => {});
    service.clear();
    expect(service.hookCount('beforeBoot')).toBe(0);
    expect(service.hookCount('afterBoot')).toBe(0);
  });
});
