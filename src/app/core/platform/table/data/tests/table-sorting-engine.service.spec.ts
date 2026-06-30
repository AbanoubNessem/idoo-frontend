import { TestBed } from '@angular/core/testing';
import { TableSortingEngine } from '../table-sorting-engine.service';
import { TableSortConfig, TableSortField } from '../table-data.types';

type Row = Record<string, unknown>;

function cfg(fields: TableSortField[], multi = false, stable = true): TableSortConfig {
  return { fields, multiColumn: multi, stable };
}

function field(f: string, dir: 'asc' | 'desc' = 'asc', comparatorId?: string): TableSortField {
  return { columnId: f, field: f, direction: dir, comparatorId };
}

describe('TableSortingEngine', () => {
  let service: TableSortingEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableSortingEngine);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('should return a copy with no fields', () => {
    const rows: Row[] = [{ n: 2 }, { n: 1 }];
    const result = service.sort(rows, cfg([]));
    expect(result).not.toBe(rows);
    expect(result).toEqual(rows);
  });

  it('should not mutate original array', () => {
    const rows: Row[] = [{ n: 3 }, { n: 1 }, { n: 2 }];
    const original   = [...rows];
    service.sort(rows, cfg([field('n')]));
    expect(rows).toEqual(original);
  });

  it('should sort strings asc', () => {
    const rows: Row[] = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
    const result = service.sort(rows, cfg([field('name')]));
    expect(result.map(r => r['name'])).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('should sort strings desc', () => {
    const rows: Row[] = [{ name: 'Alice' }, { name: 'Charlie' }, { name: 'Bob' }];
    const result = service.sort(rows, cfg([field('name', 'desc')]));
    expect(result.map(r => r['name'])).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it('should sort numbers asc', () => {
    const rows: Row[] = [{ n: 30 }, { n: 10 }, { n: 20 }];
    const result = service.sort(rows, cfg([field('n')]));
    expect(result.map(r => r['n'])).toEqual([10, 20, 30]);
  });

  it('should sort numbers desc', () => {
    const rows: Row[] = [{ n: 10 }, { n: 30 }, { n: 20 }];
    const result = service.sort(rows, cfg([field('n', 'desc')]));
    expect(result.map(r => r['n'])).toEqual([30, 20, 10]);
  });

  it('should sort booleans', () => {
    const rows: Row[] = [{ v: true }, { v: false }, { v: true }];
    const result = service.sort(rows, cfg([field('v')]));
    expect(result[0]['v']).toBeFalse();
  });

  it('should sort dates', () => {
    const rows: Row[] = [
      { d: '2024-06-01' }, { d: '2022-01-15' }, { d: '2023-12-31' },
    ];
    const result = service.sort(rows, cfg([field('d')]));
    expect(result[0]['d']).toBe('2022-01-15');
  });

  it('should place nulls last', () => {
    const rows: Row[] = [{ n: null }, { n: 5 }, { n: null }];
    const result = service.sort(rows, cfg([field('n')]));
    expect(result[0]['n']).toBe(5);
    expect(result[1]['n']).toBeNull();
    expect(result[2]['n']).toBeNull();
  });

  it('should implement stable sort', () => {
    const rows: Row[] = [
      { cat: 'A', order: 1 }, { cat: 'A', order: 2 }, { cat: 'A', order: 3 },
    ];
    const result = service.sort(rows, cfg([field('cat')]));
    expect(result.map(r => r['order'])).toEqual([1, 2, 3]);
  });

  it('should support multi-column sort', () => {
    const rows: Row[] = [
      { dept: 'Eng',   name: 'Zara' },
      { dept: 'Eng',   name: 'Alice' },
      { dept: 'HR',    name: 'Bob' },
    ];
    const result = service.sort(rows, cfg([field('dept'), field('name')], true));
    expect(result[0]['name']).toBe('Alice');
    expect(result[1]['name']).toBe('Zara');
    expect(result[2]['name']).toBe('Bob');
  });

  it('should use registered comparator when comparatorId is set', () => {
    const rows: Row[] = [{ v: 'aa' }, { v: 'b' }, { v: 'ccc' }];
    const result = service.sort(rows, cfg([field('v', 'asc', 'text')]));
    expect(result[0]['v']).toBe('aa');
  });

  it('should support dot-notation field paths', () => {
    const rows: Row[] = [
      { address: { city: 'Zurich' } },
      { address: { city: 'Athens' } },
    ];
    const f: TableSortField = { columnId: 'city', field: 'address.city', direction: 'asc' };
    const result = service.sort(rows, cfg([f]));
    expect((result[0]['address'] as Row)['city']).toBe('Athens');
  });

  it('should sort locale-aware with locale comparator', () => {
    const rows: Row[] = [{ name: 'Öz' }, { name: 'Az' }];
    const f: TableSortField = { columnId: 'name', field: 'name', direction: 'asc', comparatorId: 'locale-text', locale: 'sv-SE' };
    const result = service.sort(rows, cfg([f]));
    expect(result.length).toBe(2);
  });
});
