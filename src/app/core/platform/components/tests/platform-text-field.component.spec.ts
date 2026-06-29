import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PlatformTextFieldComponent } from '../fields/text-field/platform-text-field.component';

describe('PlatformTextFieldComponent', () => {
  let component: PlatformTextFieldComponent;
  let fixture: ComponentFixture<PlatformTextFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformTextFieldComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformTextFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct componentKey', () => {
    expect(component.componentKey).toBe('platform-text-field');
  });

  it('should have correct fieldType', () => {
    expect(component.fieldType).toBe('text');
  });

  it('should initialize with null value', () => {
    expect(component.value()).toBeNull();
  });

  it('should render label input', () => {
    fixture.componentRef.setInput('label', 'Full Name');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Full Name');
  });

  it('should render skeleton when skeleton is true', () => {
    fixture.componentRef.setInput('skeleton', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.pf-skeleton-wrap')).toBeTruthy();
  });

  it('should not render mat-form-field when skeleton is true', () => {
    fixture.componentRef.setInput('skeleton', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('mat-form-field')).toBeFalsy();
  });

  it('should render mat-form-field when skeleton is false', () => {
    fixture.componentRef.setInput('skeleton', false);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('mat-form-field')).toBeTruthy();
  });

  it('should report hasErrors as false when errors is empty', () => {
    fixture.componentRef.setInput('errors', []);
    fixture.detectChanges();
    expect(component.hasErrors()).toBeFalse();
  });

  it('should report hasErrors as true when errors are provided', () => {
    fixture.componentRef.setInput('errors', ['Required field']);
    fixture.detectChanges();
    expect(component.hasErrors()).toBeTrue();
  });

  it('should compute isDisabled from disabled input', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.isDisabled()).toBeTrue();
  });

  it('should compute isDisabled as false by default', () => {
    expect(component.isDisabled()).toBeFalse();
  });

  it('should emit blur event', () => {
    let emitted = false;
    component.blur.subscribe(() => emitted = true);
    (component as any).onBlur();
    expect(emitted).toBeTrue();
  });

  it('should emit focus event', () => {
    let emitted = false;
    component.focus.subscribe(() => emitted = true);
    (component as any).onFocus();
    expect(emitted).toBeTrue();
  });

  it('should update value on text input', () => {
    const event = { target: { value: 'hello' } } as unknown as Event;
    (component as any).handleTextInput(event);
    expect(component.value()).toBe('hello');
  });

  it('should produce valid fieldId', () => {
    fixture.componentRef.setInput('fieldKey', 'name');
    fixture.detectChanges();
    expect(component.fieldId()).toBe('pf-name');
  });

  it('should produce valid hintId', () => {
    fixture.componentRef.setInput('fieldKey', 'name');
    fixture.detectChanges();
    expect(component.hintId()).toBe('pf-hint-name');
  });

  it('should return valid validationResult', () => {
    fixture.componentRef.setInput('errors', []);
    fixture.detectChanges();
    const result = component.validate();
    expect(result.valid).toBeTrue();
    expect(result.errors).toEqual([]);
  });

  it('should return invalid validationResult when errors exist', () => {
    fixture.componentRef.setInput('errors', ['Must not be blank']);
    fixture.detectChanges();
    const result = component.validate();
    expect(result.valid).toBeFalse();
    expect(result.errors.length).toBe(1);
  });
});
