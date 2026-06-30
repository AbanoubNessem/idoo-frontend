import { TestBed } from '@angular/core/testing';
import { TableComparatorRegistry } from '../table-comparator-registry.service';
import {
  TABLE_COMPARATOR_BOOLEAN,
  TABLE_COMPARATOR_DATE,
  TABLE_COMPARATOR_LOCALE,
  TABLE_COMPARATOR_NUMBER,
  TABLE_COMPARATOR_TEXT,
} from '../table-data.constants';

describe('TableComparatorRegistry', () => {
  let service: TableComparatorRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableComparatorRegistry);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('should have built-in text comparator', () => {
    expect(service.has(TABLE_COMPARATOR_TEXT)).toBeTrue();
  });

  it('should have built-in number comparator', () => {
    expect(service.has(TABLE_COMPARATOR_NUMBER)).toBeTrue();
  });

  it('should have built-in date comparator', () => {
    expect(service.has(TABLE_COMPARATOR_DATE)).toBeTrue();
  });

  it('should have built-in boolean comparator', () => {
    expect(service.has(TABLE_COMPARATOR_BOOLEAN)).toBeTrue();
  });

  it('should have built-in locale-text comparator', () => {
    expect(service.has(TABLE_COMPARATOR_LOCALE)).toBeTrue();
  });

  it('registeredCount should reflect built-in count', () => {
    expect(service.registeredCount()).toBeGreaterThanOrEqual(5);
  });

  it('text comparator should sort correctly', () => {
    const fn = service.get(TABLE_COMPARATOR_TEXT)!;
    expect(fn('apple', 'banana')).toBeLessThan(0);
    expect(fn('banana', 'apple')).toBeGreaterThan(0);
    expect(fn('same', 'same')).toBe(0);
  });

  it('text comparator should be case-insensitive', () => {
    const fn = service.get(TABLE_COMPARATOR_TEXT)!;
    expect(fn('Apple', 'apple')).toBe(0);
  });

  it('number comparator should sort numerically', () => {
    const fn = service.get(TABLE_COMPARATOR_NUMBER)!;
    expect(fn(10, 20)).toBeLessThan(0);
    expect(fn(20, 10)).toBeGreaterThan(0);
    expect(fn(5, 5)).toBe(0);
  });

  it('date comparator should sort chronologically', () => {
    const fn = service.get(TABLE_COMPARATOR_DATE)!;
    expect(fn('2020-01-01', '2023-01-01')).toBeLessThan(0);
  });

  it('boolean comparator: false < true', () => {
    const fn = service.get(TABLE_COMPARATOR_BOOLEAN)!;
    expect(fn(false, true)).toBeLessThan(0);
    expect(fn(true, false)).toBeGreaterThan(0);
  });

  it('locale comparator should use Intl.Collator', () => {
    const fn = service.get(TABLE_COMPARATOR_LOCALE)!;
    expect(fn('a', 'b', 'en-US')).toBeLessThan(0);
  });

  it('register() should add custom comparator', () => {
    service.register('custom', (a, b) => String(a).length - String(b).length);
    expect(service.has('custom')).toBeTrue();
  });

  it('register() should override built-in', () => {
    const fn = (a: unknown, b: unknown) => String(b).localeCompare(String(a));
    service.register(TABLE_COMPARATOR_TEXT, fn);
    expect(service.get(TABLE_COMPARATOR_TEXT)).toBe(fn);
  });

  it('get() should return null for unknown id', () => {
    expect(service.get('unknown')).toBeNull();
  });

  it('remove() should delete a comparator', () => {
    service.register('temp', () => 0);
    service.remove('temp');
    expect(service.has('temp')).toBeFalse();
  });

  it('list() should include all registered ids', () => {
    service.register('my-comp', () => 0);
    expect(service.list()).toContain('my-comp');
  });
});
