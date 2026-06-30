import { TableStateStore } from '../table-state-store';
import { TableStateContext } from '../table-state-context';

function pair(tableId = 'products'): { store: TableStateStore; ctx: TableStateContext } {
  const store = new TableStateStore(tableId);
  return { store, ctx: new TableStateContext(store) };
}

describe('TableStateContext', () => {

  it('should expose tableId from the store', () => {
    expect(pair().ctx.tableId).toBe('products');
  });

  it('asReadonly() should always return the same reference', () => {
    const { ctx } = pair();
    expect(ctx.asReadonly()).toBe(ctx.asReadonly());
  });

  it('asReadonly().loading should reflect store loading', () => {
    const { store, ctx } = pair();
    expect(ctx.asReadonly().loading()).toBeFalse();
    store.update({ loading: true });
    expect(ctx.asReadonly().loading()).toBeTrue();
  });

  it('asReadonly().error should reflect store error', () => {
    const { store, ctx } = pair();
    store.update({ error: 'timeout' });
    expect(ctx.asReadonly().error()).toBe('timeout');
  });

  it('asReadonly().density should track density changes', () => {
    const { store, ctx } = pair();
    store.update({ density: 'compact' });
    expect(ctx.asReadonly().density()).toBe('compact');
  });

  it('asReadonly().isLoading should be computed from loading signal', () => {
    const { store, ctx } = pair();
    expect(ctx.asReadonly().isLoading()).toBeFalse();
    store.update({ loading: true });
    expect(ctx.asReadonly().isLoading()).toBeTrue();
  });

  it('asReadonly().hasError should be false when error is null', () => {
    expect(pair().ctx.asReadonly().hasError()).toBeFalse();
  });

  it('asReadonly().hasError should be true when error is set', () => {
    const { store, ctx } = pair();
    store.update({ error: 'failure' });
    expect(ctx.asReadonly().hasError()).toBeTrue();
  });

  it('asReadonly().hasError should return false after error cleared', () => {
    const { store, ctx } = pair();
    store.update({ error: 'err' });
    store.update({ error: null });
    expect(ctx.asReadonly().hasError()).toBeFalse();
  });

  it('asReadonly().isColumnVisible() should return true for a visible column', () => {
    const { store, ctx } = pair();
    store.update({ visibleColumns: ['id', 'name'] });
    expect(ctx.asReadonly().isColumnVisible('name')()).toBeTrue();
  });

  it('asReadonly().isColumnVisible() should return false for a hidden column', () => {
    const { store, ctx } = pair();
    store.update({ visibleColumns: ['id'] });
    expect(ctx.asReadonly().isColumnVisible('email')()).toBeFalse();
  });

  it('asReadonly().isRowExpanded() should return true for an expanded row', () => {
    const { store, ctx } = pair();
    store.update({ expandedRows: [1, 2, 3] });
    expect(ctx.asReadonly().isRowExpanded(2)()).toBeTrue();
  });

  it('asReadonly().isRowExpanded() should return false for a non-expanded row', () => {
    const { store, ctx } = pair();
    store.update({ expandedRows: [1] });
    expect(ctx.asReadonly().isRowExpanded(99)()).toBeFalse();
  });

  it('store getter should return the underlying TableStateStore', () => {
    const { store, ctx } = pair();
    expect(ctx.store).toBe(store);
  });
});
