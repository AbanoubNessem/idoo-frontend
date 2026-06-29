import { inject, Injectable, Type } from '@angular/core';
import { ComponentResolverService } from '../../components/resolver/component-resolver.service';
import { ComponentFieldType } from '../../components/component.types';
import {
  ArrayFieldDefinition,
  FieldDefinition,
  FormDefinition,
  GroupDefinition,
  ResolvedField,
  ResolvedFormModel,
  ResolvedGroup,
  ResolvedSection,
  ResolvedStep,
  ResolvedTab,
  SectionDefinition,
} from '../form.types';

@Injectable({ providedIn: 'root' })
export class DynamicFormResolverService {
  private readonly componentResolver = inject(ComponentResolverService);

  async resolve(definition: FormDefinition): Promise<ResolvedFormModel> {
    const allFields: ResolvedField[] = [];
    const fieldIndex = new Map<string, ResolvedField>();

    const sections = await this._resolveSections(
      definition.sections ?? [],
      allFields,
      fieldIndex,
    );

    const tabs = await Promise.all(
      (definition.tabs ?? []).map(async tab => {
        const resolvedSections = await this._resolveSections(
          tab.sections,
          allFields,
          fieldIndex,
        );
        const resolved: ResolvedTab = {
          id:                tab.id,
          title:             tab.title,
          icon:              tab.icon,
          badge:             tab.badge,
          order:             tab.order,
          hiddenExpression:  tab.hiddenExpression,
          sections:          resolvedSections,
        };
        return resolved;
      }),
    );

    const steps = await Promise.all(
      (definition.steps ?? []).map(async step => {
        const resolvedSections = await this._resolveSections(
          step.sections,
          allFields,
          fieldIndex,
        );
        const resolved: ResolvedStep = {
          id:                     step.id,
          title:                  step.title,
          description:            step.description,
          icon:                   step.icon,
          optional:               step.optional,
          order:                  step.order,
          canNavigateExpression:  step.canNavigateExpression,
          sections:               resolvedSections,
        };
        return resolved;
      }),
    );

    return {
      definition,
      sections,
      tabs,
      steps,
      allFields,
      fieldIndex,
      resolvedAt: new Date().toISOString(),
    };
  }

  private async _resolveSections(
    defs: SectionDefinition[],
    allFields: ResolvedField[],
    fieldIndex: Map<string, ResolvedField>,
  ): Promise<ResolvedSection[]> {
    return Promise.all(
      defs.map(s => this._resolveSection(s, allFields, fieldIndex)),
    );
  }

  private async _resolveSection(
    section: SectionDefinition,
    allFields: ResolvedField[],
    fieldIndex: Map<string, ResolvedField>,
  ): Promise<ResolvedSection> {
    const fields = await this._resolveFields(section.fields ?? [], allFields, fieldIndex);
    const groups = await this._resolveGroups(section.groups ?? [], allFields, fieldIndex);
    const arrays = await this._resolveArrays(section.arrays ?? []);
    const subsections = await this._resolveSections(
      section.subsections ?? [],
      allFields,
      fieldIndex,
    );

    return {
      id:                  section.id,
      title:               section.title,
      description:         section.description,
      layout:              section.layout,
      columns:             section.columns,
      collapsible:         section.collapsible,
      collapsed:           section.collapsed,
      lazy:                section.lazy,
      hiddenExpression:    section.hiddenExpression,
      disabledExpression:  section.disabledExpression,
      order:               section.order,
      fields,
      groups,
      arrays,
      subsections,
    };
  }

  private async _resolveArrays(
    arrays: ArrayFieldDefinition[],
  ): Promise<ArrayFieldDefinition[]> {
    return Promise.all(
      arrays.map(async arr => {
        const resolvedItemFields = await Promise.all(
          (arr.itemSchema.fields ?? []).map(async field => {
            const componentType = await this._resolveComponentType(field.type);
            return { ...field, componentType };
          }),
        );
        return {
          ...arr,
          itemSchema: { ...arr.itemSchema, fields: resolvedItemFields },
        };
      }),
    );
  }

  private async _resolveGroups(
    groups: GroupDefinition[],
    allFields: ResolvedField[],
    fieldIndex: Map<string, ResolvedField>,
  ): Promise<ResolvedGroup[]> {
    return Promise.all(
      groups.map(async g => {
        const fields = await this._resolveFields(g.fields, allFields, fieldIndex);
        return {
          id:               g.id,
          title:            g.title,
          columns:          g.columns,
          hiddenExpression: g.hiddenExpression,
          fields,
        };
      }),
    );
  }

  private async _resolveFields(
    defs: FieldDefinition[],
    allFields: ResolvedField[],
    fieldIndex: Map<string, ResolvedField>,
  ): Promise<ResolvedField[]> {
    return Promise.all(
      defs.map(async field => {
        const componentType = await this._resolveComponentType(field.type);
        const resolved: ResolvedField = { ...field, componentType };
        allFields.push(resolved);
        fieldIndex.set(field.key, resolved);
        return resolved;
      }),
    );
  }

  private async _resolveComponentType(
    fieldType: string,
  ): Promise<Type<unknown> | null> {
    const resolved = await this.componentResolver.resolveField(
      fieldType as ComponentFieldType,
    );
    return resolved ?? null;
  }
}
