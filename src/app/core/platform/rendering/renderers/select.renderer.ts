import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class SelectRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'select';
  readonly displayName = 'Select';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'select', props: { multiple: false, searchable: false, clearable: true } };
  }
}
