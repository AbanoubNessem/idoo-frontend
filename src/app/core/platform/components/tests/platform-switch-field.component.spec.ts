import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PlatformSwitchFieldComponent } from '../fields/switch-field/platform-switch-field.component';

describe('PlatformSwitchFieldComponent', () => {
  let component: PlatformSwitchFieldComponent;
  let fixture: ComponentFixture<PlatformSwitchFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformSwitchFieldComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformSwitchFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have componentKey platform-switch-field', () => {
    expect(component.componentKey).toBe('platform-switch-field');
  });

  it('should have fieldType switch', () => {
    expect(component.fieldType).toBe('switch');
  });

  it('should initialize with null value', () => {
    expect(component.value()).toBeNull();
  });

  it('should toggle on', () => {
    (component as any).onToggleChange({ checked: true });
    expect(component.value()).toBeTrue();
  });

  it('should toggle off', () => {
    component.value.set(true);
    (component as any).onToggleChange({ checked: false });
    expect(component.value()).toBeFalse();
  });

  it('should show label', () => {
    fixture.componentRef.setInput('label', 'Enable Notifications');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Enable Notifications');
  });

  it('should show hint', () => {
    fixture.componentRef.setInput('hint', 'Send email alerts');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Send email alerts');
  });

  it('should show errors', () => {
    fixture.componentRef.setInput('errors', ['This is required']);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This is required');
  });

  it('should render skeleton toggle', () => {
    fixture.componentRef.setInput('skeleton', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pf-skeleton-track')).toBeTruthy();
  });

  it('should be disabled when disabled=true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.isDisabled()).toBeTrue();
  });

  it('should validate as valid when no errors', () => {
    expect(component.validate().valid).toBeTrue();
  });
});
