import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PluginLifecycleService } from './plugin-lifecycle.service';
import { PluginManifest } from './plugin-manifest.model';

const makeManifest = (id: string): PluginManifest => ({
  id,
  name: id,
  version: '1.0.0',
  minimumPlatformVersion: '^1.0.0',
  category: 'erp',
  author: { name: 'test' },
});

describe('PluginLifecycleService', () => {
  let service: PluginLifecycleService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PluginLifecycleService] });
    service = TestBed.inject(PluginLifecycleService);
    service.clear();
  });

  it('should initialize plugin in DISCOVERED state', () => {
    service.initialize(makeManifest('HR'));
    expect(service.getState('HR')).toBe('DISCOVERED');
  });

  it('should transition through valid states', () => {
    service.initialize(makeManifest('HR'));
    service.transition('HR', 'VALIDATED');
    service.transition('HR', 'RESOLVED');
    service.transition('HR', 'LOADED');
    service.transition('HR', 'INITIALIZED');
    service.transition('HR', 'REGISTERED');
    service.transition('HR', 'READY');
    service.transition('HR', 'ACTIVE');
    expect(service.getState('HR')).toBe('ACTIVE');
  });

  it('should not transition via invalid path', () => {
    service.initialize(makeManifest('X'));
    service.transition('X', 'ACTIVE'); // not valid from DISCOVERED
    expect(service.getState('X')).toBe('DISCOVERED');
  });

  it('should transition to FAILED', () => {
    service.initialize(makeManifest('F'));
    service.transition('F', 'FAILED', {
      code: 'INIT_FAILED',
      pluginId: 'F',
      message: 'test error',
      timestamp: new Date().toISOString(),
    });
    expect(service.getState('F')).toBe('FAILED');
    expect(service.getEntry('F')?.error?.message).toBe('test error');
  });

  it('should return active plugins', () => {
    service.initialize(makeManifest('A'));
    ['VALIDATED','RESOLVED','LOADED','INITIALIZED','REGISTERED','READY','ACTIVE'].forEach(s => {
      service.transition('A', s as import('./plugin.types').PluginLifecycleState);
    });
    expect(service.getActive().length).toBe(1);
    expect(service.getActive()[0].manifest.id).toBe('A');
  });

  it('should return failed plugins', () => {
    service.initialize(makeManifest('B'));
    service.transition('B', 'FAILED', { code: 'UNKNOWN', pluginId: 'B', message: 'err', timestamp: '' });
    expect(service.getFailed().length).toBe(1);
  });

  it('should remove a plugin', () => {
    service.initialize(makeManifest('C'));
    service.remove('C');
    expect(service.getEntry('C')).toBeUndefined();
  });

  it('should check canTransition', () => {
    service.initialize(makeManifest('D'));
    expect(service.canTransition('D', 'VALIDATED')).toBe(true);
    expect(service.canTransition('D', 'ACTIVE')).toBe(false);
  });
});
