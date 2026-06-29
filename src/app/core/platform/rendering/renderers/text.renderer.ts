import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class TextRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'text';
  readonly displayName = 'Text';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'text', props: { maxLength: 255, autoComplete: 'off' } };
  }
}
