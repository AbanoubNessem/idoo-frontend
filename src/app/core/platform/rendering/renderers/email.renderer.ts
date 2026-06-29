import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class EmailRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'email';
  readonly displayName = 'Email';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'email', props: { maxLength: 254, linkable: true } };
  }
}
