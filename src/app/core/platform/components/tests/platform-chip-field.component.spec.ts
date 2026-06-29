import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PlatformChipFieldComponent } from '../fields/chip-field/platform-chip-field.component';
import { ChipValue } from '../component.types';

describe('PlatformChipFieldComponent', () => {
  let component: PlatformChipFieldComponent;
  let fixture: ComponentFixture<PlatformChipFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformChipFieldComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformChipFieldComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', { suggestions: ['Angular', 'TypeScript'], maxChips: 5 });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have componentKey platform-chip-field', () => {
    expect(component.componentKey).toBe('platform-chip-field');
  });

  it('should have fieldType chip', () => {
    expect(component.fieldType).toBe('chip');
  });

  it('should initialize with null value (empty chips)', () => {
    expect(component.value()).toBeNull();
    expect((component as any).chips().length).toBe(0);
  });

  it('should add a chip', () => {
    component.value.set([]);
    (component as any).addChip({ value: 'React', chipInput: { clear: () => {} } });
    const chips = component.value() as ChipValue[];
    expect(chips.length).toBe(1);
    expect(chips[0].value).toBe('React');
  });

  it('should not add duplicate chip', () => {
    component.value.set([{ value: 'Angular', removable: true }]);
    (component as any).addChip({ value: 'Angular', chipInput: { clear: () => {} } });
    expect((component.value() as ChipValue[]).length).toBe(1);
  });

  it('should not add chip when maxChips reached', () => {
    component.value.set([
      { value: 'a', removable: true },
      { value: 'b', removable: true },
      { value: 'c', removable: true },
      { value: 'd', removable: true },
      { value: 'e', removable: true },
    ]);
    (component as any).addChip({ value: 'f', chipInput: { clear: () => {} } });
    expect((component.value() as ChipValue[]).length).toBe(5);
  });

  it('should remove a chip', () => {
    component.value.set([{ value: 'Vue', removable: true }]);
    (component as any).removeChip({ value: 'Vue', removable: true });
    expect((component.value() as ChipValue[]).length).toBe(0);
  });

  it('should filter suggestions to exclude existing chips', () => {
    component.value.set([{ value: 'Angular', removable: true }]);
    const suggestions = (component as any).filteredSuggestions();
    expect(suggestions).not.toContain('Angular');
    expect(suggestions).toContain('TypeScript');
  });

  it('should add chip from suggestion', () => {
    component.value.set([]);
    (component as any).addFromSuggestion('TypeScript');
    const chips = component.value() as ChipValue[];
    expect(chips.some(c => c.value === 'TypeScript')).toBeTrue();
  });

  it('should render skeleton', () => {
    fixture.componentRef.setInput('skeleton', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pf-skeleton-chips')).toBeTruthy();
  });

  it('should show error messages', () => {
    fixture.componentRef.setInput('errors', ['Maximum tags exceeded']);
    fixture.detectChanges();
    expect(component.hasErrors()).toBeTrue();
  });
});
