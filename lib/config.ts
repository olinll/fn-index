import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface Service {
  name: string;
  url: string;
  description?: string;
  icon?: string;
  alias?: string;
  clickable?: boolean;
  visible?: boolean;
  entryToken?: string;
  isLocal?: boolean;
}

export interface Group {
  name: string;
  visible?: boolean;
  description?: string;
  services: Service[];
  isLocal?: boolean;
  check_ip?: string;
}

export interface ExternalSource {
  name: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, string | boolean | number>;
  check_ip?: string;
  override?: boolean;
  visible?: boolean;
  description?: string;
  services?: Service[];
  mapping: {
    name: string;
    url: string;
    description?: string;
    icon?: string;
    alias?: string;
    clickable?: string;
    visible?: string;
  };
}

export interface Config {
  title?: string;
  subtitle?: string;
  favicon?: string;
  groups: Group[];
  external_sources?: ExternalSource[];
}

export async function getConfig(skipExternal = false): Promise<Config> {
  const configPath = path.join(process.cwd(), 'services.yaml');
  let config: Config = { groups: [] };
  
  try {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    config = yaml.load(fileContents) as Config;
  } catch (e) {
    console.error("Error reading config file:", e);
    return { groups: [] };
  }

  // NOTE: External sources are now handled entirely client-side via ExternalGroupsLoader -> ExternalSourceManager
  // We no longer fetch them here.
  // The 'skipExternal' param is kept for compatibility but effectively external sources are always skipped 
  // in terms of server-side data fetching. They are just passed as config to the client.

  return config;
}
