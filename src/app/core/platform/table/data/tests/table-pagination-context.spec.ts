import { TablePaginationContext } from '../table-pagination-context';

function ctx(total = 100, page = 1, pageSize = 25): TablePaginationContext {
  const c = new TablePaginationContext({ page, pageSize });
  c.setTotalCount(total);
  return c;
}

describe('TablePaginationContext', () => {

  it('should start on page 1', () => {
    expect(new TablePaginationContext().page()).toBe(1);
  });

  it('should start with default page size', () => {
    expect(new TablePaginationContext().pageSize()).toBe(25);
  });

  it('should start with totalCount=0', () => {
    expect(new TablePaginationContext().totalCount()).toBe(0);
  });

  it('pageCount should equal ceil(total/pageSize)', () => {
    expect(ctx(100, 1, 25).pageCount()).toBe(4);
  });

  it('pageCount should be 1 for empty dataset', () => {
    expect(ctx(0).pageCount()).toBe(1);
  });

  it('hasFirst should be false on page 1', () => {
    expect(ctx().hasFirst()).toBeFalse();
  });

  it('hasFirst should be true on page 2+', () => {
    expect(ctx(100, 2).hasFirst()).toBeTrue();
  });

  it('hasLast should be false on last page', () => {
    const c = ctx(100, 4, 25);
    expect(c.hasLast()).toBeFalse();
  });

  it('hasLast should be true on non-last page', () => {
    expect(ctx(100, 1, 25).hasLast()).toBeTrue();
  });

  it('hasPrevious should equal hasFirst', () => {
    const c = ctx(100, 3, 25);
    expect(c.hasPrevious()).toBe(c.hasFirst());
  });

  it('hasNext should equal hasLast', () => {
    const c = ctx(100, 2, 25);
    expect(c.hasNext()).toBe(c.hasLast());
  });

  it('next() should increment page', () => {
    const c = ctx();
    c.next();
    expect(c.page()).toBe(2);
  });

  it('next() should not go beyond pageCount', () => {
    const c = ctx(100, 4, 25);
    c.next();
    expect(c.page()).toBe(4);
  });

  it('previous() should decrement page', () => {
    const c = ctx(100, 3, 25);
    c.previous();
    expect(c.page()).toBe(2);
  });

  it('previous() should not go below 1', () => {
    const c = ctx();
    c.previous();
    expect(c.page()).toBe(1);
  });

  it('first() should go to page 1', () => {
    const c = ctx(100, 4, 25);
    c.first();
    expect(c.page()).toBe(1);
  });

  it('last() should go to last page', () => {
    const c = ctx(100, 1, 25);
    c.last();
    expect(c.page()).toBe(4);
  });

  it('setPage() should clamp to pageCount', () => {
    const c = ctx(100, 1, 25);
    c.setPage(99);
    expect(c.page()).toBe(4);
  });

  it('setPageSize() should reset to page 1', () => {
    const c = ctx(100, 3, 25);
    c.setPageSize(50);
    expect(c.page()).toBe(1);
    expect(c.pageSize()).toBe(50);
  });

  it('setTotalCount() should clamp page if beyond new pageCount', () => {
    const c = ctx(100, 4, 25);
    c.setTotalCount(25);
    expect(c.page()).toBe(1);
  });

  it('startIndex should be (page-1)*pageSize', () => {
    expect(ctx(100, 2, 25).startIndex()).toBe(25);
  });

  it('endIndex should be min(startIndex+pageSize-1, total-1)', () => {
    expect(ctx(100, 4, 25).endIndex()).toBe(99);
  });

  it('endIndex for partial last page should stop at total-1', () => {
    expect(ctx(90, 4, 25).endIndex()).toBe(89);
  });

  it('toConfig() should return page and pageSize', () => {
    const c = ctx(100, 2, 25);
    const cfg = c.toConfig();
    expect(cfg.page).toBe(2);
    expect(cfg.pageSize).toBe(25);
  });

  it('toResult() should include all pagination fields', () => {
    const r = ctx(100, 2, 25).toResult();
    expect(r.page).toBe(2);
    expect(r.pageCount).toBe(4);
    expect(r.hasFirst).toBeTrue();
    expect(r.hasNext).toBeTrue();
  });
});
