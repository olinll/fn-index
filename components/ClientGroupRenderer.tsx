"use client";

import { useEffect, useState } from "react";
import { Group } from "@/lib/config";
import { ServiceCard } from "@/components/ServiceCard";

export function ClientGroupRenderer({ group }: { group: Group }) {
  const [isLocal, setIsLocal] = useState<boolean | undefined>(group.isLocal);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only perform client-side check if check_ip is provided
    if (group.check_ip && !hasChecked) {
      const checkConnectivity = async () => {
        try {
          // Try to fetch the check_ip address
          // Note: This requires the check_ip to support CORS or be a simple image/resource
          // If it's a simple IP, we might use a no-cors mode, but that won't tell us if it succeeded (opaque response)
          // However, for image or favicon it works.
          // For generic IP, we rely on the fact that if it fails (timeout/network error), it throws.
          
          // Since we can't easily detect success with no-cors (status is 0), 
          // we assume if it doesn't throw quickly, it might be reachable.
          // A better approach for client-side is to try to load an image or script from that IP if possible.
          // Or if the user provides a full URL that supports CORS.
          
          // Strategy: Try HEAD request with short timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);
          
          let checkUrl = group.check_ip!;
          if (!checkUrl.startsWith('http')) {
             checkUrl = `http://${checkUrl}`;
          }

          await fetch(checkUrl, {
            method: 'HEAD',
            mode: 'no-cors', // Important: most internal IPs won't have CORS headers for us
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          // If we get here, it didn't throw (timeout or network error). 
          // With no-cors, we can't be 100% sure of success status, but we know it's "reachable" at network layer.
          setIsLocal(true);
        } catch (e) {
          // Timeout or Network Error -> Remote
          setIsLocal(false);
        } finally {
          setHasChecked(true);
        }
      };

      checkConnectivity();
    }
  }, [group.check_ip, hasChecked]);

  // Update services with the new isLocal state
  const servicesWithState = group.services.map(s => ({
    ...s,
    isLocal: isLocal
  }));

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="border-b pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground/80">
            {group.name}
          </h2>
          {isLocal !== undefined && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full transition-colors duration-300 ${
                  isLocal 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}>
                  {isLocal ? "Local" : "Remote"}
              </span>
          )}
        </div>
        {group.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {group.description}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {servicesWithState.map((service) => (
          <ServiceCard key={service.url} service={service} />
        ))}
      </div>
    </section>
  );
}
