import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { AppConfig } from '@/types/config';

export async function getConfig(): Promise<AppConfig> {
  const configPath = path.join(process.cwd(), 'public', 'config.yaml');
  
  try {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents) as AppConfig;
    return config;
  } catch (e) {
    console.error("加载 config.yaml 失败", e);
    // 返回默认配置或抛出异常
    return {
      title: "导航",
      groups: []
    };
  }
}
