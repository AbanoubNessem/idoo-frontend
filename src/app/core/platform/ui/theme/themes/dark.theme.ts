import { Theme } from '../../ui.types';

export const DARK_THEME: Theme = {
  id: 'dark',
  name: 'Dark',
  mode: 'dark',
  cssClass: 'platform-theme-dark',
  tokens: {
    colors: {
      'primary':         '#60a5fa',
      'primary-hover':   '#93c5fd',
      'primary-subtle':  'rgba(59,130,246,0.12)',
      'secondary':       '#94a3b8',
      'accent':          '#a78bfa',
      'success':         '#34d399',
      'warning':         '#fbbf24',
      'error':           '#f87171',
      'info':            '#60a5fa',
      'surface':         '#0f172a',
      'surface-variant': '#1e293b',
      'background':      '#020617',
      'on-surface':      '#f8fafc',
      'on-background':   '#f1f5f9',
      'border':          '#334155',
      'divider':         '#1e293b',
      'shadow':          'rgba(0,0,0,0.4)',
      'text-primary':    '#f8fafc',
      'text-secondary':  '#94a3b8',
      'text-disabled':   '#475569',
      'text-inverse':    '#0f172a',
    },
    borderRadius: {
      'default': '0.375rem',
    },
    elevation: {
      'card': '0 1px 3px 0 rgba(0,0,0,0.3), 0 1px 2px -1px rgba(0,0,0,0.3)',
    },
  },
};
