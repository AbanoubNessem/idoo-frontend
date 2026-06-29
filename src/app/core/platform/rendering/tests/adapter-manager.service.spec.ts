import { TestBed } from '@angular/core/testing';
import { AdapterManagerService } from '../adapter-manager.service';
import { MaterialAdapter } from '../adapters/material.adapter';
import { RenderEventsService } from '../render-events.service';
import { UIAdapter } from '../adapters/adapter.interface';
import { AdapterType, AdapterConfig } from '../rendering.types';
import { Type } from '@angular/core';

function makeStubAdapter(type: AdapterType): UIAdapter {
  return {
    type,
    version: '1.0',
    isAvailable: true,
    getFieldComponent: () => null,
    getCellComponent: () => null,
    getLayoutComponent: () => null,
    getActionComponent: () => null,
    getWidgetComponent: () => null,
    configure: () => {},
    getConfig: () => ({ type, version: '1.0' }),
  };
}

describe('AdapterManagerService', () => {
  let service: AdapterManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdapterManagerService, MaterialAdapter, RenderEventsService],
    });
    service = TestBed.inject(AdapterManagerService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should have material as default adapter', () => {
    expect(service.activeAdapterType()).toBe('material');
  });

  it('should return material adapter by default', () => {
    const adapter = service.getAdapter();
    expect(adapter.type).toBe('material');
  });

  it('should register additional adapters', () => {
    service.registerAdapter(makeStubAdapter('primeng'));
    expect(service.getRegisteredTypes()).toContain('primeng');
  });

  it('should switch active adapter', () => {
    service.registerAdapter(makeStubAdapter('primeng'));
    service.setActiveAdapter('primeng');
    expect(service.activeAdapterType()).toBe('primeng');
  });

  it('should throw when switching to unregistered adapter', () => {
    expect(() => service.setActiveAdapter('primeng')).toThrowError(/primeng/);
  });

  it('should emit adapter:changed event on switch', () => {
    const events = TestBed.inject(RenderEventsService);
    const log: unknown[] = [];
    events.on('adapter:changed').subscribe(e => log.push(e));
    service.registerAdapter(makeStubAdapter('primeng'));
    service.setActiveAdapter('primeng');
    expect(log.length).toBe(1);
  });

  it('should get specific adapter by type', () => {
    const stub = makeStubAdapter('primeng');
    service.registerAdapter(stub);
    expect(service.getAdapter('primeng')).toBe(stub);
  });

  it('should fall back to material for unknown type in getAdapter', () => {
    expect(service.getAdapter('bootstrap' as AdapterType).type).toBe('material');
  });

  it('should report availability for registered adapter', () => {
    service.registerAdapter(makeStubAdapter('primeng'));
    expect(service.isAdapterAvailable('primeng')).toBeTrue();
  });

  it('should report unavailability for unregistered adapter', () => {
    expect(service.isAdapterAvailable('tailwind')).toBeFalse();
  });

  it('should return all registered adapter types', () => {
    service.registerAdapter(makeStubAdapter('primeng'));
    service.registerAdapter(makeStubAdapter('bootstrap'));
    const types = service.getRegisteredTypes();
    expect(types).toContain('material');
    expect(types).toContain('primeng');
    expect(types).toContain('bootstrap');
  });

  it('should configure an adapter via configure()', () => {
    const stub = makeStubAdapter('primeng');
    const configureSpy = spyOn(stub, 'configure');
    service.registerAdapter(stub);
    const config: AdapterConfig = { type: 'primeng', version: '17.0' };
    service.configure(config);
    expect(configureSpy).toHaveBeenCalledWith(config);
  });
});
