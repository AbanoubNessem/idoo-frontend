export const LOGGER_COLORS: Record<string, string> = {
  info: 'color: #3b82f6; font-weight: bold;', // Blue
  debug: 'color: #6b7280; font-weight: bold;', // Gray
  success: 'color: #22c55e; font-weight: bold;', // Green
  warning: 'color: #f97316; font-weight: bold;', // Orange
  error: 'color: #ef4444; font-weight: bold;', // Red
  api: 'color: #a855f7; font-weight: bold;', // Purple
  auth: 'color: #06b6d4; font-weight: bold;', // Cyan
  router: 'color: #374151; font-weight: bold;', // Dark Gray
  state: 'color: #ec4899; font-weight: bold;', // Pink
  guard: 'color: #eab308; font-weight: bold;', // Yellow
  storage: 'color: #a16207; font-weight: bold;', // Brown
  context: 'color: #14b8a6; font-weight: bold;', // Teal
  performance: 'color: #8b5cf6; font-weight: bold;' // Violet
};

export const LOGGER_EMOJIS: Record<string, string> = {
  info: '🔵',
  debug: '⚪',
  success: '🟢',
  warning: '🟡',
  error: '🔴',
  api: '🟣',
  auth: '🟦',
  router: '🟧',
  guard: '⚪',
  state: '🟢',
  storage: '🟤',
  context: '⚫',
  performance: '⏱️'
};
