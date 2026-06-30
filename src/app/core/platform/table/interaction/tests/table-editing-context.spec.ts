import { TableEditingContext } from '../table-editing-context';

describe('TableEditingContext', () => {
  describe('initial state', () => {
    it('defaults to cell mode', () => {
      const ctx = new TableEditingContext();
      expect(ctx.mode()).toBe('cell');
    });

    it('accepts constructor mode', () => {
      const ctx = new TableEditingContext('row');
      expect(ctx.mode()).toBe('row');
    });

    it('starts not editing', () => {
      const ctx = new TableEditingContext();
      expect(ctx.isEditing()).toBeFalse();
    });

    it('starts not dirty', () => {
      const ctx = new TableEditingContext();
      expect(ctx.isDirty()).toBeFalse();
    });

    it('starts valid', () => {
      const ctx = new TableEditingContext();
      expect(ctx.isValid()).toBeTrue();
    });

    it('starts with null cell and rowId', () => {
      const ctx = new TableEditingContext();
      expect(ctx.editingCell()).toBeNull();
      expect(ctx.editingRowId()).toBeNull();
    });
  });

  describe('startCellEdit()', () => {
    it('sets editingCell and editingRowId', () => {
      const ctx = new TableEditingContext();
      ctx.startCellEdit({ rowId: 'r1', columnId: 'name' }, 'Alice');
      expect(ctx.editingCell()).toEqual({ rowId: 'r1', columnId: 'name' });
      expect(ctx.editingRowId()).toBe('r1');
      expect(ctx.isEditing()).toBeTrue();
    });

    it('resets pending edits and errors', () => {
      const ctx = new TableEditingContext();
      ctx.startCellEdit({ rowId: 'r1', columnId: 'a' }, 'x');
      ctx.setValue('a', 'y');
      ctx.setValidationError('a', 'bad');
      ctx.startCellEdit({ rowId: 'r2', columnId: 'b' }, 'z');
      expect(ctx.pendingCount()).toBe(0);
      expect(ctx.errorCount()).toBe(0);
    });

    it('stores original value accessible via getValue', () => {
      const ctx = new TableEditingContext();
      ctx.startCellEdit({ rowId: 'r1', columnId: 'age' }, 30);
      expect(ctx.getValue('age')).toBe(30);
    });
  });

  describe('startRowEdit()', () => {
    it('sets editingRowId and clears cell reference', () => {
      const ctx = new TableEditingContext('row');
      ctx.startRowEdit('r1', { name: 'Alice', age: 30 });
      expect(ctx.editingRowId()).toBe('r1');
      expect(ctx.editingCell()).toBeNull();
      expect(ctx.isEditing()).toBeTrue();
    });

    it('stores original values for each column', () => {
      const ctx = new TableEditingContext('row');
      ctx.startRowEdit('r1', { name: 'Alice', age: 30 });
      expect(ctx.getValue('name')).toBe('Alice');
      expect(ctx.getValue('age')).toBe(30);
      expect(ctx.getOriginalValue('name')).toBe('Alice');
    });
  });

  describe('setValue() / getValue()', () => {
    it('pending value overrides original', () => {
      const ctx = new TableEditingContext();
      ctx.startCellEdit({ rowId: 'r1', columnId: 'name' }, 'Alice');
      ctx.setValue('name', 'Bob');
      expect(ctx.getValue('name')).toBe('Bob');
    });

    it('returns original when not overridden', () => {
      const ctx = new TableEditingContext();
      ctx.startCellEdit({ rowId: 'r1', columnId: 'name' }, 'Alice');
      expect(ctx.getValue('name')).toBe('Alice');
    });

    it('sets isDirty when value set', () => {
      const ctx = new TableEditingContext();
      ctx.startCellEdit({ rowId: 'r1', columnId: 'x' }, null);
      ctx.setValue('x', 'hello');
      expect(ctx.isDirty()).toBeTrue();
      expect(ctx.pendingCount()).toBe(1);
    });
  });

  describe('validation', () => {
    it('setValidationError marks invalid', () => {
      const ctx = new TableEditingContext();
      ctx.startCellEdit({ rowId: 'r1', columnId: 'name' }, '');
      ctx.setValidationError('name', 'Required');
      expect(ctx.isValid()).toBeFalse();
      expect(ctx.getValidationError('name')).toBe('Required');
      expect(ctx.errorCount()).toBe(1);
    });

    it('clearValidationError restores valid', () => {
      const ctx = new TableEditingContext();
      ctx.startCellEdit({ rowId: 'r1', columnId: 'name' }, '');
      ctx.setValidationError('name', 'Required');
      ctx.clearValidationError('name');
      expect(ctx.isValid()).toBeTrue();
    });

    it('getValidationError returns null for non-error column', () => {
      const ctx = new TableEditingContext();
      expect(ctx.getValidationError('name')).toBeNull();
    });
  });

  describe('collectCommits()', () => {
    it('returns one commit per pending change', () => {
      const ctx = new TableEditingContext('row');
      ctx.startRowEdit('r1', { name: 'Alice', age: 30 });
      ctx.setValue('name', 'Bob');
      ctx.setValue('age', 31);
      const commits = ctx.collectCommits('t1');
      expect(commits.length).toBe(2);
      const nameCommit = commits.find(c => c.columnId === 'name')!;
      expect(nameCommit.value).toBe('Bob');
      expect(nameCommit.previousValue).toBe('Alice');
      expect(nameCommit.tableId).toBe('t1');
      expect(nameCommit.rowId).toBe('r1');
    });

    it('returns empty when no editing rowId', () => {
      const ctx = new TableEditingContext();
      expect(ctx.collectCommits('t1')).toEqual([]);
    });

    it('commits are frozen', () => {
      const ctx = new TableEditingContext();
      ctx.startCellEdit({ rowId: 'r1', columnId: 'x' }, 1);
      ctx.setValue('x', 2);
      const commits = ctx.collectCommits('t1');
      expect(Object.isFrozen(commits)).toBeTrue();
      expect(Object.isFrozen(commits[0])).toBeTrue();
    });
  });

  describe('cancelEdit()', () => {
    it('clears all editing state', () => {
      const ctx = new TableEditingContext();
      ctx.startCellEdit({ rowId: 'r1', columnId: 'x' }, 'old');
      ctx.setValue('x', 'new');
      ctx.cancelEdit();
      expect(ctx.isEditing()).toBeFalse();
      expect(ctx.isDirty()).toBeFalse();
      expect(ctx.editingCell()).toBeNull();
      expect(ctx.editingRowId()).toBeNull();
    });
  });

  describe('setMode()', () => {
    it('updates mode signal', () => {
      const ctx = new TableEditingContext('cell');
      ctx.setMode('row');
      expect(ctx.mode()).toBe('row');
    });
  });

  describe('toSnapshot()', () => {
    it('returns frozen snapshot', () => {
      const ctx = new TableEditingContext();
      ctx.startCellEdit({ rowId: 'r1', columnId: 'x' }, 'v');
      ctx.setValue('x', 'v2');
      const snap = ctx.toSnapshot();
      expect(snap.editingRowId).toBe('r1');
      expect(snap.isDirty).toBeTrue();
      expect(snap.isValid).toBeTrue();
      expect(Object.isFrozen(snap)).toBeTrue();
    });

    it('snapshot reflects current state at time of call', () => {
      const ctx = new TableEditingContext();
      const snap1 = ctx.toSnapshot();
      expect(snap1.isEditing).toBeUndefined(); // no isEditing in snapshot shape — check isDirty
      expect(snap1.isDirty).toBeFalse();
    });
  });
});
