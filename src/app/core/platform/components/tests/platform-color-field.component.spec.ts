import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PlatformColorFieldComponent } from '../fields/color-field/platform-color-field.component';

describe('PlatformColorFieldComponent', () => {
  let component: PlatformColorFieldComponent;
  let fixture: ComponentFixture<PlatformColorFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformColorFieldComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformColorFieldComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', { format: 'hex', presets: ['#ff0000', '#00ff00', '#0000ff'] });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have componentKey platform-color-field', () => {
    expect(component.componentKey).toBe('platform-color-field');
  });

  it('should have fieldType color', () => {
    expect(component.fieldType).toBe('color');
  });

  it('should initialize with null value', () => {
    expect(component.value()).toBeNull();
  });

  it('should expose presets from config', () => {
    const presets = (component as any).colorPresets();
    expect(presets).toContain('#ff0000');
    expect(presets.length).toBe(3);
  });

  it('should update value on color input', () => {
    const event = { target: { value: '#abc123' } } as unknown as Event;
    (component as any).onColorInput(event);
    expect(component.value()).toBe('#abc123');
  });

  it('should select a preset color', () => {
    (component as any).selectPreset('#00ff00');
    expect(component.value()).toBe('#00ff00');
  });

  it('should not select preset when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    (component as any).selectPreset('#ff0000');
    expect(component.value()).toBeNull();
  });

  it('should not select preset when readonly', () => {
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    (component as any).selectPreset('#ff0000');
    expect(component.value()).toBeNull();
  });

  it('should render skeleton', () => {
    fixture.componentRef.setInput('skeleton', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pf-skeleton-swatch')).toBeTruthy();
  });

  it('should have correct hex pattern constant', () => {
    expect(component.hexPattern).toBe('^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$');
  });

  it('should update value via handleTextInput', () => {
    const event = { target: { value: '#123456' } } as unknown as Event;
    (component as any).handleTextInput(event);
    expect(component.value()).toBe('#123456');
  });
});
