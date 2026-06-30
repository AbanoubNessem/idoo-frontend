import { TestBed } from '@angular/core/testing';
import { LayoutRendererService } from '../layout-renderer.service';
import { LayoutContextData, LayoutDefinition } from '../layout.types';

const ctx: LayoutContextData = {
  breakpoint: 'md', device: 'desktop', orientation: 'landscape',
  direction: 'ltr', permissions: [], model: {},
};

describe('LayoutRendererService', () => {
  let service: LayoutRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutRendererService);
  });

  it('renders grid layout with display:grid', () => {
    const def: LayoutDefinition = { id: 'g', type: 'grid', config: { grid: { columns: 3 } } };
    const out = service.render(def, ctx);
    expect(out.hostCss['display']).toBe('grid');
    expect(out.hostCss['grid-template-columns']).toContain('repeat(3');
  });

  it('renders flex layout with display:flex', () => {
    const def: LayoutDefinition = { id: 'f', type: 'flex' };
    const out = service.render(def, ctx);
    expect(out.hostCss['display']).toBe('flex');
  });

  it('renders stack layout as column flex', () => {
    const def: LayoutDefinition = { id: 's', type: 'stack' };
    const out = service.render(def, ctx);
    expect(out.hostCss['flex-direction']).toBe('column');
  });

  it('renders cards layout as grid with auto-fill', () => {
    const def: LayoutDefinition = { id: 'c', type: 'cards', config: { cards: { minCardWidth: '200px' } } };
    const out = service.render(def, ctx);
    expect(out.hostCss['display']).toBe('grid');
    expect(out.hostCss['grid-template-columns']).toContain('auto-fill');
  });

  it('RTL reverses flex-direction for rows', () => {
    const def: LayoutDefinition = { id: 'r', type: 'flex', direction: 'rtl' };
    const out = service.render(def, { ...ctx, direction: 'rtl' });
    expect(out.hostCss['flex-direction']).toBe('row-reverse');
  });

  it('applies elevation box-shadow', () => {
    const def: LayoutDefinition = { id: 'e', type: 'stack', config: { elevation: 2 } };
    const out = service.render(def, ctx);
    expect(out.hostCss['box-shadow']).toBeTruthy();
  });

  it('emits cssVars from token overrides', () => {
    const def: LayoutDefinition = {
      id: 'tv', type: 'grid', tokens: { spacing: { '4': '16px' } },
    };
    const out = service.render(def, ctx);
    expect(out.cssVars['--platform-spacing-4']).toBe('16px');
  });

  it('toCssString serializes CSS properties', () => {
    const str = service.toCssString({ display: 'grid', gap: '16px' });
    expect(str).toContain('display: grid');
    expect(str).toContain('gap: 16px');
  });

  it('renders slot CSS with grid-column span', () => {
    const def: LayoutDefinition = {
      id: 'gs', type: 'grid',
      slots: [{ id: 'slot1', span: 3 }],
    };
    const out = service.render(def, ctx);
    expect(out.slotCss['slot1']?.['grid-column']).toBe('span 3');
  });

  it('renders slot CSS with full-span', () => {
    const def: LayoutDefinition = {
      id: 'gf', type: 'grid',
      slots: [{ id: 'full', span: 'full' }],
    };
    const out = service.render(def, ctx);
    expect(out.slotCss['full']?.['grid-column']).toBe('1 / -1');
  });
});
