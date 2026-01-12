"use client";

import { useEffect, useState } from "react";
import { ExternalSource, Group } from "@/lib/config";
import { ServiceCard } from "@/components/ServiceCard";
import { Loader2 } from "lucide-react";

export function ExternalSourceManager({ source }: { source: ExternalSource }) {
  const [isLocal, setIsLocal] = useState<boolean | undefined>(undefined);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 1. Check IP Connectivity
  useEffect(() => {
    if (!source.check_ip) {
      // If no check_ip configured, assume remote (or use default logic)
      // But for this feature to work as requested, check_ip is crucial.
      setIsLocal(false);
      return;
    }

    const checkConnectivity = async () => {
      const checkUrl = source.check_ip!;
      const targetUrl = checkUrl.startsWith('http') ? checkUrl : `http://${checkUrl}`;
      
      const checkFetch = async () => {
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), 2000);
         try {
            await fetch(targetUrl, {
                method: 'GET',
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
                img.src = "";
                resolve(false);
            }, 2000);

            img.onload = () => {
                clearTimeout(timeoutId);
                resolve(true);
            };
            
            img.onerror = () => {
                clearTimeout(timeoutId);
                resolve(false);
            };

            try {
                const urlObj = new URL(targetUrl);
                urlObj.pathname = "/favicon.ico";
                img.src = urlObj.toString();
            } catch {
                resolve(false);
            }
         });
      };

      const [fetchResult, imgResult] = await Promise.all([checkFetch(), checkImage()]);
      setIsLocal(fetchResult || imgResult);
    };

    checkConnectivity();
  }, [source.check_ip]);

  // 2. Fetch Services using determined isLocal
  useEffect(() => {
    if (isLocal === undefined) return;

    const fetchServices = async () => {
      try {
        console.log(`[ExternalSourceManager] Fetching services for ${source.name} with isLocal=${isLocal}`);
        
        const res = await fetch('/api/external-services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sourceName: source.name,
                isLocal: isLocal 
            })
        });

        if (!res.ok) throw new Error("Failed to fetch");
        
        const data = await res.json();
        console.log(`[ExternalSourceManager] Received services:`, data.services);
        setServices(data.services || []);
      } catch (e) {
        console.error("Error fetching services for source", source.name, e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [isLocal, source.name]);

  if (loading) {
    return (
        <section className="space-y-6 animate-pulse">
            <div className="border-b pb-2">
                 <div className="h-8 w-48 bg-muted rounded"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => (
                    <div key={i} className="h-32 bg-muted rounded-xl"></div>
                ))}
            </div>
        </section>
    );
  }

  if (error || services.length === 0) {
      if (source.visible === false) return null;
      // Optionally render nothing if failed, or an error state
      return null;
  }

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="border-b pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground/80">
            {source.name}
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
        {source.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {source.description}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {services.map((service) => (
          <ServiceCard key={service.url} service={service} />
        ))}
      </div>
    </section>
  );
}
