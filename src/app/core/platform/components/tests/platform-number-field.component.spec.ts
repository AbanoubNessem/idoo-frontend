import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PlatformNumberFieldComponent } from '../fields/number-field/platform-number-field.component';

describe('PlatformNumberFieldComponent', () => {
  let component: PlatformNumberFieldComponent;
  let fixture: ComponentFixture<PlatformNumberFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformNumberFieldComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformNumberFieldComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', { min: 0, max: 100, step: 1 });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have fieldType number', () => {
    expect(component.fieldType).toBe('number');
  });

  it('should initialize with null value', () => {
    expect(component.value()).toBeNull();
  });

  it('should parse numeric input', () => {
    const event = { target: { value: '42' } } as unknown as Event;
    (component as any).handleNumberInput(event);
    expect(component.value()).toBe(42);
  });

  it('should set null for empty string input', () => {
    component.value.set(10);
    const event = { target: { value: '' } } as unknown as Event;
    (component as any).handleNumberInput(event);
    expect(component.value()).toBeNull();
  });

  it('should expose min/max from config', () => {
    const cfg = (component as any).numConfig();
    expect(cfg.min).toBe(0);
    expect(cfg.max).toBe(100);
  });

  it('should render skeleton', () => {
    fixture.componentRef.setInput('skeleton', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pf-skeleton-wrap')).toBeTruthy();
  });

  it('should show errors', () => {
    fixture.componentRef.setInput('errors', ['Value too large']);
    fixture.detectChanges();
    expect(component.hasErrors()).toBeTrue();
  });

  it('should be disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.isDisabled()).toBeTrue();
  });

  it('should emit blur', () => {
    let fired = false;
    component.blur.subscribe(() => fired = true);
    (component as any).onBlur();
    expect(fired).toBeTrue();
  });
});
