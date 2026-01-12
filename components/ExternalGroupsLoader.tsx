import { ExternalSource } from "@/lib/config";
import { ExternalSourceManager } from "./ExternalSourceManager";

export function ExternalGroupsLoader({ sources }: { sources: ExternalSource[] }) {
  // Now simply orchestrates client-side managers for each source
  // No server-side fetching here anymore
  return (
    <>
      {sources
        .filter(source => source.visible !== false)
        .map((source) => (
          <ExternalSourceManager key={source.name} source={source} />
      ))}
    </>
  );
}
