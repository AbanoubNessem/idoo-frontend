import { TestBed } from '@angular/core/testing';
import { TableValidatorService } from '../validator/table-validator.service';
import { TableColumnDefinition, TableDefinition } from '../table.types';

const validCol: TableColumnDefinition = {
  id: 'name', field: 'name', header: 'Name', type: 'text',
};

const validDef: TableDefinition = {
  id:      'customers',
  name:    'Customers',
  version: '1.0.0',
  columns: [validCol],
};

describe('TableValidatorService', () => {
  let service: TableValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableValidatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── validate (root) ──────────────────────────────────────────────────────

  it('should pass a valid definition', () => {
    const result = service.validate(validDef);
    expect(result.valid).toBeTrue();
    expect(result.errors.length).toBe(0);
  });

  it('should fail when id is empty', () => {
    const result = service.validate({ ...validDef, id: '' });
    expect(result.valid).toBeFalse();
    expect(result.errors.some(e => e.field === 'id')).toBeTrue();
  });

  it('should fail when name is empty', () => {
    const result = service.validate({ ...validDef, name: '' });
    expect(result.valid).toBeFalse();
    expect(result.errors.some(e => e.field === 'name')).toBeTrue();
  });

  it('should fail when columns is empty', () => {
    const result = service.validate({ ...validDef, columns: [] });
    expect(result.valid).toBeFalse();
    expect(result.errors.some(e => e.code === 'MIN_ITEMS')).toBeTrue();
  });

  it('should fail when column count exceeds maximum', () => {
    const columns = Array.from({ length: 201 }, (_, i) => ({
      id: `c${i}`, field: `f${i}`, header: `H${i}`, type: 'text' as const,
    }));
    const result = service.validate({ ...validDef, columns });
    expect(result.valid).toBeFalse();
    expect(result.errors.some(e => e.code === 'MAX_ITEMS')).toBeTrue();
  });

  it('should fail with invalid selectionMode', () => {
    const result = service.validate({ ...validDef, selectionMode: 'invalid' as never });
    expect(result.valid).toBeFalse();
    expect(result.errors.some(e => e.field === 'selectionMode')).toBeTrue();
  });

  it('should fail with invalid density', () => {
    const result = service.validate({ ...validDef, density: 'ultra' as never });
    expect(result.valid).toBeFalse();
    expect(result.errors.some(e => e.field === 'density')).toBeTrue();
  });

  it('should warn when version is not specified', () => {
    const { version, ...noVer } = validDef;
    const result = service.validate(noVer as TableDefinition);
    expect(result.valid).toBeTrue();
    expect(result.warnings.some(w => w.field === 'version')).toBeTrue();
  });

  // ─── validate (columns) ───────────────────────────────────────────────────

  it('should fail on duplicate column id', () => {
    const dup: TableDefinition = {
      ...validDef,
      columns: [validCol, { ...validCol }],
    };
    const result = service.validate(dup);
    expect(result.valid).toBeFalse();
    expect(result.errors.some(e => e.code === 'DUPLICATE_ID')).toBeTrue();
  });

  it('should warn on duplicate column field', () => {
    const dup: TableDefinition = {
      ...validDef,
      columns: [
        validCol,
        { id: 'name2', field: 'name', header: 'Name 2', type: 'text' },
      ],
    };
    const result = service.validate(dup);
    expect(result.warnings.some(w => w.code === 'DUPLICATE_FIELD')).toBeTrue();
  });

  it('should fail when column id is missing', () => {
    const result = service.validate({
      ...validDef,
      columns: [{ id: '', field: 'f', header: 'H', type: 'text' }],
    });
    expect(result.valid).toBeFalse();
    expect(result.errors.some(e => e.code === 'REQUIRED')).toBeTrue();
  });

  it('should fail when column field is missing', () => {
    const result = service.validate({
      ...validDef,
      columns: [{ id: 'c1', field: '', header: 'H', type: 'text' }],
    });
    expect(result.valid).toBeFalse();
  });

  it('should fail with unknown column type', () => {
    const result = service.validate({
      ...validDef,
      columns: [{ id: 'c1', field: 'f', header: 'H', type: 'unknown' as never }],
    });
    expect(result.valid).toBeFalse();
    expect(result.errors.some(e => e.code === 'INVALID_VALUE')).toBeTrue();
  });

  it('should accept all 21 known column types', () => {
    const types = [
      'text','number','currency','percentage','boolean',
      'date','datetime','time','badge','chip','status',
      'tag','avatar','image','icon','link','email',
      'phone','progress','rating','custom',
    ] as const;

    for (const type of types) {
      const result = service.validate({
        ...validDef,
        columns: [{ id: 'c', field: 'f', header: 'H', type, renderer: type === 'custom' ? 'my-renderer' : undefined }],
      });
      expect(result.errors.some(e => e.code === 'INVALID_VALUE')).toBeFalse();
    }
  });

  it('should warn when custom type has no renderer', () => {
    const result = service.validate({
      ...validDef,
      columns: [{ id: 'c', field: 'f', header: 'H', type: 'custom' }],
    });
    expect(result.warnings.some(w => w.code === 'MISSING_OPTIONAL')).toBeTrue();
  });

  // ─── validateColumn ───────────────────────────────────────────────────────

  it('should validate a single column successfully', () => {
    const result = service.validateColumn(validCol);
    expect(result.valid).toBeTrue();
  });

  it('should return errors for an invalid single column', () => {
    const result = service.validateColumn({ id: '', field: '', header: '', type: 'text' });
    expect(result.valid).toBeFalse();
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
