import { DynamicFormContext } from '../context/dynamic-form-context';

describe('DynamicFormContext', () => {
  let ctx: DynamicFormContext;

  beforeEach(() => {
    ctx = new DynamicFormContext();
  });

  it('should initialize with empty state', () => {
    expect(ctx.formKey()).toBe('');
    expect(ctx.locale()).toBe('en');
    expect(ctx.permissions()).toEqual([]);
    expect(ctx.mode()).toBe('create');
  });

  it('should initialize with provided data', () => {
    ctx.initialize({ formKey: 'my-form', locale: 'ar', mode: 'edit' });
    expect(ctx.formKey()).toBe('my-form');
    expect(ctx.locale()).toBe('ar');
    expect(ctx.mode()).toBe('edit');
  });

  it('should compute isReadonly in view mode', () => {
    ctx.initialize({ mode: 'view' });
    expect(ctx.isReadonly()).toBeTrue();
  });

  it('should compute isReadonly in readonly mode', () => {
    ctx.initialize({ mode: 'readonly' });
    expect(ctx.isReadonly()).toBeTrue();
  });

  it('should not be readonly in edit mode', () => {
    ctx.initialize({ mode: 'edit' });
    expect(ctx.isReadonly()).toBeFalse();
  });

  it('should set locale', () => {
    ctx.setLocale('fr');
    expect(ctx.locale()).toBe('fr');
  });

  it('should set mode', () => {
    ctx.setMode('view');
    expect(ctx.mode()).toBe('view');
  });

  it('should set and patch model', () => {
    ctx.setModel({ name: 'Alice', age: 25 });
    expect(ctx.model()['name']).toBe('Alice');
    ctx.patchModel({ age: 30 });
    expect(ctx.model()['age']).toBe(30);
    expect(ctx.model()['name']).toBe('Alice');
  });

  it('should grant a permission', () => {
    ctx.grantPermission('can_edit');
    expect(ctx.hasPermission('can_edit')).toBeTrue();
  });

  it('should not duplicate permission on double grant', () => {
    ctx.grantPermission('admin');
    ctx.grantPermission('admin');
    expect(ctx.permissions().filter(p => p === 'admin').length).toBe(1);
  });

  it('should revoke a permission', () => {
    ctx.grantPermission('can_delete');
    ctx.revokePermission('can_delete');
    expect(ctx.hasPermission('can_delete')).toBeFalse();
  });

  it('should set entity context', () => {
    ctx.setEntityContext('Customer', '42');
    expect(ctx.entityType()).toBe('Customer');
    expect(ctx.entityId()).toBe('42');
  });

  it('should set extra data', () => {
    ctx.setExtra('tenantId', 'tenant-123');
    expect(ctx.extra()['tenantId']).toBe('tenant-123');
  });

  it('should build eval context including model and meta', () => {
    ctx.initialize({ formKey: 'f', model: { x: 1 } });
    const evalCtx = ctx.buildEvalContext();
    expect(evalCtx['x']).toBe(1);
    expect(evalCtx['__formKey']).toBe('f');
  });

  it('should expose snapshot computed with all data', () => {
    ctx.initialize({ formKey: 'snap-form', mode: 'create', locale: 'de' });
    const snap = ctx.snapshot();
    expect(snap.formKey).toBe('snap-form');
    expect(snap.locale).toBe('de');
  });
});
