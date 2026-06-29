import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { PLUGIN_MANIFEST_TOKEN, PluginManifest } from './plugin-manifest.model';

export function providePlugin(manifest: PluginManifest): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PLUGIN_MANIFEST_TOKEN, useValue: manifest, multi: true },
  ]);
}
