import { TableEditingStrategy } from '../table-editing-strategy';

describe('TableEditingStrategy', () => {
  let strategy: TableEditingStrategy;

  beforeEach(() => {
    strategy = new TableEditingStrategy('cell');
  });

  it('exposes defaultMode', () => {
    expect(strategy.defaultMode).toBe('cell');
  });

  describe('canEdit()', () => {
    it('returns true for a normal editable column', () => {
      expect(strategy.canEdit({ columnId: 'name', columnType: 'text' })).toBeTrue();
    });

    it('returns false when readOnly is true', () => {
      expect(strategy.canEdit({ columnId: 'id', columnType: 'number', readOnly: true })).toBeFalse();
    });

    it('returns false when editMode is none', () => {
      expect(strategy.canEdit({ columnId: 'id', columnType: 'text', editMode: 'none' })).toBeFalse();
    });

    it('returns true when readOnly is explicitly false', () => {
      expect(strategy.canEdit({ columnId: 'x', columnType: 'text', readOnly: false })).toBeTrue();
    });
  });

  describe('resolveMode()', () => {
    it('returns column-level editMode if provided', () => {
      expect(
        strategy.resolveMode({ columnId: 'x', columnType: 'text', editMode: 'row' }),
      ).toBe('row');
    });

    it('falls back to defaultMode when no column editMode', () => {
      expect(strategy.resolveMode({ columnId: 'x', columnType: 'text' })).toBe('cell');
    });

    it('falls back to defaultMode when editMode is none', () => {
      expect(
        strategy.resolveMode({ columnId: 'x', columnType: 'text', editMode: 'none' }),
      ).toBe('cell');
    });
  });

  describe('commit / cancel triggers', () => {
    it('shouldCommitOnEnter returns true', () => {
      expect(strategy.shouldCommitOnEnter()).toBeTrue();
    });

    it('shouldCommitOnBlur returns true in cell mode', () => {
      expect(strategy.shouldCommitOnBlur()).toBeTrue();
    });

    it('shouldCommitOnBlur returns false in row mode', () => {
      const rowStrategy = new TableEditingStrategy('row');
      expect(rowStrategy.shouldCommitOnBlur()).toBeFalse();
    });

    it('shouldCommitOnTab returns true in cell mode', () => {
      expect(strategy.shouldCommitOnTab()).toBeTrue();
    });

    it('shouldCancelOnEscape returns true', () => {
      expect(strategy.shouldCancelOnEscape()).toBeTrue();
    });
  });
});
