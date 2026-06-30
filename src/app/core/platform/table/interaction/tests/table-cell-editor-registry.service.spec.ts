import { TestBed } from '@angular/core/testing';
import { TABLE_BUILT_IN_EDITORS } from '../table-interaction.constants';
import { TableCellEditorRegistry } from '../table-cell-editor-registry.service';

describe('TableCellEditorRegistry', () => {
  let registry: TableCellEditorRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    registry = TestBed.inject(TableCellEditorRegistry);
  });

  describe('built-in editors', () => {
    it('registers all 11 built-in editor types', () => {
      expect(registry.registeredCount()).toBe(TABLE_BUILT_IN_EDITORS.length);
    });

    it('has text editor', () => {
      expect(registry.hasEditor('text')).toBeTrue();
      expect(registry.getEditor('text')!.displayName).toBe('Text');
    });

    it('has number editor', () => {
      expect(registry.hasEditor('number')).toBeTrue();
    });

    it('has boolean editor', () => {
      const def = registry.getEditor('boolean')!;
      expect(def.supportsNull).toBeFalse();
    });

    it('has date editor', () => {
      expect(registry.hasEditor('date')).toBeTrue();
    });

    it('has datetime editor', () => {
      expect(registry.hasEditor('datetime')).toBeTrue();
    });

    it('has time editor', () => {
      expect(registry.hasEditor('time')).toBeTrue();
    });

    it('has select editor', () => {
      expect(registry.hasEditor('select')).toBeTrue();
    });

    it('has multiselect editor', () => {
      expect(registry.hasEditor('multiselect')).toBeTrue();
    });

    it('has checkbox editor', () => {
      expect(registry.hasEditor('checkbox')).toBeTrue();
    });

    it('has textarea editor', () => {
      expect(registry.hasEditor('textarea')).toBeTrue();
    });

    it('has custom editor', () => {
      expect(registry.hasEditor('custom')).toBeTrue();
    });
  });

  describe('registerEditor()', () => {
    it('adds a custom editor', () => {
      const before = registry.registeredCount();
      registry.registerEditor({
        type: 'custom',
        displayName: 'My Custom',
        supportsNull: true,
      });
      expect(registry.getEditor('custom')!.displayName).toBe('My Custom');
    });

    it('allows overriding an existing editor', () => {
      registry.registerEditor({ type: 'text', displayName: 'Rich Text', supportsNull: true });
      expect(registry.getEditor('text')!.displayName).toBe('Rich Text');
    });
  });

  describe('removeEditor()', () => {
    it('removes an editor and returns true', () => {
      const removed = registry.removeEditor('textarea');
      expect(removed).toBeTrue();
      expect(registry.hasEditor('textarea')).toBeFalse();
    });

    it('returns false for non-existent editor', () => {
      registry.removeEditor('textarea');
      const removed = registry.removeEditor('textarea');
      expect(removed).toBeFalse();
    });

    it('decrements registeredCount', () => {
      const before = registry.registeredCount();
      registry.removeEditor('text');
      expect(registry.registeredCount()).toBe(before - 1);
    });
  });

  describe('column type mapping', () => {
    it('resolves string → text', () => {
      expect(registry.resolveEditorTypeForColumn('string')).toBe('text');
    });

    it('resolves integer → number', () => {
      expect(registry.resolveEditorTypeForColumn('integer')).toBe('number');
    });

    it('resolves enum → select', () => {
      expect(registry.resolveEditorTypeForColumn('enum')).toBe('select');
    });

    it('falls back to text for unknown column type', () => {
      expect(registry.resolveEditorTypeForColumn('xyz')).toBe('text');
    });

    it('mapColumnType registers a new mapping', () => {
      registry.mapColumnType('richtext', 'textarea');
      expect(registry.resolveEditorTypeForColumn('richtext')).toBe('textarea');
    });
  });

  describe('listEditors() / listMappings()', () => {
    it('listEditors returns all editors', () => {
      const list = registry.listEditors();
      expect(list.length).toBe(registry.registeredCount());
    });

    it('listMappings returns all column mappings', () => {
      const mappings = registry.listMappings();
      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings[0]).toEqual(
        jasmine.objectContaining({ columnType: jasmine.any(String), editorType: jasmine.any(String) }),
      );
    });
  });
});
