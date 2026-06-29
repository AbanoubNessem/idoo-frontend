import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PlatformMarkdownFieldComponent } from '../fields/markdown-field/platform-markdown-field.component';

describe('PlatformMarkdownFieldComponent', () => {
  let component: PlatformMarkdownFieldComponent;
  let fixture: ComponentFixture<PlatformMarkdownFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformMarkdownFieldComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformMarkdownFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have componentKey platform-markdown-field', () => {
    expect(component.componentKey).toBe('platform-markdown-field');
  });

  it('should have fieldType markdown', () => {
    expect(component.fieldType).toBe('markdown');
  });

  it('should initialize with null value', () => {
    expect(component.value()).toBeNull();
  });

  it('should start in write tab', () => {
    expect((component as any).activeTab()).toBe('write');
  });

  it('should switch to preview tab', () => {
    (component as any).setTab('preview');
    expect((component as any).activeTab()).toBe('preview');
  });

  it('should render the editor textarea in write tab', () => {
    expect(fixture.nativeElement.querySelector('.pf-md-editor')).toBeTruthy();
  });

  it('should show toolbar actions in write tab', () => {
    const toolbarItems = fixture.nativeElement.querySelectorAll('.pf-md-toolbar button');
    expect(toolbarItems.length).toBeGreaterThan(0);
  });

  it('should apply formatting via applyFormatting', () => {
    component.value.set('Hello');
    (component as any).applyFormatting('**', '**');
    expect(component.value()).toContain('**text**');
  });

  it('should render preview HTML from markdown', () => {
    component.value.set('**bold** text');
    fixture.detectChanges();
    const html = (component as any).previewHtml();
    expect(html).toContain('<strong>bold</strong>');
  });

  it('should HTML-encode dangerous characters in preview', () => {
    component.value.set('<script>alert(1)</script>');
    fixture.detectChanges();
    const html = (component as any).previewHtml();
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should render skeleton', () => {
    fixture.componentRef.setInput('skeleton', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pf-skeleton-toolbar')).toBeTruthy();
  });

  it('should show hint', () => {
    fixture.componentRef.setInput('hint', 'Supports Markdown syntax');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Supports Markdown syntax');
  });

  it('should expose 6 toolbar actions', () => {
    const actions = (component as any).toolbarActions();
    expect(actions.length).toBe(6);
  });

  it('should not show toolbar in readonly mode', () => {
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pf-md-toolbar')).toBeFalsy();
  });
});
