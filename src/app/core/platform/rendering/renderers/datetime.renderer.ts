import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class DateTimeRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'datetime';
  readonly displayName = 'Date & Time';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'datetime', props: { format: 'YYYY-MM-DD HH:mm', use24h: true } };
  }
}
