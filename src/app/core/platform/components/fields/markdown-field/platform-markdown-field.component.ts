import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseFieldComponent } from '../../base/base-field.component';
import { ComponentFieldType, MarkdownFieldConfig } from '../../component.types';

type MarkdownTab = 'write' | 'preview';

@Component({
  selector: 'platform-markdown-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatProgressSpinnerModule, MatButtonModule, MatTooltipModule],
  template: `
    <div
      class="pf-field-host"
      [class.pf-skeleton]="skeleton()"
      [class.pf-loading]="loading()"
      [class.pf-disabled]="isDisabled()"
      [class.pf-readonly]="readonly()"
      [class.pf-has-error]="hasErrors()"
      [attr.data-density]="effectiveDensity()"
    >
      @if (skeleton()) {
        <div class="pf-skeleton-wrap" role="status" aria-label="Loading field">
          <div class="pf-skeleton-toolbar"></div>
          <div class="pf-skeleton-editor"></div>
        </div>
      } @else {
        <div class="pf-md-container" [class.pf-md--error]="hasErrors()">
          <div class="pf-md-header">
            <label class="pf-md-label" [attr.for]="fieldId()">
              {{ label() }}@if (required()) {<span class="pf-required" aria-hidden="true"> *</span>}
            </label>
            <div class="pf-md-tabs" role="tablist" [attr.aria-label]="'Editor mode'">
              <button
                type="button"
                class="pf-md-tab"
                [class.pf-md-tab--active]="activeTab() === 'write'"
                role="tab"
                [attr.aria-selected]="activeTab() === 'write'"
                (click)="setTab('write')"
              >Write</button>
              @if (mdConfig().preview !== false) {
                <button
                  type="button"
                  class="pf-md-tab"
                  [class.pf-md-tab--active]="activeTab() === 'preview'"
                  role="tab"
                  [attr.aria-selected]="activeTab() === 'preview'"
                  (click)="setTab('preview')"
                >Preview</button>
              }
            </div>
            @if (loading()) {
              <mat-progress-spinner diameter="20" mode="indeterminate" aria-hidden="true"/>
            }
          </div>
          @if (!isDisabled() && !readonly() && activeTab() === 'write') {
            <div class="pf-md-toolbar" role="toolbar" [attr.aria-label]="'Formatting toolbar'">
              @for (action of toolbarActions(); track action.icon) {
                <button
                  type="button"
                  mat-icon-button
                  [attr.aria-label]="action.label"
                  [matTooltip]="action.label"
                  (click)="applyFormatting(action.prefix, action.suffix)"
                ><mat-icon>{{ action.icon }}</mat-icon></button>
              }
            </div>
          }
          <div class="pf-md-body" [style.height]="mdConfig().height ?? '240px'">
            @if (activeTab() === 'write') {
              <textarea
                [id]="fieldId()"
                #editorEl
                class="pf-md-editor"
                [value]="value() ?? ''"
                [disabled]="isDisabled()"
                [readOnly]="readonly()"
                [placeholder]="placeholder() || 'Write Markdown here...'"
                [attr.aria-label]="effectiveAriaLabel()"
                [attr.aria-required]="required()"
                [attr.aria-invalid]="hasErrors()"
                [attr.aria-describedby]="hasErrors() ? errorId() : (hint() ? hintId() : null)"
                (input)="handleTextInput($event)"
                (blur)="onBlur()"
                (focus)="onFocus()"
              ></textarea>
            } @else {
              <div
                class="pf-md-preview"
                [innerHTML]="previewHtml()"
                [attr.aria-label]="'Markdown preview'"
              ></div>
            }
          </div>
          @if (hint()) { <div class="pf-hint" [id]="hintId()">{{ hint() }}</div> }
          @for (e of errors(); track $index) {
            <div class="pf-error" [id]="$index === 0 ? errorId() : null" role="alert">{{ e }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .pf-md-container { border: 1px solid var(--platform-color-border, #e2e8f0); border-radius: var(--platform-border-radius-md, 6px); overflow: hidden; }
    .pf-md-container.pf-md--error { border-color: var(--platform-color-error, #ef4444); }
    .pf-md-header { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-bottom: 1px solid var(--platform-color-border, #e2e8f0); background: var(--platform-color-surface-variant, #f8fafc); }
    .pf-md-label { font-size: 0.875rem; font-weight: 500; color: var(--platform-color-text-primary, #1e293b); flex: 1; }
    .pf-md-tabs { display: flex; gap: 4px; }
    .pf-md-tab { background: none; border: 1px solid transparent; border-radius: 4px; padding: 4px 12px; font-size: 0.8125rem; cursor: pointer; color: var(--platform-color-text-secondary, #64748b); transition: all 0.15s; }
    .pf-md-tab--active { background: var(--platform-color-surface, #fff); border-color: var(--platform-color-border, #e2e8f0); color: var(--platform-color-text-primary, #1e293b); font-weight: 500; }
    .pf-md-toolbar { display: flex; padding: 4px 8px; border-bottom: 1px solid var(--platform-color-border, #e2e8f0); background: var(--platform-color-surface, #fff); }
    .pf-md-body { display: flex; flex-direction: column; }
    .pf-md-editor { flex: 1; width: 100%; height: 100%; padding: 12px; resize: none; border: none; outline: none; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 0.875rem; line-height: 1.6; background: var(--platform-color-surface, #fff); color: var(--platform-color-text-primary, #1e293b); box-sizing: border-box; }
    .pf-md-editor:disabled { opacity: 0.38; cursor: not-allowed; }
    .pf-md-preview { padding: 12px; height: 100%; overflow: auto; box-sizing: border-box; line-height: 1.6; color: var(--platform-color-text-primary, #1e293b); }
    .pf-hint { font-size: 0.75rem; color: var(--platform-color-text-secondary, #64748b); padding: 4px 12px; }
    .pf-error { font-size: 0.75rem; color: var(--platform-color-error, #ef4444); padding: 4px 12px; }
    .pf-required { color: var(--platform-color-error, #ef4444); margin-left: 2px; }
    .pf-skeleton-wrap { display: flex; flex-direction: column; gap: 0; }
    .pf-skeleton-toolbar { height: 40px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s infinite linear; }
    .pf-skeleton-editor { height: 200px; background: var(--platform-color-surface-variant, #e2e8f0); opacity: 0.6; animation: pf-shimmer 1.5s 0.1s infinite linear; }
    @keyframes pf-shimmer { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  `],
})
export class PlatformMarkdownFieldComponent extends BaseFieldComponent<string> {
  override readonly componentKey = 'platform-markdown-field';
  override readonly fieldType: ComponentFieldType = 'markdown';

