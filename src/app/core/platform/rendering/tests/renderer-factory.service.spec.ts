import { TestBed } from '@angular/core/testing';
import { RendererFactoryService } from '../renderer-factory.service';
import { RendererRegistryService } from '../renderer-registry.service';
import { RenderEventsService } from '../render-events.service';
import { FieldRenderer } from '../contracts/field-renderer';
import { FieldRendererConfig, RenderMode } from '../rendering.types';

function makeFieldRenderer(fieldType: string): FieldRenderer {
  return {
    fieldType,
    displayName: fieldType,
    supportedModes: ['display'] as RenderMode[],
    canRender: (t) => t === fieldType,
    render: (_req, _ctx) => ({ component: null, inputs: {} }),
    getDefaultConfig: (): FieldRendererConfig => ({ fieldType, props: {} }),
  };
}

describe('RendererFactoryService', () => {
  let factory: RendererFactoryService;
  let registry: RendererRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RendererFactoryService, RendererRegistryService, RenderEventsService],
    });
    factory = TestBed.inject(RendererFactoryService);
    registry = TestBed.inject(RendererRegistryService);
  });

  it('should create', () => {
    expect(factory).toBeTruthy();
  });

  describe('createFieldRenderer', () => {
    it('should return renderer when registered', () => {
      const r = makeFieldRenderer('text');
      registry.registerField(r);
      const result = factory.createFieldRenderer('text');
      expect(result.renderer).toBe(r);
      expect(result.error).toBeNull();
    });

    it('should return error when not registered', () => {
      const result = factory.createFieldRenderer('unknown');
      expect(result.renderer).toBeNull();
      expect(result.error?.code).toBe('FIELD_RENDERER_NOT_FOUND');
    });

    it('should include fieldType in error', () => {
      const result = factory.createFieldRenderer('mytype');
      expect(result.error?.message).toContain('mytype');
    });
  });

  describe('createLayoutRenderer', () => {
    it('should return error when no layout renderer registered', () => {
      const result = factory.createLayoutRenderer('grid');
      expect(result.renderer).toBeNull();
      expect(result.error?.code).toBe('LAYOUT_RENDERER_NOT_FOUND');
    });
  });

  describe('createActionRenderer', () => {
    it('should return error when no action renderer registered', () => {
      const result = factory.createActionRenderer('button');
      expect(result.renderer).toBeNull();
      expect(result.error?.code).toBe('ACTION_RENDERER_NOT_FOUND');
    });
  });

  describe('createCellRenderer', () => {
    it('should return no error when field renderer exists (fallback)', () => {
      registry.registerField(makeFieldRenderer('text'));
      const result = factory.createCellRenderer('text');
      expect(result.error).toBeNull();
    });

    it('should return error when neither cell nor field renderer exists', () => {
      const result = factory.createCellRenderer('unknown');
      expect(result.error?.code).toBe('CELL_RENDERER_NOT_FOUND');
    });
  });

  describe('createWidgetRenderer', () => {
    it('should return error when no widget renderer registered', () => {
      const result = factory.createWidgetRenderer('chart');
      expect(result.renderer).toBeNull();
      expect(result.error?.code).toBe('WIDGET_RENDERER_NOT_FOUND');
    });
  });

  describe('canRender checks', () => {
    it('should return true for registered field type', () => {
      registry.registerField(makeFieldRenderer('email'));
      expect(factory.canRenderField('email')).toBeTrue();
    });

    it('should return false for unregistered field type', () => {
      expect(factory.canRenderField('unknown')).toBeFalse();
    });

    it('should return false for unregistered layout type', () => {
      expect(factory.canRenderLayout('tabs')).toBeFalse();
    });

    it('should return false for unregistered action type', () => {
      expect(factory.canRenderAction('link')).toBeFalse();
    });
  });
});
