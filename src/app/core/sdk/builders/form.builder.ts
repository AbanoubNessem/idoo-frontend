import { FormDef, FormSectionDef, FormFieldDef } from '../../registry/registries/form.registry';
import { ValidationResult } from '../validators/sdk-validation-error';
import { validateForm as validateFormFn } from '../validators/metadata-validators';

export class FormBuilder {
  private config: Partial<FormDef> = { sections: [] };

  static create(): FormBuilder {
    return new FormBuilder();
  }

  static from(existing: FormDef): FormBuilder {
    const builder = new FormBuilder();
    builder.config = {
      ...existing,
      sections: existing.sections.map(s => ({ ...s, fields: [...s.fields] })),
    };
    return builder;
  }

  addSection(config: FormSectionDef | {
    id: string;
    title?: string;
    columns?: 1 | 2 | 3 | 4;
    fields: FormFieldDef[];
    hidden?: (m: Record<string, unknown>) => boolean;
  }): this {
    this.config.sections = [...(this.config.sections ?? []), config as FormSectionDef];
    return this;
  }

  addField(field: FormFieldDef, sectionId?: string): this {
    const sections = this.config.sections ?? [];
    if (sectionId) {
      this.config.sections = sections.map(s =>
        s.id === sectionId ? { ...s, fields: [...s.fields, field] } : s
      );
    } else if (sections.length > 0) {
      const last = sections[sections.length - 1];
      this.config.sections = [...sections.slice(0, -1), { ...last, fields: [...last.fields, field] }];
    }
    return this;
  }

  removeField(key: string): this {
    this.config.sections = (this.config.sections ?? []).map(s => ({
      ...s,
      fields: s.fields.filter(f => f.key !== key),
    }));
    return this;
  }

  modifyField(key: string, updates: Partial<FormFieldDef>): this {
    this.config.sections = (this.config.sections ?? []).map(s => ({
      ...s,
      fields: s.fields.map(f => f.key === key ? { ...f, ...updates } : f),
    }));
    return this;
  }

  withLayout(layout: 'single-column' | 'two-column' | 'tabbed'): this {
    this.config.layout = layout;
    return this;
  }

  withHooks(hooks: FormDef['hooks']): this {
    this.config.hooks = hooks;
    return this;
  }

  build(): FormDef {
    return Object.freeze({
      layout: 'two-column' as const,
      ...this.config,
    }) as FormDef;
  }

  validate(): ValidationResult {
    return validateFormFn(this.config);
  }
}
