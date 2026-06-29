import { FormDef, FormSectionDef, FormFieldDef } from '../../registry/registries/form.registry';
import { TableDef, ColumnDef } from '../../registry/registries/table.registry';

export function withDefaults<T extends object>(partial: Partial<T>, defaults: T): T {
  return { ...defaults, ...partial } as T;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete (result as Record<string, unknown>)[key as string];
  }
  return result as Omit<T, K>;
}

export interface FormExtension {
  addSections?: FormSectionDef[];
  addFields?: Array<{ sectionId: string; field: FormFieldDef }>;
  modifyFields?: Array<{ key: string; updates: Partial<FormFieldDef> }>;
  removeFields?: string[];
  removeSectionIds?: string[];
  hooks?: Partial<FormDef['hooks']>;
}

export function extendForm(base: FormDef, extensions: FormExtension): FormDef {
  let sections = [...base.sections];

  if (extensions.removeSectionIds?.length) {
    sections = sections.filter(s => !extensions.removeSectionIds!.includes(s.id));
  }

  if (extensions.removeFields?.length) {
    sections = sections.map(section => ({
      ...section,
      fields: section.fields.filter(f => !extensions.removeFields!.includes(f.key)),
    }));
  }

  if (extensions.addFields?.length) {
    for (const { sectionId, field } of extensions.addFields) {
      sections = sections.map(section =>
        section.id === sectionId
          ? { ...section, fields: [...section.fields, field] }
          : section
      );
    }
  }

  if (extensions.modifyFields?.length) {
    sections = sections.map(section => ({
      ...section,
      fields: section.fields.map(f => {
        const mod = extensions.modifyFields!.find(m => m.key === f.key);
        return mod ? { ...f, ...mod.updates } : f;
      }),
    }));
  }

  if (extensions.addSections?.length) {
    sections = [...sections, ...extensions.addSections];
  }

  return {
    ...base,
    sections,
    hooks: extensions.hooks ? { ...base.hooks, ...extensions.hooks } : base.hooks,
  };
}

export interface TableExtension {
  addColumns?: ColumnDef[];
  insertColumns?: Array<{ column: ColumnDef; afterId: string }>;
  removeColumnIds?: string[];
  modifyColumns?: Array<{ id: string; updates: Partial<ColumnDef> }>;
  withDefaultSort?: { field: string; direction: 'asc' | 'desc' };
  withPageSize?: number;
}

export function extendTable(base: TableDef, extensions: TableExtension): TableDef {
  let columns = [...base.columns];

  if (extensions.removeColumnIds?.length) {
    columns = columns.filter(c => !extensions.removeColumnIds!.includes(c.id));
  }

  if (extensions.modifyColumns?.length) {
    columns = columns.map(col => {
      const mod = extensions.modifyColumns!.find(m => m.id === col.id);
      return mod ? { ...col, ...mod.updates } : col;
    });
  }

  if (extensions.insertColumns?.length) {
    for (const { column, afterId } of extensions.insertColumns) {
      const idx = columns.findIndex(c => c.id === afterId);
      if (idx !== -1) {
        columns.splice(idx + 1, 0, column);
      } else {
        columns.push(column);
      }
    }
  }

  if (extensions.addColumns?.length) {
    columns = [...columns, ...extensions.addColumns];
  }

  return {
    ...base,
    columns,
    defaultSort: extensions.withDefaultSort ?? base.defaultSort,
    pageSize: extensions.withPageSize ?? base.pageSize,
  };
}

export function createActionsColumn(label = ''): ColumnDef {
  return {
    id: '_actions',
    header: label,
    type: 'actions',
    sortable: false,
    sticky: 'end',
  };
}
