import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class TextareaRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'textarea';
  readonly displayName = 'Textarea';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'textarea', props: { rows: 4, maxLength: 4000, autoResize: false } };
  }
}
