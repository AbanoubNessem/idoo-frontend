import { Theme } from '../../ui.types';

export const BRAND_THEME: Theme = {
  id: 'brand',
  name: 'iDoo Brand',
  mode: 'light',
  cssClass: 'platform-theme-brand',
  tokens: {
    colors: {
      'primary':         '#6d28d9',
      'primary-hover':   '#5b21b6',
      'primary-subtle':  '#f5f3ff',
      'secondary':       '#475569',
      'accent':          '#2563eb',
      'success':         '#059669',
      'warning':         '#f59e0b',
      'error':           '#dc2626',
      'info':            '#3b82f6',
      'surface':         '#ffffff',
      'surface-variant': '#faf9ff',
      'background':      '#f5f3ff',
      'on-surface':      '#1c1917',
      'on-background':   '#292524',
      'border':          '#e9e5ff',
      'divider':         '#f0eeff',
      'shadow':          'rgba(109,40,217,0.08)',
      'text-primary':    '#1c1917',
      'text-secondary':  '#6b7280',
      'text-disabled':   '#d1d5db',
      'text-inverse':    '#ffffff',
    },
    borderRadius: {
      'default': '0.5rem',
    },
    elevation: {
      'card': '0 1px 3px 0 rgba(109,40,217,0.1), 0 1px 2px -1px rgba(109,40,217,0.06)',
    },
  },
};
