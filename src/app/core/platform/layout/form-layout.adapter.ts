import { Injectable, inject } from '@angular/core';
import {
  LayoutDefinition, LayoutConfig, LayoutSlotDefinition, LayoutType,
  LayoutDefinitionBuilder,
} from './layout.types';
import { LayoutBuilderService } from './layout-builder.service';
import {
  FormDefinition, SectionDefinition, SectionLayout,
} from '../forms/form.types';

@Injectable({ providedIn: 'root' })
export class FormLayoutAdapter {
  private readonly _builder = inject(LayoutBuilderService);

  toLayoutDefinition(form: FormDefinition): LayoutDefinition {
    switch (form.layout) {
      case 'simple':    return this._buildSimple(form);
      case 'sections':  return this._buildSections(form);
      case 'tabs':      return this._buildTabs(form);
      case 'accordion': return this._buildAccordion(form);
      case 'wizard':    return this._buildWizard(form);
    }
  }

  sectionToLayoutDefinition(section: SectionDefinition): LayoutDefinition {
    return this._builder
      .create(`section-${section.id}`, this._sectionLayoutType(section.layout), section.title)
      .config(this._sectionConfig(section))
      .build();
  }

  // ─── Form-level builders ──────────────────────────────────────────────────

  private _buildSimple(form: FormDefinition): LayoutDefinition {
    const b = this._builder
      .create(form.id, 'stack', form.title)
      .config({ flex: { direction: 'column', gap: 'var(--platform-spacing-4)' } });

    this._addSectionSlots(b, form.sections ?? []);
    return b.build();
  }

  private _buildSections(form: FormDefinition): LayoutDefinition {
    const b = this._builder
      .create(form.id, 'sections', form.title)
      .config({ flex: { direction: 'column', gap: 'var(--platform-spacing-6)' } });

    this._addSectionSlots(b, form.sections ?? []);
    return b.build();
  }

  private _buildTabs(form: FormDefinition): LayoutDefinition {
    const b = this._builder
      .create(form.id, 'tabs', form.title)
      .config({
        tabs: {
          variant: 'underline',
          position: 'top',
          animated: true,
        },
      });

    for (const [i, tab] of (form.tabs ?? []).entries()) {
      b.slot({ id: `tab-${tab.id}`, label: tab.title, order: tab.order ?? i });
    }
    return b.build();
  }

  private _buildAccordion(form: FormDefinition): LayoutDefinition {
    const b = this._builder
      .create(form.id, 'accordion', form.title)
      .config({ accordion: { multi: true, animated: true } });

    this._addSectionSlots(b, form.sections ?? []);
    return b.build();
  }

  private _buildWizard(form: FormDefinition): LayoutDefinition {
    const b = this._builder
      .create(form.id, 'sections', form.title)
      .config({ flex: { direction: 'column', gap: 'var(--platform-spacing-6)' } });

    for (const [i, step] of (form.steps ?? []).entries()) {
      b.slot({ id: `step-${step.id}`, label: step.title, order: step.order ?? i });
    }
    return b.build();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _addSectionSlots(
    builder: LayoutDefinitionBuilder,
    sections: ReadonlyArray<SectionDefinition>,
  ): void {
    for (const [i, s] of sections.entries()) {
      builder.slot({ id: `section-${s.id}`, label: s.title, order: s.order ?? i });
    }
  }

  private _sectionLayoutType(layout: SectionLayout): LayoutType {
    switch (layout) {
      case 'grid':  return 'grid';
      case 'flex':  return 'flex';
      case 'stack': return 'stack';
    }
  }

  private _sectionConfig(section: SectionDefinition): LayoutConfig {
    switch (section.layout) {
      case 'grid':
        return { grid: { columns: section.columns, gap: 'var(--platform-spacing-4)' } };
      case 'flex':
        return { flex: { direction: 'row', wrap: true, gap: 'var(--platform-spacing-4)' } };
      case 'stack':
        return { flex: { direction: 'column', gap: 'var(--platform-spacing-3)' } };
    }
  }
}
