export type DialogType = 'confirm' | 'delete' | 'approve' | 'reject' | 'form' | 'info';

export interface DialogConfig {
  type: DialogType;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'primary' | 'warn' | 'accent';
  data?: unknown;
  width?: string;
}

export interface DialogResult<T = unknown> {
  confirmed: boolean;
  data?: T;
}
