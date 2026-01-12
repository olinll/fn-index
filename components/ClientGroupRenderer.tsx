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
          // However, direct fetch from client to internal IP often fails due to Mixed Content (if HTTPS) or CORS
          // BUT: If the user is on HTTPS and target is HTTP, browser blocks it.
          // If the user is on HTTP and target is HTTP, it might work with no-cors.
          
          // REVISED STRATEGY:
          // We CANNOT trust browser-side fetch to internal IP if CORS is missing or Protocol Mismatch (Mixed Content).
          // And we CANNOT use server-side proxy because the server (e.g. Vercel/Cloud) cannot access user's localhost/intranet.
          
          // So we must try best-effort browser fetch.
          // Common issue: "strict-origin-when-cross-origin" or CORS error.
          // With mode: 'no-cors', we get an opaque response. 
          // If it throws "Network Error", it usually means unreachable OR Mixed Content block.
          
          // Let's try loading an Image instead!
          // Image loading is more permissive than fetch (no CORS required for display, though we can't read pixels).
          // If onload triggers, it's reachable. If onerror triggers, it might be 404 (reachable) or Network Error (unreachable).
          // But actually, for this specific use case (detecting Intranet), 
          // fetch with no-cors is the standard way, even if it returns opaque.
          // If it returns (even opaque), it means the TCP connection succeeded.
          
          // Wait! The user says "strict-origin-when-cross-origin". This is a Referrer Policy.
          // It usually appears when doing cross-origin requests.
          // If we see this, it often means the request WAS sent.
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);
          
          let checkUrl = group.check_ip!;
          if (!checkUrl.startsWith('http')) {
             checkUrl = `http://${checkUrl}`;
          }

          // Using mode: 'no-cors' allows the request to be sent to an opaque origin
          // We won't see the status code, but if it doesn't throw a NetworkError, it means the host is resolved and reachable.
          await fetch(checkUrl, {
            method: 'HEAD',
            mode: 'no-cors', 
            signal: controller.signal,
            referrerPolicy: 'no-referrer' // Try to reduce referrer noise
          });
          
          clearTimeout(timeoutId);
          setIsLocal(true);
        } catch (e) {
          // Check if it's an abort error (timeout)
          if (e instanceof DOMException && e.name === 'AbortError') {
             setIsLocal(false);
          } else {
             // Other errors might be CORS related or Network related.
             // If it's a CORS error (which fetch often masks as TypeError: Failed to fetch),
             // it paradoxically means the server IS reachable but refused the headers.
             // However, 'no-cors' mode prevents CORS errors from throwing!
             // So if we get here with 'no-cors', it's likely a true Network Error (Connection Refused / Name Not Resolved).
             setIsLocal(false);
          }
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
