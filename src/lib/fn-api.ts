import { NavItem } from "@/types/config";

interface FnService {
  title: string;
  url: string;
  port: string;
  alias: string;
}

interface FnApiResponse {
  success: boolean;
  services: FnService[];
  entryToken?: string;
}

export interface FnCredentials {
  fnId: string;
  username: string;
  password: string;
  key: string;
}

export async function fetchFnServices(apiUrl: string, credentials: FnCredentials): Promise<Record<string, Partial<NavItem>>> {
  const { fnId, username, password, key } = credentials;

  if (!fnId || !username || !password || !key) {
    console.warn("FN API credentials missing");
    return {};
  }

  const fetchMode = async (isLocal: boolean): Promise<FnService[]> => {
    try {
      const params = new URLSearchParams({
        fnId,
        username,
        password,
        key,
        isLocal: String(isLocal),
      });

      const url = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json() as FnApiResponse;
      if (!data.success) {
        throw new Error("API returned success: false");
      }

      let services = data.services || [];

      // Append entryToken to external URLs if present
      if (!isLocal && data.entryToken) {
        services = services.map(service => ({
          ...service,
          url: `${service.url}${service.url.includes('?') ? '&' : '?'}entry-token=${data.entryToken}`
        }));
      }

      return services;
    } catch (e) {
      console.error(`Failed to fetch FN services (isLocal=${isLocal}):`, e);
      return [];
    }
  };

  const [externalServices, internalServices] = await Promise.all([
    fetchMode(false),
    fetchMode(true)
  ]);

  const serviceMap: Record<string, Partial<NavItem>> = {};

  // Process external services
  externalServices.forEach(service => {
    if (!service.alias) return;
    serviceMap[service.alias] = {
      name: service.title,
      description: service.alias, // Default description is alias
      externalUrl: service.url,
      alias: service.alias,
    };
  });

  // Process internal services
  internalServices.forEach(service => {
    if (!service.alias) return;
    
    if (!serviceMap[service.alias]) {
      serviceMap[service.alias] = {
        name: service.title,
        description: service.alias,
        alias: service.alias,
      };
    }
    
    serviceMap[service.alias].internalUrl = service.url;
    // Update name/description if not already set (though external usually runs first or parallel)
    if (!serviceMap[service.alias].name) serviceMap[service.alias].name = service.title;
  });

  return serviceMap;
}
