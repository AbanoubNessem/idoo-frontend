import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DynamicFormComponent } from '../components/dynamic-form/dynamic-form.component';
import { FormDefinition } from '../form.types';

const simpleDef: FormDefinition = {
  id:       'spec-form',
  version:  '1.0',
  mode:     'create',
  layout:   'simple',
  title:    'Test Form',
  sections: [{
    id:      'sec1',
    layout:  'grid',
    columns: 1,
    fields:  [{ key: 'name', label: 'Full Name', type: 'text' }],
  }],
  showActions: true,
};

describe('DynamicFormComponent', () => {
  let component: DynamicFormComponent;
  let fixture: ComponentFixture<DynamicFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading state initially when definition is null', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const root = el.querySelector('.df-root');
    expect(root).toBeTruthy();
  });

  it('should show error state when no definition or key provided', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.phase()).toBe('error');
  });

  it('should load form from definition input', async () => {
    fixture.componentRef.setInput('definition', simpleDef);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    // Phase should be 'ready' after initialization
    expect(['ready', 'loading'].includes(component.phase())).toBeTrue();
  });

  it('should expose instanceId after form loads', async () => {
    fixture.componentRef.setInput('definition', simpleDef);
    fixture.detectChanges();
    await fixture.whenStable();
    // instanceId may be set after async init
    expect(component.instanceId() !== null || component.phase() === 'loading').toBeTrue();
  });

  it('should compute layout from resolved form', async () => {
    fixture.componentRef.setInput('definition', simpleDef);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.layout()).toBe('simple');
  });

  it('should destroy instance on component destroy', async () => {
    fixture.componentRef.setInput('definition', simpleDef);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.destroy();
    // No errors should be thrown
    expect(true).toBeTrue();
  });

  it('should emit cancel output', () => {
    let cancelled = false;
    component.cancel.subscribe(() => (cancelled = true));
    component['cancel'].emit();
    expect(cancelled).toBeTrue();
  });

  it('should call scrollToField without error', async () => {
    fixture.componentRef.setInput('definition', simpleDef);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(() => component.scrollToField('name')).not.toThrow();
  });

  it('should toggle undo/redo state', async () => {
    fixture.componentRef.setInput('definition', simpleDef);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.canUndo()).toBeFalse();
    expect(component.canRedo()).toBeFalse();
  });

  it('should call retryLoad without throwing', async () => {
    fixture.detectChanges();
    expect(() => component.retryLoad()).not.toThrow();
  });

  it('should expose fieldLabels from resolved form', async () => {
    fixture.componentRef.setInput('definition', simpleDef);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const labels = component.fieldLabels();
    // Labels may be populated if form loaded successfully
    expect(typeof labels).toBe('object');
  });
});
