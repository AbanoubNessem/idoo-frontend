import { TestBed } from '@angular/core/testing';
import { LayoutResolverService } from '../layout-resolver.service';
import { LayoutContextData, LayoutDefinition } from '../layout.types';

const ctx: LayoutContextData = {
  breakpoint: 'md', device: 'desktop', orientation: 'landscape',
  direction: 'ltr', permissions: [], model: {},
};

describe('LayoutResolverService', () => {
  let service: LayoutResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutResolverService);
  });

  it('resolves a simple definition', () => {
    const def: LayoutDefinition = { id: 'r1', type: 'grid' };
    const resolved = service.resolve(def, ctx);
    expect(resolved.definition.id).toBe('r1');
    expect(resolved.breakpoint).toBe('md');
  });

  it('resolves slots in order', () => {
    const def: LayoutDefinition = {
      id: 'r2', type: 'grid',
      slots: [
        { id: 'b', order: 2 },
        { id: 'a', order: 1 },
      ],
    };
    const resolved = service.resolve(def, ctx);
    expect(resolved.slots[0].id).toBe('a');
    expect(resolved.slots[1].id).toBe('b');
  });

  it('applies responsive overrides for current breakpoint', () => {
    const def: LayoutDefinition = {
      id: 'r3', type: 'flex',
      config: { flex: { direction: 'row' } },
      responsive: {
        md: { config: { flex: { direction: 'column' } } },
      },
    };
    const resolved = service.resolve(def, ctx);
    expect(resolved.definition.config?.flex?.direction).toBe('column');
  });

  it('does not apply overrides for breakpoints above current', () => {
    const def: LayoutDefinition = {
      id: 'r4', type: 'flex',
      config: { flex: { direction: 'row' } },
      responsive: {
        xl: { config: { flex: { direction: 'column' } } },
      },
    };
    const resolved = service.resolve(def, { ...ctx, breakpoint: 'sm' });
    expect(resolved.definition.config?.flex?.direction).toBe('row');
  });

  it('resolves children recursively', () => {
    const def: LayoutDefinition = {
      id: 'parent', type: 'stack',
      children: [{ id: 'child', type: 'grid' }],
    };
    const resolved = service.resolve(def, ctx);
    expect(resolved.children.length).toBe(1);
    expect(resolved.children[0].definition.id).toBe('child');
  });

  it('marks hidden slots', () => {
    const def: LayoutDefinition = {
      id: 'r5', type: 'grid',
      slots: [{ id: 's1', hidden: true }],
    };
    const resolved = service.resolve(def, ctx);
    expect(resolved.slots[0].hidden).toBeTrue();
  });
});
