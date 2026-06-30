import { Injectable } from '@angular/core';
import {
  LayoutDefinition, LayoutType, LayoutConfig, LayoutSlotDefinition,
  LayoutCondition, LayoutTokenOverrides, LayoutDirection,
  Breakpoint, LayoutDefinitionBuilder,
} from './layout.types';

class LayoutDefinitionBuilderImpl implements LayoutDefinitionBuilder {
  private _slots: LayoutSlotDefinition[] = [];
  private _children: LayoutDefinition[] = [];
  private _config: LayoutConfig = {};
  private _responsive: Partial<Record<Breakpoint, Partial<LayoutDefinition>>> = {};
  private _conditions: LayoutCondition[] = [];
  private _tokens: LayoutTokenOverrides = {};
  private _direction: LayoutDirection | undefined;
  private _hidden = false;

  constructor(
    private readonly _id: string,
    private readonly _type: LayoutType,
    private readonly _label?: string,
  ) {}

  slot(def: Partial<LayoutSlotDefinition> & { id: string }): this {
    this._slots.push({ order: 0, hidden: false, ...def });
    return this;
  }

  child(child: LayoutDefinition): this {
    this._children.push(child);
    return this;
  }

  config(cfg: LayoutConfig): this {
    this._config = { ...this._config, ...cfg };
    return this;
  }

  responsive(bp: Breakpoint, overrides: Partial<LayoutDefinition>): this {
    this._responsive[bp] = { ...(this._responsive[bp] ?? {}), ...overrides };
    return this;
  }

  condition(cond: LayoutCondition): this {
    this._conditions.push(cond);
    return this;
  }

  tokens(t: LayoutTokenOverrides): this {
    this._tokens = { ...this._tokens, ...t };
    return this;
  }

  direction(dir: LayoutDirection): this {
    this._direction = dir;
    return this;
  }

  hidden(h = true): this {
    this._hidden = h;
    return this;
  }

  build(): LayoutDefinition {
    return {
      id:         this._id,
      type:       this._type,
      label:      this._label,
      slots:      this._slots.length ? [...this._slots] : undefined,
      children:   this._children.length ? [...this._children] : undefined,
      config:     Object.keys(this._config).length ? this._config : undefined,
      responsive: Object.keys(this._responsive).length ? this._responsive : undefined,
      conditions: this._conditions.length ? [...this._conditions] : undefined,
      tokens:     Object.keys(this._tokens).length ? this._tokens : undefined,
      direction:  this._direction,
      hidden:     this._hidden || undefined,
    };
  }
}

@Injectable({ providedIn: 'root' })
export class LayoutBuilderService {
  create(id: string, type: LayoutType, label?: string): LayoutDefinitionBuilder {
    return new LayoutDefinitionBuilderImpl(id, type, label);
  }

  grid(id: string, columns?: number, label?: string): LayoutDefinitionBuilder {
    const b = this.create(id, 'grid', label);
    if (columns !== undefined) b.config({ grid: { columns } });
    return b;
  }

  flex(id: string, label?: string): LayoutDefinitionBuilder {
    return this.create(id, 'flex', label);
  }

  stack(id: string, label?: string): LayoutDefinitionBuilder {
    return this.create(id, 'stack', label);
  }

  tabs(id: string, label?: string): LayoutDefinitionBuilder {
    return this.create(id, 'tabs', label);
  }

  accordion(id: string, label?: string): LayoutDefinitionBuilder {
    return this.create(id, 'accordion', label);
  }

  sidebar(id: string, label?: string): LayoutDefinitionBuilder {
    return this.create(id, 'sidebar', label);
  }

  sections(id: string, label?: string): LayoutDefinitionBuilder {
    return this.create(id, 'sections', label);
  }
}
