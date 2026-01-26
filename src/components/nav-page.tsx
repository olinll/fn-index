"use client"

import React, { useEffect, useState } from 'react';
import { AppConfig, NavItem } from '@/types/config';
import { Moon, Sun, Globe, Lock, Search, ExternalLink, Activity } from 'lucide-react';
import { useTheme } from 'next-themes';

interface NavPageProps {
  config: AppConfig;
}

type NetworkMode = 'external' | 'internal';

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

export function NavPage({ config }: NavPageProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mode, setMode] = useState<NetworkMode>('external');
  const [search, setSearch] = useState('');

  const [probing, setProbing] = useState(false);
  const [latencies, setLatencies] = useState<Record<string, number>>({});

  // 防止水合不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  // 探测逻辑
  useEffect(() => {
    if (!config.probeUrl) return;

    const probe = async () => {
      try {
        // mode: 'no-cors' 允许探测不透明资源（我们只关心可达性）
        // 设置短超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        await fetch(config.probeUrl!, { 
          mode: 'no-cors', 
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        setMode('internal');
        // Auto-switch toast handled by useEffect
      } catch (e) {
        console.log("内部探测失败，保持在外部模式", e);
      }
    };

    probe();
  }, [config.probeUrl]);



  // 手动探测延迟功能
  const probeAllLatencies = async () => {
    setProbing(true);
    const newLatencies: Record<string, number> = {};
    const promises: Promise<void>[] = [];

    config.groups.forEach(group => {
      group.items.forEach(item => {
        const url = mode === 'internal' ? (item.internalUrl || item.externalUrl) : item.externalUrl;
        if (!url) return;

        const probeItem = async () => {
          const start = performance.now();
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            await fetch(url, { 
              mode: 'no-cors', 
              signal: controller.signal,
              cache: 'no-store'
            });
            
            clearTimeout(timeoutId);
            const end = performance.now();
            // 简单的 id 生成，实际项目中可能需要更稳定的 id
            const id = item.name + (item.description || "");
            newLatencies[id] = Math.round(end - start);
          } catch (e) {
            const id = item.name + (item.description || "");
            newLatencies[id] = -1; // -1 表示超时或错误
          }
        };
        promises.push(probeItem());
      });
    });

    await Promise.all(promises);
    setLatencies(newLatencies);
    setProbing(false);
    toast.success("延迟探测完成");
  };

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleMode = () => {
    const newMode = mode === 'external' ? 'internal' : 'external';
    setMode(newMode);
    toast.info(`已切换到${newMode === 'internal' ? '内部' : '外部'}模式`);
  };

  // 过滤项目
  const filteredGroups = config.groups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                            item.description?.toLowerCase().includes(search.toLowerCase());
      
      // 检查项目在当前模式下是否有有效 URL
      const hasUrl = mode === 'internal' ? (item.internalUrl || item.externalUrl) : item.externalUrl;
      
      return matchesSearch && hasUrl;
    })
  })).filter(group => group.items.length > 0);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* 头部 */}
      <header className="w-full pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              {config.favicon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={config.favicon} 
                  alt={config.title} 
                  className="w-12 h-12 rounded-full object-cover shadow-sm"
                />
              )}
              <h1 className="text-4xl font-black tracking-tight">{config.title}</h1>
            </div>
            {config.description && <p className="text-muted-foreground">{config.description}</p>}
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             {/* 搜索 */}
            <div className="relative group flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="搜索..." 
                className="pl-9 pr-4 py-2 h-10 w-full rounded-lg border bg-secondary/30 hover:bg-secondary/50 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all duration-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* 模式切换 */}
            <button 
              onClick={toggleMode}
              className={`flex items-center gap-2 px-3 py-2 h-10 rounded-lg border text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                mode === 'internal' 
                  ? 'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20 dark:text-green-400 dark:border-green-500/30' 
                  : 'bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
              }`}
            >
              {mode === 'internal' ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              <span>{mode === 'internal' ? '内部模式' : '外部模式'}</span>
            </button>

            {/* 延迟探测 */}
            <button 
              onClick={probeAllLatencies}
              disabled={probing}
              className={`flex items-center gap-2 px-3 py-2 h-10 rounded-lg border text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                probing 
                  ? 'bg-muted text-muted-foreground border-border cursor-not-allowed' 
                  : 'bg-secondary/50 hover:bg-secondary text-secondary-foreground border-transparent hover:border-border shadow-sm'
              }`}
              title="探测服务延迟"
            >
              <Activity className={`w-3.5 h-3.5 ${probing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">探测</span>
            </button>

            {/* 主题切换 */}
            <button 
              onClick={toggleTheme}
              className="p-2 h-10 w-10 flex items-center justify-center rounded-full bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all text-muted-foreground hover:text-foreground shadow-sm"
              aria-label="切换主题"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* 网格 */}
      <main className="max-w-7xl mx-auto px-6 pb-20 space-y-12">
        {filteredGroups.map((group, idx) => (
          <section key={idx} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold tracking-tight">{group.name}</h2>
              {/* 这里可以添加标签，如果 config 支持的话 */}
              {group.description && (
                <span className="text-sm text-muted-foreground/80 font-medium">{group.description}</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {group.items.map((item, itemIdx) => (
                <NavCard 
                  key={itemIdx} 
                  item={item} 
                  mode={mode} 
                  latency={latencies[item.name + (item.description || "")]}
                  isApiGroup={!!group.api}
                />
              ))}
            </div>
          </section>
        ))}

        {filteredGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-in fade-in zoom-in duration-500">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">未找到匹配项</p>
            <p className="text-sm">尝试搜索其他关键词</p>
          </div>
        )}
      </main>
    </div>
  );
}

import { NavIcon } from './nav-icon';
import { Copy, Check, ArrowUpRight } from 'lucide-react';
import { toast } from "sonner";

function NavCard({ item, mode, latency, isApiGroup }: { item: NavItem, mode: NetworkMode, latency?: number, isApiGroup?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [showExternalAlert, setShowExternalAlert] = useState(false);

  // 确定 URL
  // 如果是内部模式，优先使用 internalUrl，回退到 externalUrl
  // 如果是外部模式，只使用 externalUrl
  const url = mode === 'internal' 
    ? (item.internalUrl || item.externalUrl) 
    : item.externalUrl;

  if (!url) return null;

  const isWebUrl = url.startsWith('http://') || url.startsWith('https://');

  // 外部网络访问检查
  const handleLinkClick = (e: React.MouseEvent) => {
    if (mode === 'external' && isApiGroup && isWebUrl) {
      e.preventDefault();
      setShowExternalAlert(true);
    }
  };

  // 确定图标
  // 逻辑: 
  // 1. 配置图标
  // 2. ${url}/favicon.ico
  // 3. 可能是通用回退
  
  // 提取域名以获取 favicon 的辅助函数
  let iconUrl = item.icon;
  if (!iconUrl) {
    try {
      if (isWebUrl) {
        const urlObj = new URL(url);
        iconUrl = `${urlObj.origin}/favicon.ico`;
      }
    } catch (e) {
      // 无效 URL，可能是相对路径？
      if (url.startsWith('/')) {
        iconUrl = '/favicon.ico'; // 相对路径回退
      }
    }
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for insecure contexts or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = url;
        
        // Make it invisible
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('Fallback copy failed');
        }
      }
      
      setCopied(true);
      toast.success("复制成功", {
        description: item.name
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error("复制失败", {
        description: "请手动复制"
      });
    }
  };

  const content = (
    <>
      <NavIcon src={iconUrl} alt={item.name}>
        {copied && (
           <div className="absolute inset-0 bg-background/80 flex items-center justify-center animate-in fade-in zoom-in rounded-lg">
             <Check className="w-5 h-5 text-green-500" />
           </div>
        )}
      </NavIcon>
      
      <div className="flex-1 min-w-0 text-left pl-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">{item.name}</h3>
          <div className="flex items-center gap-2">
            {latency !== undefined && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                latency === -1 
                  ? 'bg-destructive/10 text-destructive' 
                  : latency < 200 
                    ? 'bg-green-500/10 text-green-600' 
                    : latency < 500 
                      ? 'bg-yellow-500/10 text-yellow-600' 
                      : 'bg-red-500/10 text-red-600'
              }`}>
                {latency === -1 ? '超时' : `${latency}ms`}
              </span>
            )}
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
            ) : (
              isWebUrl ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors opacity-0 group-hover:opacity-100" />
              )
            )}
          </div>
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-1.5 font-medium opacity-80">{item.description}</p>
        )}
      </div>
    </>
  );

  const commonClasses = "group flex items-center gap-2 p-6 rounded-2xl border border-border shadow-sm bg-card hover:bg-accent hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer w-full relative overflow-hidden";

  if (isWebUrl) {
    return (
      <>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={commonClasses}
          onClick={handleLinkClick}
        >
          {content}
        </a>

        <AlertDialog open={showExternalAlert} onOpenChange={setShowExternalAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>正在访问外部网络</AlertDialogTitle>
              <AlertDialogDescription>
                您正在通过FN Connect访问此服务。为了正常使用，该服务可能需要您手动添加 entry-token（Cookie） 或使用第三方脚本进行验证。
                <br/><br/>
               <a href="https://5ddd.com/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline underline-offset-4">FN Connect</a>&nbsp;&nbsp;|&nbsp;&nbsp;
               <a href="https://blog.olinl.com/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline underline-offset-4">如何使用油猴脚本（Olinl Blog）</a>
                <br/><br/>
                如果遇到访问问题，请检查您的网络连接或联系管理员。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                  if (url) window.open(url, '_blank');
                  setShowExternalAlert(false);
              }}>
                继续访问
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <button 
      onClick={handleCopy}
      className={commonClasses}
      type="button"
    >
      {content}
    </button>
  );
}
