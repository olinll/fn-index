import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { AppConfig, NavItem } from '@/types/config';
import { fetchFnServices, FnCredentials } from './fn-api';

export async function getConfig(): Promise<AppConfig> {
  const configPath = path.join(process.cwd(), 'service.yaml');
  
  let config: AppConfig;

  try {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    config = yaml.load(fileContents) as AppConfig;
  } catch (e) {
    console.error("加载 service.yaml 失败", e);
    // 返回默认配置或抛出异常
    return {
      title: "导航",
      groups: []
    };
  }

  // Group-level API Integration
  for (const group of config.groups) {
    if (group.api && group.api.enabled !== false && group.api.url && group.api.params) {
      const envVarName = group.api.params;
      const envVarValue = process.env[envVarName];

      if (!envVarValue) {
        console.warn(`Environment variable ${envVarName} not found for group ${group.name}`);
        continue;
      }

      let credentials: FnCredentials;
      try {
        credentials = JSON.parse(envVarValue);
      } catch (e) {
        console.error(`Failed to parse credentials from ${envVarName}`, e);
        continue;
      }

      try {
        const apiServices = await fetchFnServices(group.api.url, credentials);
        const usedAliases = new Set<string>();
        const combinedItems: NavItem[] = [];

        // 1. Process existing YAML items (Overrides & Manual)
        for (const item of group.items) {
          if (item.alias && apiServices[item.alias]) {
            usedAliases.add(item.alias);
            const service = apiServices[item.alias];
            
            // Skip if explicitly hidden via visible: false
            if (item.visible === false) continue;

            combinedItems.push({
              ...item,
              // If YAML properties are missing/empty, use API values
              externalUrl: item.externalUrl || service.externalUrl,
              internalUrl: item.internalUrl || service.internalUrl,
              name: item.name || service.name || item.alias || "Unknown",
              description: item.description || service.description,
            });
          } else {
            // No alias match or no alias -> Keep as manual item
            // Check visibility for manual items too (if set)
            if (item.visible === false) continue;
            combinedItems.push(item);
          }
        }

        // 2. Add discovered services (not in YAML)
        for (const [alias, service] of Object.entries(apiServices)) {
          if (!usedAliases.has(alias)) {
            combinedItems.push(service as NavItem);
          }
        }

        group.items = combinedItems;

      } catch (e) {
        console.error(`Failed to fetch/merge API services for group ${group.name}:`, e);
      }
    }
  }
 
  return config;
}
