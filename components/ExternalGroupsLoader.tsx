import { fetchExternalGroups, ExternalSource } from "@/lib/config";
import { ServiceCard } from "@/components/ServiceCard";

export async function ExternalGroupsLoader({ sources }: { sources: ExternalSource[] }) {
  const groups = await fetchExternalGroups(sources);

  if (groups.length === 0) {
    return null;
  }

  return (
    <>
      {groups
        .filter(group => group.visible !== false)
        .map((group) => (
        <section key={group.name} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
    </>
  );
}
