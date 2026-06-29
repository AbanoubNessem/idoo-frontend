import { computed, signal } from '@angular/core';
import { FormContextData, FormMode } from '../form.types';

// ─── DynamicFormContext ───────────────────────────────────────────────────────
// Per-instance context. One instance created per active form by DynamicFormFactory.

export class DynamicFormContext {
  private readonly _formKey    = signal('');
  private readonly _formId     = signal('');
  private readonly _mode       = signal<FormMode>('create');
  private readonly _locale     = signal('en');
  private readonly _permissions = signal<string[]>([]);
  private readonly _entityType = signal<string | undefined>(undefined);
  private readonly _entityId   = signal<string | undefined>(undefined);
  private readonly _model      = signal<Record<string, unknown>>({});
  private readonly _extra      = signal<Record<string, unknown>>({});

  readonly formKey    = this._formKey.asReadonly();
  readonly formId     = this._formId.asReadonly();
  readonly mode       = this._mode.asReadonly();
  readonly locale     = this._locale.asReadonly();
  readonly permissions = this._permissions.asReadonly();
  readonly entityType = this._entityType.asReadonly();
  readonly entityId   = this._entityId.asReadonly();
  readonly model      = this._model.asReadonly();
  readonly extra      = this._extra.asReadonly();

  readonly isReadonly = computed(() => this._mode() === 'view' || this._mode() === 'readonly');

  readonly snapshot = computed<FormContextData>(() => ({
    formKey:    this._formKey(),
    formId:     this._formId(),
    mode:       this._mode(),
    locale:     this._locale(),
    permissions: this._permissions(),
    entityType: this._entityType(),
    entityId:   this._entityId(),
    model:      this._model(),
    extra:      this._extra(),
  }));

  initialize(data: Partial<FormContextData>): void {
    if (data.formKey   !== undefined) this._formKey.set(data.formKey);
    if (data.formId    !== undefined) this._formId.set(data.formId);
    if (data.mode      !== undefined) this._mode.set(data.mode);
    if (data.locale    !== undefined) this._locale.set(data.locale);
    if (data.permissions !== undefined) this._permissions.set(data.permissions);
    if (data.entityType !== undefined) this._entityType.set(data.entityType);
    if (data.entityId  !== undefined) this._entityId.set(data.entityId);
    if (data.model     !== undefined) this._model.set(data.model);
    if (data.extra     !== undefined) this._extra.set(data.extra);
  }

  setLocale(locale: string): void {
    this._locale.set(locale);
  }

  setMode(mode: FormMode): void {
    this._mode.set(mode);
  }

  setModel(model: Record<string, unknown>): void {
    this._model.set(model);
  }

  patchModel(patch: Record<string, unknown>): void {
    this._model.update(m => ({ ...m, ...patch }));
  }

  grantPermission(permission: string): void {
    this._permissions.update(perms => {
      if (perms.includes(permission)) return perms;
      return [...perms, permission];
    });
  }

  revokePermission(permission: string): void {
    this._permissions.update(perms => perms.filter(p => p !== permission));
  }

  hasPermission(permission: string): boolean {
    return this._permissions().includes(permission);
  }

  setEntityContext(type: string, id: string): void {
    this._entityType.set(type);
    this._entityId.set(id);
  }

  setExtra(key: string, value: unknown): void {
    this._extra.update(e => ({ ...e, [key]: value }));
  }

  buildEvalContext(): Record<string, unknown> {
    return {
      ...this._model(),
      __formKey:    this._formKey(),
      __formId:     this._formId(),
      __mode:       this._mode(),
      __locale:     this._locale(),
      __entityType: this._entityType(),
      __entityId:   this._entityId(),
      ...this._extra(),
    };
  }
}
