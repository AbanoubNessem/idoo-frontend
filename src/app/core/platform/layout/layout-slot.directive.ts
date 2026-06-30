import {
  Directive, input, computed, effect, inject, ElementRef, Renderer2,
  ChangeDetectorRef,
} from '@angular/core';
import { LayoutEngineService } from './layout-engine.service';
import { LayoutContextData } from './layout.types';

@Directive({
  selector: '[platformLayoutSlot]',
  standalone: true,
})
export class LayoutSlotDirective {
  readonly platformLayoutSlot = input.required<string>();
  readonly layoutId           = input<string>('');
  readonly slotContext        = input<Partial<LayoutContextData>>({});

  private readonly _engine   = inject(LayoutEngineService);
  private readonly _el       = inject(ElementRef<HTMLElement>);
  private readonly _renderer = inject(Renderer2);

  constructor() {
    effect(() => {
      const slotId   = this.platformLayoutSlot();
      const layoutId = this.layoutId();
      if (!layoutId) return;

      const instance = this._engine.getInstance(layoutId);
      const resolved = instance?.resolved;
      if (!resolved) return;

      const slot = resolved.slots.find(s => s.id === slotId);
      if (!slot) return;

      const el: HTMLElement = this._el.nativeElement;

      if (slot.hidden) {
        this._renderer.setStyle(el, 'display', 'none');
        return;
      } else {
        this._renderer.removeStyle(el, 'display');
      }

      for (const [prop, val] of Object.entries(slot.css)) {
        this._renderer.setStyle(el, prop, val);
      }
      this._renderer.setStyle(el, 'order', String(slot.order));
    });
  }
}