  protected readonly activeTab = signal<MarkdownTab>('write');

  protected mdConfig(): MarkdownFieldConfig { return this.config() as MarkdownFieldConfig; }

  protected toolbarActions = computed(() => [
    { icon: 'format_bold',   label: 'Bold',          prefix: '**', suffix: '**' },
    { icon: 'format_italic', label: 'Italic',         prefix: '_',  suffix: '_'  },
    { icon: 'title',         label: 'Heading',        prefix: '## ', suffix: '' },
    { icon: 'format_list_bulleted', label: 'List',   prefix: '- ',  suffix: '' },
    { icon: 'code',          label: 'Code',           prefix: '`',  suffix: '`'  },
    { icon: 'link',          label: 'Link',           prefix: '[',  suffix: '](url)' },
  ]);

  protected previewHtml = computed<string>(() => {
    const raw = this.value() ?? '';
    return this._basicMarkdownToHtml(raw);
  });

  protected setTab(tab: MarkdownTab): void {
    this.activeTab.set(tab);
  }

  protected applyFormatting(prefix: string, suffix: string): void {
    const current = this.value() ?? '';
    this.value.set(`${current}${prefix}text${suffix}`);
  }

  private _basicMarkdownToHtml(md: string): string {
    return md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br>');
  }
}
