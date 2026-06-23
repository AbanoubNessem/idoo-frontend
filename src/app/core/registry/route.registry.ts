import { RouteConfig } from '../models/engine-types';
import { Routes } from '@angular/router';

export class RouteRegistry {
  private static routes: RouteConfig[] = [];

  static add(route: RouteConfig) {
    this.routes.push(route);
  }

  static getRoutes(): RouteConfig[] {
    return [...this.routes];
  }

  /**
   * Helper to convert RouteConfig to Angular Routes format
   */
  static buildAngularRoutes(): Routes {
    return this.routes.map(r => {
      const ngRoute: any = { path: r.path };
      if (r.component) {
        ngRoute.loadComponent = r.component;
      } else if (r.redirectTo) {
        ngRoute.redirectTo = r.redirectTo;
        ngRoute.pathMatch = 'full';
      }
      // Note: Guards can be attached here automatically based on r.permission
      return ngRoute;
    });
  }

  static clear() {
    this.routes = [];
  }
}
