import { TestBed } from '@angular/core/testing';
import { LayoutEngineService } from '../layout-engine.service';
import { LayoutBuilderService } from '../layout-builder.service';
import { LayoutDefinition } from '../layout.types';

describe('Layout Engine — Integration', () => {
  let engine: LayoutEngineService;
  let builder: LayoutBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    engine  = TestBed.inject(LayoutEngineService);
    builder = TestBed.inject(LayoutBuilderService);
  });

  afterEach(() => {
    engine.destroy('int-parent');
    engine.destroy('int-nested');
  });

  it('full lifecycle: register → create → update → destroy', () => {
    const def: LayoutDefinition = { id: 'int-parent', type: 'grid', config: { grid: { columns: 3 } } };
    engine.register(def);

    const inst = engine.create('int-parent');
    expect(inst.phase).toBe('ready');
    expect(inst.resolved?.css['display']).toBe('grid');

    const updated = engine.update('int-parent', { breakpoint: 'xl' });
    expect(updated?.resolved?.breakpoint).toBe('xl');

    engine.destroy('int-parent');
    expect(engine.getInstance('int-parent')).toBeNull();
  });

  it('nested layout resolves children', () => {
    const child = builder.grid('int-nested', 2).build();
    const parent = builder.create('int-parent', 'sections')
      .child(child)
      .build();

    const resolved = engine.resolve(parent);
    expect(resolved?.children.length).toBe(1);
    expect(resolved?.children[0].definition.id).toBe('int-nested');
  });

  it('builder + engine: sidebar layout', () => {
    const def = builder.sidebar('int-sidebar')
      .config({ sidebar: { sideWidth: '240px', position: 'start' } })
      .build();

    const resolved = engine.resolve(def);
    expect(resolved?.css['display']).toBe('flex');
    engine.destroy('int-sidebar');
  });

  it('RTL direction flips sidebar direction', () => {
    const def = builder.sidebar('int-sb-rtl')
      .config({ sidebar: { position: 'start' } })
      .direction('rtl')
      .build();

    const resolved = engine.resolve(def, { direction: 'rtl' });
    // Start sidebar in RTL becomes row-reverse
    expect(resolved?.css['flex-direction']).toBe('row-reverse');
    engine.destroy('int-sb-rtl');
  });

  it('responsive override applies at correct breakpoint', () => {
    const def = builder.create('int-resp', 'flex')
      .config({ flex: { direction: 'row' } })
      .responsive('xs', { config: { flex: { direction: 'column' } } })
      .build();

    const mobileResolved = engine.resolve(def, { breakpoint: 'xs' });
    const desktopResolved = engine.resolve(def, { breakpoint: 'lg' });

    expect(mobileResolved?.css['flex-direction']).toBe('column');
    expect(desktopResolved?.css['flex-direction']).toBe('row');
    engine.destroy('int-resp');
  });
});
