import { LayoutState } from '../layout-state';

describe('LayoutState', () => {
  let state: LayoutState;

  beforeEach(() => { state = new LayoutState(); });

  it('initializes with defaults', () => {
    const snap = state.snapshot();
    expect(snap.activeTabIndex).toBe(0);
    expect(snap.openAccordionIds).toEqual([]);
    expect(snap.sidebarCollapsed).toBeFalse();
    expect(snap.splitterRatio).toBe(0.5);
    expect(snap.overlayOpen).toBeFalse();
  });

  it('activates a tab', () => {
    state.activateTab(2);
    expect(state.activeTabIndex()).toBe(2);
  });

  it('toggles accordion open/close', () => {
    state.toggleAccordion('panel-1');
    expect(state.openAccordionIds()).toContain('panel-1');
    state.toggleAccordion('panel-1');
    expect(state.openAccordionIds()).not.toContain('panel-1');
  });

  it('openAccordion is idempotent', () => {
    state.openAccordion('p1');
    state.openAccordion('p1');
    expect(state.openAccordionIds().filter(x => x === 'p1').length).toBe(1);
  });

  it('closeAccordion removes the id', () => {
    state.openAccordion('p2');
    state.closeAccordion('p2');
    expect(state.openAccordionIds()).not.toContain('p2');
  });

  it('toggles sidebar', () => {
    state.toggleSidebar();
    expect(state.sidebarCollapsed()).toBeTrue();
    state.toggleSidebar();
    expect(state.sidebarCollapsed()).toBeFalse();
  });

  it('clamps splitter ratio to [0,1]', () => {
    state.setSplitterRatio(1.5);
    expect(state.splitterRatio()).toBe(1);
    state.setSplitterRatio(-0.2);
    expect(state.splitterRatio()).toBe(0);
  });

  it('hides and shows slots', () => {
    state.hideSlot('field-a');
    expect(state.hiddenSlotIds()).toContain('field-a');
    state.showSlot('field-a');
    expect(state.hiddenSlotIds()).not.toContain('field-a');
  });

  it('reset() returns to defaults', () => {
    state.activateTab(3);
    state.openAccordion('x');
    state.toggleSidebar();
    state.reset();
    const snap = state.snapshot();
    expect(snap.activeTabIndex).toBe(0);
    expect(snap.openAccordionIds).toEqual([]);
    expect(snap.sidebarCollapsed).toBeFalse();
  });
});
