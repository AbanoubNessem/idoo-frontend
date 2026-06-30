import { signal, computed, Signal } from '@angular/core';
import { LayoutStateData } from './layout.types';

export class LayoutState {
  private readonly _activeTabIndex    = signal(0);
  private readonly _openAccordionIds  = signal<ReadonlyArray<string>>([]);
  private readonly _sidebarCollapsed  = signal(false);
  private readonly _splitterRatio     = signal(0.5);
  private readonly _overlayOpen       = signal(false);
  private readonly _hiddenSlotIds     = signal<ReadonlyArray<string>>([]);
  private readonly _slotOrder         = signal<ReadonlyArray<string>>([]);

  readonly activeTabIndex:   Signal<number>                  = this._activeTabIndex.asReadonly();
  readonly openAccordionIds: Signal<ReadonlyArray<string>>   = this._openAccordionIds.asReadonly();
  readonly sidebarCollapsed: Signal<boolean>                 = this._sidebarCollapsed.asReadonly();
  readonly splitterRatio:    Signal<number>                  = this._splitterRatio.asReadonly();
  readonly overlayOpen:      Signal<boolean>                 = this._overlayOpen.asReadonly();
  readonly hiddenSlotIds:    Signal<ReadonlyArray<string>>   = this._hiddenSlotIds.asReadonly();
  readonly slotOrder:        Signal<ReadonlyArray<string>>   = this._slotOrder.asReadonly();

  readonly snapshot: Signal<LayoutStateData> = computed(() => ({
    activeTabIndex:   this._activeTabIndex(),
    openAccordionIds: this._openAccordionIds(),
    sidebarCollapsed: this._sidebarCollapsed(),
    splitterRatio:    this._splitterRatio(),
    overlayOpen:      this._overlayOpen(),
    hiddenSlotIds:    this._hiddenSlotIds(),
    slotOrder:        this._slotOrder(),
  }));

  activateTab(index: number): void {
    this._activeTabIndex.set(index);
  }

  toggleAccordion(id: string): void {
    this._openAccordionIds.update(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id],
    );
  }

  openAccordion(id: string): void {
    this._openAccordionIds.update(ids => ids.includes(id) ? ids : [...ids, id]);
  }

  closeAccordion(id: string): void {
    this._openAccordionIds.update(ids => ids.filter(x => x !== id));
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this._sidebarCollapsed.set(collapsed);
  }

  toggleSidebar(): void {
    this._sidebarCollapsed.update(c => !c);
  }

  setSplitterRatio(ratio: number): void {
    this._splitterRatio.set(Math.max(0, Math.min(1, ratio)));
  }

  setOverlayOpen(open: boolean): void {
    this._overlayOpen.set(open);
  }

  hideSlot(id: string): void {
    this._hiddenSlotIds.update(ids => ids.includes(id) ? ids : [...ids, id]);
  }

  showSlot(id: string): void {
    this._hiddenSlotIds.update(ids => ids.filter(x => x !== id));
  }

  setSlotOrder(order: ReadonlyArray<string>): void {
    this._slotOrder.set(order);
  }

  reset(): void {
    this._activeTabIndex.set(0);
    this._openAccordionIds.set([]);
    this._sidebarCollapsed.set(false);
    this._splitterRatio.set(0.5);
    this._overlayOpen.set(false);
    this._hiddenSlotIds.set([]);
    this._slotOrder.set([]);
  }
}
