import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class PhoneRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'phone';
  readonly displayName = 'Phone';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'phone', props: { format: 'international', linkable: true } };
  }
}
