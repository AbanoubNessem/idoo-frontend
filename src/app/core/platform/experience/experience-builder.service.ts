import { Injectable } from '@angular/core';
import { ExperienceProfile, ExperienceProfileBuilder } from './experience.types';

class ExperienceProfileBuilderImpl implements ExperienceProfileBuilder {
  private _id      = `exp-${Date.now().toString(36)}`;
  private _name    = 'Experience Profile';
  private _version?: string;
  private _themeId?: string;
  private _languageCode?: string;
  private _localeCode?: string;
  private _densityId?: string;
  private _typographyId?: string;
  private _iconPackId?: string;
  private _brandingId?: string;
  private _metadata?: unknown;

  constructor(id?: string) {
    if (id) this._id = id;
  }

  theme(id: string):      this { this._themeId      = id; return this; }
  language(code: string): this { this._languageCode = code; return this; }
  locale(code: string):   this { this._localeCode   = code; return this; }
  density(id: string):    this { this._densityId    = id; return this; }
  typography(id: string): this { this._typographyId = id; return this; }
  iconPack(id: string):   this { this._iconPackId   = id; return this; }
  branding(id: string):   this { this._brandingId   = id; return this; }
  name(n: string):        this { this._name         = n; return this; }
  version(v: string):     this { this._version      = v; return this; }
  metadata(m: unknown):   this { this._metadata     = m; return this; }

  build(): ExperienceProfile {
    return {
      id:           this._id,
      name:         this._name,
      version:      this._version,
      themeId:      this._themeId,
      languageCode: this._languageCode,
      localeCode:   this._localeCode,
      densityId:    this._densityId,
      typographyId: this._typographyId,
      iconPackId:   this._iconPackId,
      brandingId:   this._brandingId,
      metadata:     this._metadata,
    };
  }
}

@Injectable({ providedIn: 'root' })
export class ExperienceBuilderService {
  create(id?: string): ExperienceProfileBuilder {
    return new ExperienceProfileBuilderImpl(id);
  }

  rtlArabic(id: string): ExperienceProfileBuilder {
    return this.create(id).language('ar').locale('ar-SA');
  }

  default(id: string): ExperienceProfileBuilder {
    return this.create(id)
      .language('en')
      .locale('en-US')
      .density('comfortable')
      .typography('default')
      .iconPack('default');
  }
}
