import { TestBed } from '@angular/core/testing';
import { RendererRegistryService, FIELD_RENDERER } from '../renderer-registry.service';
import { RenderEventsService } from '../render-events.service';
import { FieldRenderer } from '../contracts/field-renderer';
import { FieldRendererConfig, RenderMode } from '../rendering.types';
import { RenderContext } from '../renderer-context';

function makeFieldRenderer(fieldType: string, displayName = 'Test'): FieldRenderer {
  return {
    fieldType,
    displayName,
    supportedModes: ['display', 'edit', 'filter'] as RenderMode[],
    canRender: (t) => t === fieldType,
    render: (_req, _ctx) => ({ component: null, inputs: {} }),
    getDefaultConfig: (): FieldRendererConfig => ({ fieldType, props: {} }),
  };
}

describe('RendererRegistryService', () => {
  let service: RendererRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RendererRegistryService, RenderEventsService],
    });
    service = TestBed.inject(RendererRegistryService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should register and resolve a field renderer', () => {
    const r = makeFieldRenderer('text');
    service.registerField(r);
    expect(service.resolveField('text')).toBe(r);
  });

  it('should return null for unregistered field type', () => {
    expect(service.resolveField('unknown')).toBeNull();
  });

  it('should report hasField correctly', () => {
    service.registerField(makeFieldRenderer('text'));
    expect(service.hasField('text')).toBeTrue();
    expect(service.hasField('number')).toBeFalse();
  });

  it('should overwrite renderer when registering same fieldType', () => {
    const r1 = makeFieldRenderer('text', 'Text v1');
    const r2 = makeFieldRenderer('text', 'Text v2');
    service.registerField(r1);
    service.registerField(r2);
    expect(service.resolveField('text')?.displayName).toBe('Text v2');
  });

  it('should unregister a field renderer', () => {
    service.registerField(makeFieldRenderer('text'));
    expect(service.unregisterField('text')).toBeTrue();
    expect(service.resolveField('text')).toBeNull();
  });

  it('should return false when unregistering unknown renderer', () => {
    expect(service.unregisterField('unknown')).toBeFalse();
  });

  it('should return all registered field renderers', () => {
    service.registerField(makeFieldRenderer('text'));
    service.registerField(makeFieldRenderer('number'));
    expect(service.getAllFieldRenderers().length).toBe(2);
  });

  it('should return correct counts', () => {
    service.registerField(makeFieldRenderer('text'));
    const counts = service.getCounts();
    expect(counts.field).toBe(1);
    expect(counts.layout).toBe(0);
    expect(counts.action).toBe(0);
    expect(counts.cell).toBe(0);
    expect(counts.widget).toBe(0);
  });

  it('should clear all registries', () => {
    service.registerField(makeFieldRenderer('text'));
    service.registerField(makeFieldRenderer('number'));
    service.clear();
    expect(service.getCounts().field).toBe(0);
  });

  it('should emit event on registration', () => {
    const events = TestBed.inject(RenderEventsService);
    const log: unknown[] = [];
    events.on('renderer:registered').subscribe(e => log.push(e));
    service.registerField(makeFieldRenderer('text'));
    expect(log.length).toBe(1);
  });

  it('should emit event on unregistration', () => {
    const events = TestBed.inject(RenderEventsService);
    service.registerField(makeFieldRenderer('text'));
    const log: unknown[] = [];
    events.on('renderer:unregistered').subscribe(e => log.push(e));
    service.unregisterField('text');
    expect(log.length).toBe(1);
  });

  it('should initialize from injected FIELD_RENDERER tokens', () => {
    const r = makeFieldRenderer('email');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        RendererRegistryService,
        RenderEventsService,
        { provide: FIELD_RENDERER, useValue: r, multi: true },
      ],
    });
    const svc = TestBed.inject(RendererRegistryService);
    svc.initializeFromInjected();
    expect(svc.resolveField('email')).toBe(r);
  });
});
