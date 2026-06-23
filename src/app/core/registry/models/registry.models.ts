export interface ModuleConfig {
  id: string;
  name: string;
  icon: string;
  routePrefix: string;
  requiredPermission?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface EntityConfig<T = any> {
  name: string;
  apiPath: string;
  permissions: {
    create: string;
    read: string;
    update: string;
    delete: string;
  };
  formSchemaFactory?: () => any; // Will type as FormSchema later
  tableConfigFactory?: () => any; // Will type as TableConfig<T> later
}
