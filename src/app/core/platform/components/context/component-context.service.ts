import { Injectable, signal, computed, inject } from '@angular/core';
import { FieldContext, ComponentDensity } from '../component.types';
import { DensitySystemService } from '../../ui/tokens/density-system.service';

@Injectable({ providedIn: 'root' })
export class ComponentContextService {
  private readonly density = inject(DensitySystemService);

  private readonly _locale      = signal('en-US');
  private readonly _permissions = signal<string[]>([]);
  private readonly _model       = signal<Record<string, unknown>>({});
  private readonly _formKey     = signal('');
  private readonly _entityType  = signal<string | undefined>(undefined);
  private readonly _entityId    = signal<unknown>(undefined);

  readonly locale      = computed(() => this._locale());
  readonly permissions = computed(() => this._permissions());
  readonly model       = computed(() => this._model());
  readonly formKey     = computed(() => this._formKey());
  readonly entityType  = computed(() => this._entityType());

  readonly currentDensity = computed<ComponentDensity>(() => {
    const level = this.density.level();
    switch (level) {
      case 'spacious':    return 'spacious';
      case 'compact':     return 'compact';
      default:            return 'comfortable';
    }
  });

  readonly context = computed<FieldContext>(() => ({
    formKey:     this._formKey(),
    entityType:  this._entityType(),
    entityId:    this._entityId(),
    locale:      this._locale(),
    density:     this.currentDensity(),
    permissions: this._permissions(),
    model:       this._model(),
  }));

  setFormKey(key: string): void          { this._formKey.set(key); }
  setLocale(locale: string): void        { this._locale.set(locale); }
  setPermissions(perms: string[]): void  { this._permissions.set(perms); }
  grantPermission(perm: string): void    { this._permissions.update(p => [...p, perm]); }
  revokePermission(perm: string): void   { this._permissions.update(p => p.filter(x => x !== perm)); }
  hasPermission(perm: string): boolean   { return this._permissions().includes(perm); }

  setEntityContext(type: string, id: unknown): void {
    this._entityType.set(type);
    this._entityId.set(id);
  }

  setModel(model: Record<string, unknown>): void { this._model.set(model); }

  patchModel(patch: Record<string, unknown>): void {
    this._model.update(m => ({ ...m, ...patch }));
  }

  getModelValue(key: string): unknown {
    return this._model()[key];
  }

  reset(): void {
    this._formKey.set('');
    this._locale.set('en-US');
    this._permissions.set([]);
    this._model.set({});
    this._entityType.set(undefined);
    this._entityId.set(undefined);
  }
}
