import { Injectable, inject } from '@angular/core';
import { ExperienceResolutionPipeline } from './experience-resolution-pipeline.service';
import {
  ExperienceResolutionContext,
  ExperienceResolutionContextBuilder,
  ResolvedExperience,
} from './experience-resolution-context';
import { ExperienceResolutionPolicy } from './experience-resolution-policy';
import { ExperienceState } from '../experience-state';

@Injectable({ providedIn: 'root' })
export class ExperienceResolverService {
  private readonly _pipeline = inject(ExperienceResolutionPipeline);
  private readonly _state    = inject(ExperienceState);

  // ─── Resolve from context ────────────────────────────────────────────────

  resolve(
    context: ExperienceResolutionContext,
    policy?: ExperienceResolutionPolicy,
  ): ResolvedExperience {
    return this._pipeline.resolve(context, policy);
  }

  // ─── Resolve from current state ──────────────────────────────────────────

  resolveFromState(policy?: ExperienceResolutionPolicy): ResolvedExperience {
    const ctx = this._buildContextFromState();
    return this._pipeline.resolve(ctx, policy);
  }

  // ─── Context builder shortcut ────────────────────────────────────────────

  buildContext(): ExperienceResolutionContextBuilder {
    return new ExperienceResolutionContextBuilder();
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _buildContextFromState(): ExperienceResolutionContext {
    const themeId = this._state.themeId();
    const b = new ExperienceResolutionContextBuilder();
    if (themeId) {
      b.userTheme(themeId);
    }
    return b.build();
  }
}
