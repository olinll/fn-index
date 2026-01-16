export interface NavItem {
  name: string;
  description?: string;
  icon?: string;
  externalUrl?: string;
  internalUrl?: string;
}

export interface NavGroup {
  name: string;
  items: NavItem[];
}

export interface AppConfig {
  title: string;
  description?: string;
  favicon?: string;
  probeUrl?: string;
  groups: NavGroup[];
}
