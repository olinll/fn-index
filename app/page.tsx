import { getConfig } from "@/lib/config";
import { ServiceCard } from "@/components/ServiceCard";
import { ModeToggle } from "@/components/mode-toggle";
import { Suspense } from "react";
import { ExternalGroupsLoader } from "@/components/ExternalGroupsLoader";
import { Loader2 } from "lucide-react";

export default async function Home() {
  // Use skipExternal=true to load the page immediately with local config
  const config = await getConfig(true);

  return (
    <main className="min-h-screen bg-background p-6 md:p-12 transition-colors">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex items-start justify-between mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-primary">{config.title || "内网导航"}</h1>
            <p className="text-muted-foreground text-lg">
              {config.subtitle || "快速访问内部服务与工具"}
            </p>
          </div>
          <ModeToggle />
        </header>

        {config.groups
          .filter(group => group.visible !== false)
          .map((group) => (
          <section key={group.name} className="space-y-6">
            <div className="border-b pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground/80">
                  {group.name}
                </h2>
                {group.isLocal !== undefined && (
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        group.isLocal 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                        {group.isLocal ? "Local" : "Remote"}
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
              {group.services.map((service) => (
                <ServiceCard key={service.url} service={service} />
              ))}
            </div>
          </section>
        ))}

        {/* Load external groups asynchronously */}
        {config.external_sources && config.external_sources.length > 0 && (
          <Suspense fallback={
            <div className="py-8 flex items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>正在加载外部服务...</span>
            </div>
          }>
             <ExternalGroupsLoader sources={config.external_sources} />
          </Suspense>
        )}

        {config.groups.length === 0 && (!config.external_sources || config.external_sources.length === 0) && (
            <div className="text-center py-20 text-muted-foreground">
                <p>暂无服务配置，请检查 services.yaml 文件。</p>
            </div>
        )}
      </div>
    </main>
  );
}
