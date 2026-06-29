import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PlatformSelectFieldComponent } from '../fields/select-field/platform-select-field.component';
import { SelectOption } from '../component.types';

const OPTIONS: SelectOption[] = [
  { label: 'Alpha', value: 'alpha' },
  { label: 'Beta',  value: 'beta'  },
  { label: 'Gamma', value: 'gamma', disabled: true },
];

describe('PlatformSelectFieldComponent', () => {
  let component: PlatformSelectFieldComponent;
  let fixture: ComponentFixture<PlatformSelectFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformSelectFieldComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformSelectFieldComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', { options: OPTIONS });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have componentKey platform-select-field', () => {
    expect(component.componentKey).toBe('platform-select-field');
  });

  it('should have fieldType select', () => {
    expect(component.fieldType).toBe('select');
  });

  it('should initialize with null value', () => {
    expect(component.value()).toBeNull();
  });

  it('should expose options from config', () => {
    const opts = (component as any).options();
    expect(opts.length).toBe(3);
    expect(opts[0].label).toBe('Alpha');
  });

  it('should update value via handleSelectChange', () => {
    (component as any).handleSelectChange('beta');
    expect(component.value()).toBe('beta');
  });

  it('should render skeleton', () => {
    fixture.componentRef.setInput('skeleton', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pf-skeleton-wrap')).toBeTruthy();
  });

  it('should be disabled when disabled input is true', () => {
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

  it('should emit validationChange with invalid result when errors provided', (done) => {
    component.validationChange.subscribe(result => {
      expect(result.valid).toBeFalse();
      done();
    });
    fixture.componentRef.setInput('errors', ['Required']);
    fixture.detectChanges();
  });

  it('should show mat-select', () => {
    expect(fixture.nativeElement.querySelector('mat-select')).toBeTruthy();
  });

  it('should hide mat-form-field in skeleton mode', () => {
    fixture.componentRef.setInput('skeleton', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-form-field')).toBeFalsy();
  });
});
