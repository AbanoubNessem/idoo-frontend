import { TestBed } from '@angular/core/testing';
import { TableCellEditorRegistry } from '../table-cell-editor-registry.service';
import { TableEditorResolver } from '../table-editor-resolver.service';

describe('TableEditorResolver', () => {
  let resolver: TableEditorResolver;
  let registry: TableCellEditorRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(TableEditorResolver);
    registry = TestBed.inject(TableCellEditorRegistry);
  });

  describe('resolve()', () => {
    it('resolves text for column type "string"', () => {
      const r = resolver.resolve('string');
      expect(r.editorType).toBe('text');
      expect(r.fallback).toBeFalse();
      expect(r.definition).not.toBeNull();
    });

    it('resolves number for column type "number"', () => {
      const r = resolver.resolve('number');
      expect(r.editorType).toBe('number');
    });

    it('resolves select for column type "enum"', () => {
      const r = resolver.resolve('enum');
      expect(r.editorType).toBe('select');
    });

    it('falls back to text for unknown column type', () => {
      const r = resolver.resolve('xyz');
      expect(r.editorType).toBe('text');
      expect(r.fallback).toBeFalse();
    });

    it('respects overrideEditorType', () => {
      const r = resolver.resolve('string', 'textarea');
      expect(r.editorType).toBe('textarea');
      expect(r.fallback).toBeFalse();
    });

    it('falls back to text when resolved editor is not registered', () => {
      registry.removeEditor('number');
      const r = resolver.resolve('number');
      expect(r.editorType).toBe('text');
      expect(r.fallback).toBeTrue();
    });

    it('resolution is frozen', () => {
      const r = resolver.resolve('text');
      expect(Object.isFrozen(r)).toBeTrue();
    });
  });

  describe('resolveByType()', () => {
    it('resolves known editor type', () => {
      const r = resolver.resolveByType('date');
      expect(r.editorType).toBe('date');
      expect(r.fallback).toBeFalse();
    });

    it('fallback true when editor removed', () => {
      registry.removeEditor('date');
      const r = resolver.resolveByType('date');
      expect(r.fallback).toBeTrue();
      expect(r.definition).toBeNull();
    });
  });

  describe('supports()', () => {
    it('returns true for supported column type', () => {
      expect(resolver.supports('string')).toBeTrue();
    });

    it('returns true for unknown column type (maps to text which exists)', () => {
      expect(resolver.supports('unknownType')).toBeTrue();
    });

    it('returns false after editor is removed', () => {
      registry.removeEditor('text');
      // unknown type maps to text which no longer exists
      expect(resolver.supports('unknownType')).toBeFalse();
    });
  });
});
