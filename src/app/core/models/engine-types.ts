import { Type } from '@angular/core';
import { ValidatorFn } from '@angular/forms';

export interface EntityDefinition {
  menuConfig?: MenuConfig;
  routeConfig?: RouteConfig;
  pageConfig?: PageConfig;
  tableConfig?: TableConfig<any>;
  formConfig?: FormConfig;
  workflowConfig?: WorkflowConfig;
}

// ---------------------------------------------------------
// ROUTE & MENU ENGINES
// ---------------------------------------------------------
export interface RouteConfig {
  path: string;
  component?: Type<any> | (() => Promise<Type<any>>);
  redirectTo?: string;
  permission?: string | string[];
}

export interface MenuConfig {
  label: string;
  path: string;
  icon?: string;
  parent?: string;
  order?: number;
  permission?: string | string[];
}

// ---------------------------------------------------------
// PAGE ENGINE
// ---------------------------------------------------------
export interface PageConfig {
  title: string;
  layout: 'standard' | 'split-pane' | 'tabs';
  actions?: PageAction[];
  sections: PageSection[];
}

export interface PageAction {
  id: string;
  label: string;
  icon?: string;
  color?: 'primary' | 'accent' | 'warn';
  permission?: string;
}

export interface PageSection {
  id: string;
  title?: string;
  type: 'table' | 'form' | 'custom' | 'widget';
  configId: string; // Links to TableConfig, FormConfig, or WidgetRegistry
  span?: number;
}

// ---------------------------------------------------------
// FORM ENGINE
// ---------------------------------------------------------
export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'account-picker' | 'cost-center-picker' | 'array';
  required?: boolean | ((model: any) => boolean);
  visible?: (model: any) => boolean;
  disabled?: (model: any) => boolean;
  options?: { label: string; value: any }[] | any; // Could be Observable
  validators?: ValidatorFn[];
  fields?: FormField[]; // Used for type 'array' or nested objects
}

export interface FormConfig {
  layout?: 'single-column' | 'two-column' | 'grid';
  fields: FormField[];
}

// ---------------------------------------------------------
// TABLE ENGINE
// ---------------------------------------------------------
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  type?: 'text' | 'date' | 'datetime' | 'badge' | 'boolean' | 'currency' | 'number';
  sortable?: boolean;
  searchable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  valueMapper?: (row: T) => any;
  badgeConfig?: Record<string, { label: string; color: string }>;
}

export interface TableAction<T> {
  key: string;
  icon: string;
  label: string;
  color?: 'primary' | 'warn' | 'accent';
  permission?: string | string[];
  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  handler: (row: T) => void;
}

export interface TableConfig<T> {
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  pageSize?: number;
  pageSizeOptions?: number[];
  trackByKey?: keyof T;
  exportable?: boolean;
}

// ---------------------------------------------------------
// WORKFLOW ENGINE
// ---------------------------------------------------------
export interface WorkflowConfig {
  states: string[];
  transitions: WorkflowTransition[];
}

export interface WorkflowTransition {
  from: string;
  to: string;
  actionLabel: string;
  permission?: string;
  color?: 'primary' | 'accent' | 'warn';
}

// ---------------------------------------------------------
// DASHBOARD ENGINE
// ---------------------------------------------------------
export interface DashboardConfig {
  layout: 'grid';
  columns: number;
  widgets: DashboardWidgetInstance[];
}

export interface DashboardWidgetInstance {
  id: string; // Resolves via WidgetRegistry
  span: number; // Col span
  rowSpan?: number;
  config?: any; // e.g. API endpoint, chart type
}
