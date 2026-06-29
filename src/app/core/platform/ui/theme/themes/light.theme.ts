import { Theme } from '../../ui.types';

export const LIGHT_THEME: Theme = {
  id: 'light',
  name: 'Light',
  mode: 'light',
  cssClass: 'platform-theme-light',
  tokens: {
    colors: {
      'primary':         '#2563eb',
      'primary-hover':   '#1d4ed8',
      'primary-subtle':  '#eff6ff',
      'secondary':       '#475569',
      'accent':          '#7c3aed',
      'success':         '#059669',
      'warning':         '#f59e0b',
      'error':           '#dc2626',
      'info':            '#3b82f6',
      'surface':         '#ffffff',
      'surface-variant': '#f8fafc',
      'background':      '#f8fafc',
      'on-surface':      '#0f172a',
      'on-background':   '#1e293b',
      'border':          '#e2e8f0',
      'divider':         '#f1f5f9',
      'shadow':          'rgba(0,0,0,0.08)',
      'text-primary':    '#0f172a',
      'text-secondary':  '#64748b',
      'text-disabled':   '#cbd5e1',
      'text-inverse':    '#ffffff',
    },
    borderRadius: {
      'default': '0.375rem',
    },
    elevation: {
      'card': '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
    },
  },
};
