import { NextRequest, NextResponse } from 'next/server';
import { getConfig, ExternalSource, Service } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { sourceName, isLocal } = await request.json();
    
    // We need to load the config to find the source definition
    // We pass true to skipExternal because we only need the definition, not the fetched data
    const config = await getConfig(true);
    
    const source = config.external_sources?.find(s => s.name === sourceName);
    
    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Now perform the fetch logic that used to be in fetchExternalGroups
    // But this time we use the isLocal passed from the client!
    
    const { FN_ID, FN_USERNAME, FN_PASSWORD, API_KEY } = process.env;
    
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
    }

    // Always ensure isLocal is passed based on the check_ip status
    // This makes it a built-in parameter that is always present
    payload.isLocal = isLocal;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

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
        return NextResponse.json({ error: `Failed to fetch external source: ${res.statusText}` }, { status: res.status });
    }

    const data = await res.json();
    const entryToken = data.entryToken;
    
    let servicesList: any[] = [];
    if (Array.isArray(data)) {
        servicesList = data;
    } else if (data.success && Array.isArray(data.services)) {
        servicesList = data.services;
    }

    if (servicesList.length > 0) {
        const services: Service[] = servicesList.map((item: any) => ({
            name: item[source.mapping.name],
            url: item[source.mapping.url],
            description: source.mapping.description ? item[source.mapping.description] : undefined,
            icon: source.mapping.icon ? item[source.mapping.icon] : undefined,
            alias: source.mapping.alias ? item[source.mapping.alias] : undefined,
            clickable: (source.mapping.clickable && item[source.mapping.clickable] !== undefined) ? String(item[source.mapping.clickable]) !== 'false' : true,
            visible: (source.mapping.visible && item[source.mapping.visible] !== undefined) ? String(item[source.mapping.visible]) !== 'false' : true,
            entryToken: (!isLocal && entryToken) ? entryToken : undefined,
            isLocal: isLocal
        })).filter(s => s.name && s.url);

        const newServices: Service[] = [];

        for (const service of services) {
            // Check for override
            if (source.services && Array.isArray(source.services)) {
                 const override = source.services.find(s => s.alias && s.alias === service.alias);
                 if (override) {
                     Object.assign(service, override);
                 }
            }
            newServices.push(service);
        }

        return NextResponse.json({ services: newServices });
    }
    
    return NextResponse.json({ services: [] });

  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
