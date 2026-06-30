import { TestBed } from '@angular/core/testing';
import { FormLayoutAdapter } from '../form-layout.adapter';
import { FormDefinition, SectionDefinition } from '../../forms/form.types';

const makeSection = (id: string, layout: 'grid' | 'flex' | 'stack' = 'grid'): SectionDefinition => ({
  id, layout, columns: 2, fields: [],
});

const baseForm = (layout: FormDefinition['layout']): FormDefinition => ({
  id: 'form-1',
  version: '1.0',
  mode: 'create',
  layout,
});

describe('FormLayoutAdapter', () => {
  let adapter: FormLayoutAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adapter = TestBed.inject(FormLayoutAdapter);
  });

  it('maps simple layout to stack type', () => {
    const def = adapter.toLayoutDefinition({
      ...baseForm('simple'),
      sections: [makeSection('s1')],
    });
    expect(def.type).toBe('stack');
  });

  it('maps sections layout to sections type', () => {
    const def = adapter.toLayoutDefinition({
      ...baseForm('sections'),
      sections: [makeSection('s1')],
    });
    expect(def.type).toBe('sections');
  });

  it('maps tabs layout to tabs type', () => {
    const def = adapter.toLayoutDefinition({
      ...baseForm('tabs'),
      tabs: [{ id: 't1', title: 'Tab 1', sections: [] }],
    });
    expect(def.type).toBe('tabs');
    expect(def.slots?.[0].id).toBe('tab-t1');
  });

  it('maps accordion layout to accordion type', () => {
    const def = adapter.toLayoutDefinition({
      ...baseForm('accordion'),
      sections: [makeSection('s1'), makeSection('s2')],
    });
    expect(def.type).toBe('accordion');
    expect(def.slots?.length).toBe(2);
  });

  it('maps wizard layout to sections type with step slots', () => {
    const def = adapter.toLayoutDefinition({
      ...baseForm('wizard'),
      steps: [{ id: 'step1', title: 'Step 1', sections: [] }],
    });
    expect(def.type).toBe('sections');
    expect(def.slots?.[0].id).toBe('step-step1');
  });

  it('sectionToLayoutDefinition maps grid section', () => {
    const sectionDef = adapter.sectionToLayoutDefinition(makeSection('sec1', 'grid'));
    expect(sectionDef.type).toBe('grid');
    expect(sectionDef.config?.grid?.columns).toBe(2);
  });

  it('sectionToLayoutDefinition maps flex section', () => {
    const sectionDef = adapter.sectionToLayoutDefinition(makeSection('sec2', 'flex'));
    expect(sectionDef.type).toBe('flex');
  });

  it('sectionToLayoutDefinition maps stack section', () => {
    const sectionDef = adapter.sectionToLayoutDefinition(makeSection('sec3', 'stack'));
    expect(sectionDef.type).toBe('stack');
  });

  it('preserves tab order', () => {
    const def = adapter.toLayoutDefinition({
      ...baseForm('tabs'),
      tabs: [
        { id: 'a', title: 'A', sections: [], order: 1 },
        { id: 'b', title: 'B', sections: [], order: 0 },
      ],
    });
    const orders = def.slots!.map(s => s.order);
    expect(orders).toEqual([1, 0]);
  });
});
