import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class DateRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'date';
  readonly displayName = 'Date';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'date', props: { format: 'YYYY-MM-DD', minDate: null, maxDate: null } };
  }
}
