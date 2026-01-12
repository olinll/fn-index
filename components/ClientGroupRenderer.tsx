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
          
          // Strategy: Parallel check using fetch(no-cors) and Image load
          // This maximizes chances of detection across different browser policies and server configs.
          
          const checkUrl = group.check_ip!;
          const targetUrl = checkUrl.startsWith('http') ? checkUrl : `http://${checkUrl}`;
          
          const checkFetch = async () => {
             const controller = new AbortController();
             const timeoutId = setTimeout(() => controller.abort(), 2000);
             try {
                await fetch(targetUrl, {
                    method: 'GET', // GET is more robust than HEAD for some servers
                    mode: 'no-cors', 
                    signal: controller.signal,
                    referrerPolicy: 'no-referrer'
                });
                clearTimeout(timeoutId);
                return true;
             } catch (e) {
                return false;
             }
          };

          const checkImage = () => {
             return new Promise<boolean>((resolve) => {
                const img = new Image();
                const timeoutId = setTimeout(() => {
                    img.src = ""; // Cancel loading
                    resolve(false);
                }, 2000);

                img.onload = () => {
                    clearTimeout(timeoutId);
                    resolve(true);
                };
                
                // If it fails (404 or network error), we can't distinguish easily.
                // But typically if it's a network error (unreachable), it errors out.
                // If it's 404 (reachable), it also errors out.
                // So Image check is mostly useful for POSITIVE confirmation (onload).
                img.onerror = () => {
                    clearTimeout(timeoutId);
                    resolve(false);
                };

                // Try to load favicon or just the root (which might fail if not an image)
                // We append /favicon.ico to give it a best chance of being a valid image
                // But we must be careful about the path.
                try {
                    const urlObj = new URL(targetUrl);
                    urlObj.pathname = "/favicon.ico";
                    img.src = urlObj.toString();
                } catch {
                    resolve(false);
                }
             });
          };

          // Run both checks
          const [fetchResult, imgResult] = await Promise.all([checkFetch(), checkImage()]);
          
          // If either succeeded, we consider it Local
          setIsLocal(fetchResult || imgResult);
        } catch (e) {
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
