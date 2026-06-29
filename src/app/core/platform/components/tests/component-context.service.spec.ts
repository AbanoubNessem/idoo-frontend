import { TestBed } from '@angular/core/testing';
import { ComponentContextService } from '../context/component-context.service';

describe('ComponentContextService', () => {
  let service: ComponentContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComponentContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with defaults', () => {
    expect(service.locale()).toBe('en-US');
    expect(service.permissions()).toEqual([]);
    expect(service.formKey()).toBe('');
  });

  it('should set locale', () => {
    service.setLocale('ar-SA');
    expect(service.locale()).toBe('ar-SA');
  });

  it('should set form key', () => {
    service.setFormKey('employee-form');
    expect(service.formKey()).toBe('employee-form');
  });

  it('should set permissions', () => {
    service.setPermissions(['read', 'write']);
    expect(service.permissions()).toEqual(['read', 'write']);
  });

  it('should grant a permission', () => {
    service.grantPermission('admin');
    expect(service.hasPermission('admin')).toBeTrue();
  });

  it('should revoke a permission', () => {
    service.grantPermission('editor');
    service.revokePermission('editor');
    expect(service.hasPermission('editor')).toBeFalse();
  });

  it('should return false for missing permission', () => {
    expect(service.hasPermission('superuser')).toBeFalse();
  });

  it('should set entity context', () => {
    service.setEntityContext('invoice', 42);
    expect(service.entityType()).toBe('invoice');
  });

  it('should set model', () => {
    service.setModel({ name: 'Alice', age: 30 });
    expect(service.model()['name']).toBe('Alice');
  });

  it('should patch model', () => {
    service.setModel({ name: 'Alice' });
    service.patchModel({ age: 30 });
    expect(service.model()['name']).toBe('Alice');
    expect(service.model()['age']).toBe(30);
  });

  it('should get model value by key', () => {
    service.setModel({ status: 'active' });
    expect(service.getModelValue('status')).toBe('active');
  });

  it('should produce a context snapshot', () => {
    service.setFormKey('form-1');
    service.setLocale('fr-FR');
    const ctx = service.context();
    expect(ctx.formKey).toBe('form-1');
    expect(ctx.locale).toBe('fr-FR');
  });

  it('should reset all state', () => {
    service.setFormKey('form-X');
    service.setLocale('de-DE');
    service.setPermissions(['admin']);
    service.reset();
    expect(service.formKey()).toBe('');
    expect(service.locale()).toBe('en-US');
    expect(service.permissions()).toEqual([]);
  });
});
