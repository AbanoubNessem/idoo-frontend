import { TestBed } from '@angular/core/testing';
import { LayoutBuilderService } from '../layout-builder.service';

describe('LayoutBuilderService', () => {
  let service: LayoutBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutBuilderService);
  });

  it('builds a minimal definition', () => {
    const def = service.create('d1', 'grid').build();
    expect(def.id).toBe('d1');
    expect(def.type).toBe('grid');
  });

  it('adds slots', () => {
    const def = service.create('d2', 'grid')
      .slot({ id: 's1', order: 0 })
      .slot({ id: 's2', order: 1 })
      .build();
    expect(def.slots?.length).toBe(2);
    expect(def.slots?.[0].id).toBe('s1');
  });

  it('adds children', () => {
    const child = service.create('child', 'flex').build();
    const parent = service.create('parent', 'stack').child(child).build();
    expect(parent.children?.length).toBe(1);
    expect(parent.children?.[0].id).toBe('child');
  });

  it('merges config', () => {
    const def = service.create('d3', 'grid')
      .config({ grid: { columns: 3 } })
      .config({ gap: '16px' })
      .build();
    expect(def.config?.grid?.columns).toBe(3);
    expect(def.config?.gap).toBe('16px');
  });

  it('sets direction', () => {
    const def = service.create('d4', 'flex').direction('rtl').build();
    expect(def.direction).toBe('rtl');
  });

  it('sets hidden', () => {
    const def = service.create('d5', 'grid').hidden().build();
    expect(def.hidden).toBeTrue();
  });

  it('sets responsive overrides', () => {
    const def = service.create('d6', 'flex')
      .responsive('sm', { config: { flex: { direction: 'column' } } })
      .build();
    expect(def.responsive?.sm?.config?.flex?.direction).toBe('column');
  });

  it('grid() helper creates grid type with columns', () => {
    const def = service.grid('g1', 6).build();
    expect(def.type).toBe('grid');
    expect(def.config?.grid?.columns).toBe(6);
  });

  it('tabs() helper creates tabs type', () => {
    const def = service.tabs('t1').build();
    expect(def.type).toBe('tabs');
  });

  it('accordion() helper creates accordion type', () => {
    const def = service.accordion('a1').build();
    expect(def.type).toBe('accordion');
  });

  it('sidebar() helper creates sidebar type', () => {
    const def = service.sidebar('sb1').build();
    expect(def.type).toBe('sidebar');
  });
});
