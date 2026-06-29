import { TestBed } from '@angular/core/testing';
import { RendererResolverService } from '../renderer-resolver.service';
import { RendererRegistryService } from '../renderer-registry.service';
import { RenderEventsService } from '../render-events.service';
import { FieldRenderer } from '../contracts/field-renderer';
import { FieldRendererConfig, RenderMode } from '../rendering.types';

function makeFieldRenderer(fieldType: string): FieldRenderer {
  return {
    fieldType,
    displayName: `${fieldType} Renderer`,
    supportedModes: ['display', 'edit', 'filter'] as RenderMode[],
    canRender: (t) => t === fieldType,
    render: (_req, _ctx) => ({ component: null, inputs: {} }),
    getDefaultConfig: (): FieldRendererConfig => ({ fieldType, props: {} }),
  };
}

describe('RendererResolverService', () => {
  let resolver: RendererResolverService;
  let registry: RendererRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RendererResolverService, RendererRegistryService, RenderEventsService],
    });
    resolver = TestBed.inject(RendererResolverService);
    registry = TestBed.inject(RendererRegistryService);
  });

  it('should create', () => {
    expect(resolver).toBeTruthy();
  });

  describe('resolveField', () => {
    it('should resolve a registered renderer', () => {
      registry.registerField(makeFieldRenderer('text'));
      const r = resolver.resolveField('text');
      expect(r.resolved).toBeTrue();
      expect(r.fallback).toBeFalse();
      expect(r.renderer).toBeTruthy();
    });

    it('should fall back to text renderer for unknown type', () => {
      registry.registerField(makeFieldRenderer('text'));
      const r = resolver.resolveField('nonexistent');
      expect(r.resolved).toBeTrue();
      expect(r.fallback).toBeTrue();
      expect(r.renderer?.fieldType).toBe('text');
    });

    it('should return unresolved when no fallback exists', () => {
      const r = resolver.resolveField('nonexistent');
      expect(r.resolved).toBeFalse();
      expect(r.renderer).toBeNull();
    });

    it('should mark as non-fallback when mode is supported', () => {
      registry.registerField(makeFieldRenderer('text'));
      const r = resolver.resolveField('text', 'display');
      expect(r.fallback).toBeFalse();
    });

    it('should mark as fallback when mode is not supported', () => {
      const limitedRenderer: FieldRenderer = {
        ...makeFieldRenderer('display-only'),
        supportedModes: ['display'],
      };
      registry.registerField(limitedRenderer);
      const r = resolver.resolveField('display-only', 'edit');
      expect(r.fallback).toBeTrue();
    });
  });

  describe('resolveCell', () => {
    it('should return unresolved when no cell renderer registered', () => {
      const r = resolver.resolveCell('text');
      expect(r.resolved).toBeFalse();
      expect(r.renderer).toBeNull();
    });
  });

  describe('supportsField', () => {
    it('should return true for registered type', () => {
      registry.registerField(makeFieldRenderer('text'));
      expect(resolver.supportsField('text')).toBeTrue();
    });

    it('should return false for unregistered type', () => {
      expect(resolver.supportsField('unknown')).toBeFalse();
    });
  });

  describe('supportedFieldTypes', () => {
    it('should return all registered field types', () => {
      registry.registerField(makeFieldRenderer('text'));
      registry.registerField(makeFieldRenderer('number'));
      const types = resolver.supportedFieldTypes();
      expect(types).toContain('text');
      expect(types).toContain('number');
    });
  });

  describe('getRendererDisplayName', () => {
    it('should return display name for registered renderer', () => {
      registry.registerField(makeFieldRenderer('text'));
      expect(resolver.getRendererDisplayName('text')).toBe('text Renderer');
    });

    it('should return fieldType itself when renderer not found', () => {
      expect(resolver.getRendererDisplayName('unknown')).toBe('unknown');
    });
  });
});
