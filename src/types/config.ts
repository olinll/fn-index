export interface NavItem {
  name: string;
  alias?: string;
  description?: string;
  icon?: string;
  externalUrl?: string;
  internalUrl?: string;
  visible?: boolean;
}

export interface ApiConfig {
  url: string;
  enabled?: boolean;
  params?: string;
}

export interface NavGroup {
  name: string;
  description?: string;
  api?: ApiConfig;
  items: NavItem[];
}

export interface AppConfig {
  title: string;
  description?: string;
  favicon?: string;
  probeUrl?: string;
  groups: NavGroup[];
}
