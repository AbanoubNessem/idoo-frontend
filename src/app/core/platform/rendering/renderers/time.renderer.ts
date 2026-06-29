import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class TimeRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'time';
  readonly displayName = 'Time';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'time', props: { format: 'HH:mm', use24h: true } };
  }
}
