import { TestBed } from '@angular/core/testing';
import { TablePaginationEngine } from '../table-pagination-engine.service';
import { TablePaginationConfig } from '../table-data.types';

type Row = Record<string, unknown>;

function rows(n: number): Row[] {
  return Array.from({ length: n }, (_, i) => ({ id: i + 1 }));
}

function cfg(page: number, pageSize = 10): TablePaginationConfig {
  return { page, pageSize };
}

describe('TablePaginationEngine', () => {
  let service: TablePaginationEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TablePaginationEngine);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('should return a new array (not mutate)', () => {
    const data = rows(20);
    const { rows: paged } = service.paginate(data, cfg(1));
    expect(paged).not.toBe(data);
  });

  it('should return first page', () => {
    const { rows: paged } = service.paginate(rows(25), cfg(1, 10));
    expect(paged.length).toBe(10);
    expect(paged[0]['id']).toBe(1);
  });

  it('should return second page', () => {
    const { rows: paged } = service.paginate(rows(25), cfg(2, 10));
    expect(paged[0]['id']).toBe(11);
  });

  it('should return partial last page', () => {
    const { rows: paged } = service.paginate(rows(25), cfg(3, 10));
    expect(paged.length).toBe(5);
    expect(paged[0]['id']).toBe(21);
  });

  it('should clamp page to pageCount', () => {
    const { result } = service.paginate(rows(25), cfg(99, 10));
    expect(result.page).toBe(3);
  });

  it('result.totalCount should equal input rows.length', () => {
    expect(service.paginate(rows(37), cfg(1, 10)).result.totalCount).toBe(37);
  });

  it('result.pageCount should equal ceil(total/pageSize)', () => {
    expect(service.paginate(rows(25), cfg(1, 10)).result.pageCount).toBe(3);
  });

  it('hasFirst should be false on page 1', () => {
    expect(service.paginate(rows(30), cfg(1)).result.hasFirst).toBeFalse();
  });

  it('hasFirst should be true on page 2', () => {
    expect(service.paginate(rows(30), cfg(2)).result.hasFirst).toBeTrue();
  });

  it('hasLast should be false on last page', () => {
    expect(service.paginate(rows(20), cfg(2, 10)).result.hasLast).toBeFalse();
  });

  it('hasLast should be true on first page when >1 pages', () => {
    expect(service.paginate(rows(20), cfg(1, 10)).result.hasLast).toBeTrue();
  });

  it('hasPrevious should equal hasFirst', () => {
    const { result } = service.paginate(rows(30), cfg(2));
    expect(result.hasPrevious).toBe(result.hasFirst);
  });

  it('hasNext should equal hasLast', () => {
    const { result } = service.paginate(rows(30), cfg(1));
    expect(result.hasNext).toBe(result.hasLast);
  });

  it('startIndex should be (page-1)*pageSize', () => {
    expect(service.paginate(rows(50), cfg(3, 10)).result.startIndex).toBe(20);
  });

  it('endIndex should be startIndex + pageSize - 1 for full page', () => {
    expect(service.paginate(rows(50), cfg(2, 10)).result.endIndex).toBe(19);
  });

  it('endIndex should cap at totalCount-1 for partial page', () => {
    expect(service.paginate(rows(25), cfg(3, 10)).result.endIndex).toBe(24);
  });

  it('should handle empty rows', () => {
    const { rows: paged, result } = service.paginate([], cfg(1, 10));
    expect(paged.length).toBe(0);
    expect(result.totalCount).toBe(0);
    expect(result.pageCount).toBe(1);
  });
});
