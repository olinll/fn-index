import { fetchExternalGroups, ExternalSource } from "@/lib/config";
import { ServiceCard } from "@/components/ServiceCard";
import { ClientGroupRenderer } from "./ClientGroupRenderer";

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
          <ClientGroupRenderer key={group.name} group={group} />
      ))}
    </>
  );
}
