import { TestBed } from '@angular/core/testing';
import { TableStateValidatorService } from '../table-state-validator.service';
import { TableState } from '../table-state.types';

function baseState(overrides: Partial<TableState> = {}): TableState {
  return {
    tableId:        'orders',
    loading:        false,
    error:          null,
    density:        'default',
    visibleColumns: ['id', 'name'],
    expandedRows:   [],
    focusedCell:    null,
    hoveredRow:     null,
    activeRow:      null,
    selection:      { active: false, mode: 'none' },
    sort:           { active: false },
    filter:         { active: false },
    pagination:     { active: false },
    editing:        { active: false },
    ...overrides,
  };
}

describe('TableStateValidatorService', () => {
  let service: TableStateValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableStateValidatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return valid for a well-formed full state', () => {
    expect(service.validate(baseState()).valid).toBeTrue();
  });

  it('should return error when tableId is empty string', () => {
    const r = service.validate(baseState({ tableId: '' }));
    expect(r.valid).toBeFalse();
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('should return error for invalid density', () => {
    const r = service.validate(baseState({ density: 'mega' as never }));
    expect(r.valid).toBeFalse();
    expect(r.errors[0]).toContain('density');
  });

  it('should return valid for each allowed density', () => {
    (['compact', 'default', 'comfortable'] as const).forEach(d => {
      expect(service.validate(baseState({ density: d })).valid).toBeTrue();
    });
  });

  it('should warn when visibleColumns is empty', () => {
    const r = service.validate(baseState({ visibleColumns: [] }));
    expect(r.valid).toBeTrue();
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('should error when visibleColumns is not an array', () => {
    const r = service.validate(baseState({ visibleColumns: 'id' as never }));
    expect(r.valid).toBeFalse();
  });

  it('should error when expandedRows is not an array', () => {
    const r = service.validate(baseState({ expandedRows: 'bad' as never }));
    expect(r.valid).toBeFalse();
  });

  it('should pass when expandedRows is an array', () => {
    expect(service.validate(baseState({ expandedRows: [1, 2] })).valid).toBeTrue();
  });

  it('should error when focusedCell.columnId is empty', () => {
    const r = service.validate(baseState({ focusedCell: { rowId: 'r1', columnId: '' } }));
    expect(r.valid).toBeFalse();
    expect(r.errors[0]).toContain('columnId');
  });

  it('should pass when focusedCell is null', () => {
    expect(service.validate(baseState({ focusedCell: null })).valid).toBeTrue();
  });

  it('should pass when focusedCell has valid rowId and columnId', () => {
    expect(service.validate(baseState({ focusedCell: { rowId: 1, columnId: 'name' } })).valid).toBeTrue();
  });

  it('should error when loading is not boolean', () => {
    const r = service.validate(baseState({ loading: 'yes' as never }));
    expect(r.valid).toBeFalse();
  });

  it('should error when error field is not string or null', () => {
    const r = service.validate(baseState({ error: 42 as never }));
    expect(r.valid).toBeFalse();
  });

  it('validateUpdate() should pass for an empty partial update', () => {
    expect(service.validateUpdate({}).valid).toBeTrue();
  });

  it('validateUpdate() should detect invalid density in partial update', () => {
    const r = service.validateUpdate({ density: 'jumbo' as never });
    expect(r.valid).toBeFalse();
  });
});
