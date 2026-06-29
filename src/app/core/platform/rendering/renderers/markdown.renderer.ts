import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class MarkdownRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'markdown';
  readonly displayName = 'Markdown';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'markdown', props: { sanitize: true, allowHtml: false, toolbar: false } };
  }
}
