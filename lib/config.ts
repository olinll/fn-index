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
    clickable?: boolean;
    visible?: boolean;
  };
}

export interface Config {
  title?: string;
  subtitle?: string;
  favicon?: string;
  groups: Group[];
  external_sources?: ExternalSource[];
}

export async function fetchExternalGroups(external_sources: ExternalSource[]): Promise<Group[]> {
  const { FN_ID, FN_USERNAME, FN_PASSWORD, API_KEY, IS_LOCAL } = process.env;
  const groups: Group[] = [];

  const sourcePromises = external_sources.map(async (source) => {
    try {
      // Note: We intentionally do NOT set isLocal here based on check_ip.
      // That is now handled client-side in ClientGroupRenderer.
      // However, if IS_LOCAL env var is strictly set, we might respect it, 
      // but the client logic is generally superior for user-context detection.
      let isLocal = IS_LOCAL === 'true';

      // Pass check_ip to the group object so client can use it
      const checkIpUrl = source.check_ip;

      // Construct payload
      let payload: any = {};
      
      if (source.body) {
        // Use configured body mapping
        for (const [key, value] of Object.entries(source.body)) {
          if (typeof value === 'string' && value.startsWith('$')) {
             const envKey = value.substring(1);
             if (envKey === 'IS_LOCAL') {
                 payload[key] = isLocal;
             } else {
                 payload[key] = process.env[envKey];
             }
          } else {
             payload[key] = value;
          }
        }
      } else {
        // Fallback to legacy hardcoded behavior
        if (FN_ID) payload.fnId = FN_ID;
        if (FN_USERNAME) payload.username = FN_USERNAME;
        if (FN_PASSWORD) payload.password = FN_PASSWORD;
        if (API_KEY) payload.key = API_KEY;
        if (isLocal) payload.isLocal = true;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased timeout as this is now non-blocking UI

      const method = source.method || 'POST';
      const headers = {
        'Content-Type': 'application/json',
        ...(source.headers || {})
      };

      const res = await fetch(source.url, {
        method: method, 
        headers: headers,
        body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(payload) : undefined,
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
          console.error(`Failed to fetch external source ${source.name}: ${res.statusText}`);
          return null;
      }

      const data = await res.json();
      const entryToken = data.entryToken;
      
      let servicesList: any[] = [];
      if (Array.isArray(data)) {
          servicesList = data;
      } else if (data.success && Array.isArray(data.services)) {
          servicesList = data.services;
      }

      // Assume data is an array of objects
      if (servicesList.length > 0) {
          const services: Service[] = servicesList.map((item: any) => ({
              name: item[source.mapping.name],
              url: item[source.mapping.url],
              description: source.mapping.description ? item[source.mapping.description] : undefined,
              icon: source.mapping.icon ? item[source.mapping.icon] : undefined,
              alias: source.mapping.alias ? item[source.mapping.alias] : undefined,
              clickable: (source.mapping.clickable && item[source.mapping.clickable] !== undefined) ? item[source.mapping.clickable] : true,
              visible: (source.mapping.visible && item[source.mapping.visible] !== undefined) ? item[source.mapping.visible] : true,
              entryToken: (!isLocal && entryToken) ? entryToken : undefined,
              isLocal: isLocal
          })).filter(s => s.name && s.url); // Ensure valid services

          const newServices: Service[] = [];

          for (const service of services) {
              // If the external source defines local overrides (services list), try to patch the fetched service
              if (source.services && Array.isArray(source.services)) {
                   const override = source.services.find(s => s.alias && s.alias === service.alias);
                   if (override) {
                       // Merge properties: fetched < override
                       // We use Object.assign or spread to merge. 
                       // Note: override might not have all fields, so we only override what's present in the local definition.
                       Object.assign(service, override);
                   }
              }

              newServices.push(service);
          }

          if (newServices.length > 0) {
              return {
                  name: source.name,
                  visible: source.visible !== false, // Default to true if not specified
                  description: source.description,
                  services: newServices,
                  isLocal: isLocal, // Initial server-side guess, client will refine
                  check_ip: checkIpUrl
              };
          }
      }
    } catch (error) {
      console.error(`Error processing external source ${source.name}:`, error);
      return null;
    }
    return null;
  });

  const results = await Promise.all(sourcePromises);
  
  results.forEach(group => {
      if (group) {
          groups.push(group);
      }
  });

  return groups;
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

  // Handle external sources
  if (!skipExternal && config.external_sources && Array.isArray(config.external_sources)) {
    const externalGroups = await fetchExternalGroups(config.external_sources);
    config.groups.push(...externalGroups);
  }

  return config;
}
