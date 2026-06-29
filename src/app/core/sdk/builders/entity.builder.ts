import { EntityDef } from '../../registry/registries/entity.registry';
import { FormDef } from '../../registry/registries/form.registry';
import { TableDef } from '../../registry/registries/table.registry';
import { ActionDef } from '../../registry/registries/action.registry';
import { validateEntity } from '../validators/metadata-validators';
import { ValidationResult } from '../validators/sdk-validation-error';

export class EntityBuilder {
  private config: Partial<EntityDef> = {};

  static create(id: string): EntityBuilder {
    const builder = new EntityBuilder();
    builder.config.id = id;
    return builder;
  }

  static from(existing: EntityDef): EntityBuilder {
    const builder = new EntityBuilder();
    builder.config = { ...existing };
    return builder;
  }

  withApiPath(path: string): this { this.config.apiPath = path; return this; }
  withLabels(singular: string, plural: string): this { this.config.labelSingular = singular; this.config.labelPlural = plural; return this; }
  withLabelField(field: string): this { this.config.labelField = field; return this; }
  withIcon(icon: string): this { this.config.icon = icon; return this; }
  withPermissions(permissions: EntityDef['permissions']): this { this.config.permissions = permissions; return this; }
  withTable(table: TableDef): this { this.config.table = table; return this; }
  withCreateForm(form: FormDef): this { this.config.form = { ...this.config.form as Record<string, unknown>, create: form } as unknown as EntityDef['form']; return this; }
  withEditForm(form: FormDef): this { this.config.form = { ...this.config.form as Record<string, unknown>, edit: form } as unknown as EntityDef['form']; return this; }
  withFilters(filters: unknown[]): this { this.config['filters'] = filters; return this; }
  withActions(actions: ActionDef[]): this { this.config['actions'] = actions; return this; }
  addAction(action: ActionDef): this { this.config['actions'] = [...((this.config['actions'] as ActionDef[] | undefined) ?? []), action]; return this; }
  searchable(value = true): this { this.config.searchable = value; return this; }
  exportable(value = true): this { this.config.exportable = value; return this; }
  withSoftDelete(): this { this.config['hasSoftDelete'] = true; return this; }
  withDefaultView(view: 'table' | 'detail'): this { this.config['defaultView'] = view; return this; }

  build(): EntityDef {
    return Object.freeze({
      searchable: false,
      exportable: false,
      defaultView: 'table',
      ...this.config,
    }) as EntityDef;
  }

  validate(): ValidationResult {
    return validateEntity(this.config);
  }
}
