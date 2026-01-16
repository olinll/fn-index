import { getConfig } from "@/lib/config";
import { NavPage } from "@/components/nav-page";

export const dynamic = 'force-dynamic'; // 确保在刷新时重新加载配置（可选，但对开发很有用）

export default async function Home() {
  const config = await getConfig();

  return (
    <NavPage config={config} />
  );
}
