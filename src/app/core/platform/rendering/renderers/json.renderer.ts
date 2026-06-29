import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class JsonRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'json';
  readonly displayName = 'JSON';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'json', props: { indent: 2, collapsible: true, maxHeight: 300 } };
  }
}
