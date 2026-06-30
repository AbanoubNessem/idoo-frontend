import { TestBed } from '@angular/core/testing';
import { TableRenderContext } from '../plan/table-render-context';
import { TableRenderPlan } from '../rendering.types';

function mockPlan(state = 'ready', density = 'default'): TableRenderPlan {
  return {
    id: 'p1', tableId: 't1', plannedAt: new Date().toISOString(),
    state: state as never, density: density as never,
    headerCells: [], bodyCells: [], footerCells: [],
    loading: { type: 'loading', id: 'l', visible: true, skeletonRows: 5, columnCount: 3 },
    empty:   { type: 'empty',   id: 'e', visible: true, message: 'No records.' },
    error:   { type: 'error',   id: 'er', visible: true, message: 'Error.' },
    hasToolbar: false, hasFooter: false, columnCount: 3, metadata: {},
  } as TableRenderPlan;
}

describe('TableRenderContext', () => {
  let ctx: TableRenderContext;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    ctx = new TableRenderContext();
  });

  it('should start in idle state', () => {
    expect(ctx.state()).toBe('idle');
  });

  it('should start with default density', () => {
    expect(ctx.density()).toBe('default');
  });

  it('should start with no plan', () => {
    expect(ctx.plan()).toBeNull();
  });

  it('isIdle should be true initially', () => {
    expect(ctx.isIdle()).toBeTrue();
  });

  it('setLoading should transition to loading', () => {
    ctx.setLoading();
    expect(ctx.state()).toBe('loading');
    expect(ctx.isLoading()).toBeTrue();
    expect(ctx.errorMsg()).toBeNull();
  });

  it('setReady should apply plan and transition to ready', () => {
    const plan = mockPlan();
    ctx.setReady(plan);
    expect(ctx.state()).toBe('ready');
    expect(ctx.isReady()).toBeTrue();
    expect(ctx.plan()).toBe(plan);
    expect(ctx.hasPlan()).toBeTrue();
  });

  it('setReady should update density from plan', () => {
    const plan = mockPlan('ready', 'compact');
    ctx.setReady(plan);
    expect(ctx.density()).toBe('compact');
  });

  it('setEmpty should apply plan and transition to empty', () => {
    const plan = mockPlan('empty');
    ctx.setEmpty(plan);
    expect(ctx.state()).toBe('empty');
    expect(ctx.isEmpty()).toBeTrue();
    expect(ctx.plan()).toBe(plan);
  });

  it('setError should transition to error and set errorMsg', () => {
    ctx.setError('Something went wrong');
    expect(ctx.state()).toBe('error');
    expect(ctx.isError()).toBeTrue();
    expect(ctx.errorMsg()).toBe('Something went wrong');
  });

  it('setError should clear previous plan errors on setLoading', () => {
    ctx.setError('boom');
    ctx.setLoading();
    expect(ctx.errorMsg()).toBeNull();
  });

  it('setDensity should update density without changing state', () => {
    ctx.setReady(mockPlan());
    ctx.setDensity('comfortable');
    expect(ctx.density()).toBe('comfortable');
    expect(ctx.state()).toBe('ready');
  });

  it('reset should return context to initial state', () => {
    ctx.setReady(mockPlan());
    ctx.reset();
    expect(ctx.state()).toBe('idle');
    expect(ctx.density()).toBe('default');
    expect(ctx.plan()).toBeNull();
    expect(ctx.errorMsg()).toBeNull();
  });

  it('each context instance is independent', () => {
    const ctx2 = new TableRenderContext();
    ctx.setLoading();
    expect(ctx2.state()).toBe('idle');
  });
});
