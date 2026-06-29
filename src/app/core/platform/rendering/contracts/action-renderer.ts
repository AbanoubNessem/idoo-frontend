import { ActionRenderRequest, RenderOutput } from '../rendering.types';
import { RenderContext } from '../renderer-context';

export interface ActionRenderer {
  readonly actionType: string;
  readonly displayName: string;
  canRender(actionType: string): boolean;
  render(request: ActionRenderRequest, context: RenderContext): RenderOutput;
}
