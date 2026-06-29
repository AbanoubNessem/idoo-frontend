import { Type } from '@angular/core';
import { FieldRenderer } from '../contracts/field-renderer';
import {
  FieldRenderRequest,
  FieldRendererConfig,
  FieldType,
  RenderMode,
  RenderOutput,
} from '../rendering.types';
import { RenderContext } from '../renderer-context';

export abstract class AbstractFieldRenderer implements FieldRenderer {
  abstract readonly fieldType: FieldType | string;
  abstract readonly displayName: string;

  readonly supportedModes: ReadonlyArray<RenderMode> = ['display', 'edit', 'filter'];

  canRender(fieldType: string): boolean {
    return fieldType === this.fieldType;
  }

  abstract getDefaultConfig(): FieldRendererConfig;

  render(request: FieldRenderRequest, context: RenderContext): RenderOutput {
    const component = context.getComponent(this.fieldType);
    return {
      component,
      inputs: this.buildInputs(request, context),
    };
  }

  protected buildInputs(
    request: FieldRenderRequest,
    context: RenderContext,
  ): Record<string, unknown> {
    const hidden = this.resolveHidden(request, context);
    const disabled = this.resolveDisabled(request, context);
    const defaultCfg = this.getDefaultConfig().props;

    return {
      label: request.label,
      value: request.value,
      fieldKey: request.fieldKey,
      fieldType: this.fieldType,
      mode: request.mode ?? context.mode,
      required: request.required ?? false,
      disabled,
      hidden,
      config: { ...defaultCfg, ...(request.config ?? {}), options: request.options },
    };
  }

  private resolveHidden(request: FieldRenderRequest, context: RenderContext): boolean {
    if (request.hidden === true) return true;
    if (request.hiddenExpression) {
      return context.evaluateBoolean(request.hiddenExpression);
    }
    return false;
  }

  private resolveDisabled(request: FieldRenderRequest, context: RenderContext): boolean {
    if (request.disabled === true) return true;
    if (request.disabledExpression) {
      return context.evaluateBoolean(request.disabledExpression);
    }
    return false;
  }
}
