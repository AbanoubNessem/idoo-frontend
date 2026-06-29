import { WidgetRenderRequest, RenderOutput } from '../rendering.types';
import { RenderContext } from '../renderer-context';

export interface WidgetRenderer {
  readonly widgetType: string;
  readonly displayName: string;
  canRender(widgetType: string): boolean;
  render(request: WidgetRenderRequest, context: RenderContext): RenderOutput;
}
