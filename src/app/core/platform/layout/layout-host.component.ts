import {
  Component, ChangeDetectionStrategy, input, computed, effect, OnInit, OnDestroy,
  inject, signal,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { LayoutDefinition, LayoutContextData, ResolvedLayout } from './layout.types';
import { LayoutEngineService } from './layout-engine.service';
import { LayoutState } from './layout-state';
import { LayoutContext } from './layout-context';

@Component({
  selector: 'platform-layout-host',
  standalone: true,
  imports: [NgStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
  template: `
    @if (resolved()) {
      <div
        class="layout-host"
        [ngStyle]="hostStyle()"
        [class]="hostClass()"
        [attr.dir]="resolved()!.direction"
        [attr.data-layout]="definition().type"
        [attr.data-layout-id]="definition().id"
      >
        <ng-content />
      </div>
    }
  `,
})
export class LayoutHostComponent implements OnInit, OnDestroy {
  readonly definition = input.required<LayoutDefinition>();
  readonly context    = input<Partial<LayoutContextData>>({});
  readonly trackInstance = input(true);

  private readonly _engine = inject(LayoutEngineService);

  private readonly _state   = new LayoutState();
  private readonly _context = new LayoutContext();

  private readonly _resolved = signal<ResolvedLayout | null>(null);

  readonly resolved = this._resolved.asReadonly();

  readonly hostStyle = computed(() => {
    const r = this._resolved();
    if (!r) return {};
    return r.css as Record<string, string>;
  });

  readonly hostClass = computed(() => {
    const def = this.definition();
    return `layout-type-${def.type} layout-id-${def.id}`;
  });

  constructor() {
    effect(() => {
      const def     = this.definition();
      const partial = this.context();
      const snap    = this._context.snapshot();
      const merged: LayoutContextData = {
        breakpoint:  snap.breakpoint,
        device:      snap.device,
        orientation: snap.orientation,
        direction:   snap.direction,
        permissions: snap.permissions,
        model:       snap.model,
        ...partial,
      };
      this._resolved.set(this._engine.resolve(def, merged));
    });
  }

  ngOnInit(): void {
    if (this.trackInstance()) {
      try {
        this._engine.create(this.definition(), this.context());
      } catch {
        // already tracked — resolve-only path
      }
    }
  }

  ngOnDestroy(): void {
    if (this.trackInstance()) {
      this._engine.destroy(this.definition().id);
    }
  }

  get state(): LayoutState {
    return this._state;
  }

  get layoutContext(): LayoutContext {
    return this._context;
  }
}
