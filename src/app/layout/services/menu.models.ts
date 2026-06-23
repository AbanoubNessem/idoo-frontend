export interface MenuItem {
  moduleCode: string;
  label: string;
  icon: string;
  route?: string;
  permission?: string;
  sortOrder: number;
  children?: MenuItem[];
}
