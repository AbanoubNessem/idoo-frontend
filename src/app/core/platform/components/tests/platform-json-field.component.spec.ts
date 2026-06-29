import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PlatformJsonFieldComponent } from '../fields/json-field/platform-json-field.component';

describe('PlatformJsonFieldComponent', () => {
  let component: PlatformJsonFieldComponent;
  let fixture: ComponentFixture<PlatformJsonFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformJsonFieldComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformJsonFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have componentKey platform-json-field', () => {
    expect(component.componentKey).toBe('platform-json-field');
  });

  it('should have fieldType json', () => {
    expect(component.fieldType).toBe('json');
  });

  it('should initialize with null value', () => {
    expect(component.value()).toBeNull();
  });

  it('should parse valid JSON input', () => {
    const event = { target: { value: '{"key": "value"}' } } as unknown as Event;
    (component as any).onJsonInput(event);
    expect(component.value()).toEqual({ key: 'value' });
    expect((component as any)._parseError()).toBeNull();
  });

  it('should set parse error on invalid JSON', () => {
    const event = { target: { value: 'not json' } } as unknown as Event;
    (component as any).onJsonInput(event);
    expect((component as any)._parseError()).toBeTruthy();
    expect(component.value()).toBeNull();
  });

  it('should clear value and error on empty input', () => {
    component.value.set({ a: 1 });
    const event = { target: { value: '' } } as unknown as Event;
    (component as any).onJsonInput(event);
    expect(component.value()).toBeNull();
    expect((component as any)._parseError()).toBeNull();
  });

  it('should render the editor textarea', () => {
    expect(fixture.nativeElement.querySelector('.pf-json-editor')).toBeTruthy();
  });

  it('should render skeleton when skeleton is true', () => {
    fixture.componentRef.setInput('skeleton', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pf-skeleton-editor')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.pf-json-editor')).toBeFalsy();
  });

  it('should display parse error message in DOM', () => {
    const event = { target: { value: 'bad{json' } } as unknown as Event;
    (component as any).onJsonInput(event);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pf-parse-error')).toBeTruthy();
  });

  it('should show hint text', () => {
    fixture.componentRef.setInput('hint', 'Enter valid JSON');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Enter valid JSON');
  });

  it('should show error text', () => {
    fixture.componentRef.setInput('errors', ['Invalid configuration']);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Invalid configuration');
  });

  it('should produce correct rawText from value', () => {
    component.value.set({ foo: 'bar' });
    fixture.detectChanges();
    const raw = (component as any).rawText();
    expect(raw).toContain('"foo"');
    expect(raw).toContain('"bar"');
  });

  it('should have disabled textarea when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.pf-json-editor');
    expect(textarea?.disabled).toBeTrue();
  });
});
