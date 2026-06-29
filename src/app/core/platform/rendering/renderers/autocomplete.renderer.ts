import { AbstractFieldRenderer } from './abstract-field.renderer';
import { FieldRendererConfig, FieldType } from '../rendering.types';

export class AutocompleteRenderer extends AbstractFieldRenderer {
  readonly fieldType: FieldType = 'autocomplete';
  readonly displayName = 'Autocomplete';

  getDefaultConfig(): FieldRendererConfig {
    return { fieldType: 'autocomplete', props: { minChars: 2, debounceMs: 300, maxResults: 10 } };
  }
}
