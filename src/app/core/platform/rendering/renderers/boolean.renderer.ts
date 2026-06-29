import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class BooleanRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'boolean';
  readonly displayName = 'Boolean';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'boolean', props: { trueLabel: 'Yes', falseLabel: 'No', style: 'checkbox' } };
  }
}
