import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class LookupRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'lookup';
  readonly displayName = 'Lookup';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'lookup', props: { multiple: false, searchable: true, pageSize: 20 } };
  }
}
