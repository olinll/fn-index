"use client";

import { useEffect, useState, useMemo } from "react";
import { Service } from "@/lib/config";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2 } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ServiceCardProps {
  service: Service;
}

type Status = "idle" | "checking" | "online" | "offline";

export function ServiceCard({ service }: ServiceCardProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [latency, setLatency] = useState<number | null>(null);
  const [isIconError, setIsIconError] = useState(false);
  
  const [ref, isIntersecting] = useIntersectionObserver({
    freezeOnceVisible: true,
  });

  // 优先使用配置的 icon，否则尝试自动推导 /favicon.ico
  const iconUrl = useMemo(() => {
    // 如果显式配置了空字符串，则不显示图标也不自动推导
    if (service.icon === "") return null;
    
    if (service.icon) return service.icon;
    
    try {
      return new URL("/favicon.ico", service.url).href;
    } catch {
      return null;
    }
  }, [service.icon, service.url]);

  useEffect(() => {
    setIsIconError(false);
  }, [iconUrl]);

  useEffect(() => {
    if (!isIntersecting || status !== "idle") return;

    const checkStatus = async () => {
      setStatus("checking");
      try {
        const res = await fetch(`/api/status?url=${encodeURIComponent(service.url)}`);
        const data = await res.json();
        
        if (data.status === 'online') {
            setStatus("online");
            setLatency(data.latency);
        } else {
            setStatus("offline");
            setLatency(data.latency);
        }
      } catch (error) {
        setStatus("offline");
      }
    };

    checkStatus();
  }, [service.url, isIntersecting, status]);

  if (service.visible === false) {
    return null;
  }

  const isClickable = service.clickable !== false;
  const Component = isClickable ? "a" : "div";

  const href = useMemo(() => {
    if (!isClickable) return undefined;
    if (!service.entryToken) return service.url;

    try {
      const url = new URL(service.url);
      url.searchParams.set("entry-token", service.entryToken);
      return url.toString();
    } catch {
      return service.url;
    }
  }, [isClickable, service.url, service.entryToken]);

  const [showLocalAlert, setShowLocalAlert] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (isClickable && service.isLocal === false) {
      e.preventDefault();
      setShowLocalAlert(true);
    }
  };

  const cardContent = (
    <div
      ref={ref}
      className={cn(
        "group block p-6 bg-card border rounded-xl transition-all h-full",
        isClickable ? "hover:bg-accent/50 hover:shadow-md cursor-pointer" : "opacity-80 cursor-default"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {iconUrl && !isIconError && (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={iconUrl} 
              alt="" 
              className="w-8 h-8 rounded-lg object-contain bg-muted/50 p-1"
              onError={() => setIsIconError(true)}
            />
          )}
          <h3 className={cn("font-semibold text-lg transition-colors", isClickable && "group-hover:text-primary")}>
            {service.name}
          </h3>
        </div>
        {isClickable && <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      
      {service.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {service.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs font-medium">
        {status === "idle" && (
           <span className="flex items-center gap-1.5 text-muted-foreground opacity-50">
             <span className="h-2 w-2 rounded-full bg-muted-foreground/30"></span>
             等待检测...
           </span>
        )}

        {status === "checking" && (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            检测中...
          </span>
        )}
        
        {status === "online" && (
          <span className={cn(
            "flex items-center gap-1.5",
            latency && latency < 200 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"
          )}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
            {latency}ms
          </span>
        )}

        {status === "offline" && (
          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
             <span className="h-2 w-2 rounded-full bg-current"></span>
             离线
          </span>
        )}
      </div>
    </div>
  );

  if (isClickable && service.isLocal === false) {
    return (
      <AlertDialog open={showLocalAlert} onOpenChange={setShowLocalAlert}>
        <div onClick={() => setShowLocalAlert(true)}>
          {cardContent}
        </div>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>正在访问外部网络</AlertDialogTitle>
            <AlertDialogDescription>
              您正在从外部网络访问此服务。为了正常使用，该服务可能需要您手动添加 Cookie 或进行额外的身份验证。
              <br/><br/>
              {/* 您正在通过FN Connect访问此服务， */}
              请在跳转后的网页添加 entry-token 参数。
              <br/><br/>
              如果遇到访问问题，请检查您的网络连接或联系管理员。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                if (href) window.open(href, '_blank');
            }}>
              继续访问
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Component
      href={href}
      target={isClickable ? "_blank" : undefined}
      rel={isClickable ? "noopener noreferrer" : undefined}
      className="block h-full"
    >
      {cardContent}
    </Component>
  );
}
