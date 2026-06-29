import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PlatformCheckboxFieldComponent } from '../fields/checkbox-field/platform-checkbox-field.component';

describe('PlatformCheckboxFieldComponent', () => {
  let component: PlatformCheckboxFieldComponent;
  let fixture: ComponentFixture<PlatformCheckboxFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformCheckboxFieldComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformCheckboxFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have componentKey platform-checkbox-field', () => {
    expect(component.componentKey).toBe('platform-checkbox-field');
  });

  it('should have fieldType checkbox', () => {
    expect(component.fieldType).toBe('checkbox');
  });

  it('should initialize with null value', () => {
    expect(component.value()).toBeNull();
  });

  it('should update value on check change (true)', () => {
    (component as any).onCheckChange({ checked: true });
    expect(component.value()).toBeTrue();
  });

  it('should update value on check change (false)', () => {
    component.value.set(true);
    (component as any).onCheckChange({ checked: false });
    expect(component.value()).toBeFalse();
  });

  it('should show label text', () => {
    fixture.componentRef.setInput('label', 'Accept Terms');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Accept Terms');
  });

  it('should render skeleton', () => {
    fixture.componentRef.setInput('skeleton', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pf-skeleton-checkbox-row')).toBeTruthy();
  });

  it('should show error messages', () => {
    fixture.componentRef.setInput('errors', ['You must accept the terms']);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('You must accept the terms');
  });

  it('should show hint', () => {
    fixture.componentRef.setInput('hint', 'Required for registration');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Required for registration');
  });

  it('should be disabled via disabled input', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.isDisabled()).toBeTrue();
  });

  it('should validate as valid when no errors', () => {
    expect(component.validate().valid).toBeTrue();
  });

  it('should validate as invalid when errors provided', () => {
    fixture.componentRef.setInput('errors', ['Required']);
    fixture.detectChanges();
    expect(component.validate().valid).toBeFalse();
  });
});
