"use client"

import { useState, useEffect } from 'react';

interface NavIconProps {
  src?: string;
  alt: string;
  children?: React.ReactNode;
}

export function NavIcon({ src, alt, children }: NavIconProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;

    setError(false);
    
    // 创建一个新的 Image 对象来预加载和检查缓存
    const img = new Image();
    img.src = src;

    if (img.complete) {
      setLoaded(true);
    } else {
      setLoaded(false);
      img.onload = () => setLoaded(true);
      img.onerror = () => setError(true);
    }

    // 设置超时作为兜底
    const timer = setTimeout(() => {
      // 如果 5 秒后还没加载好，我们也不强制隐藏，除非确实出错了
      // 但如果一直 loading，我们可能需要处理
    }, 5000);

    return () => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  // 如果没有图片源或者图片加载失败，则不渲染任何内容（包括容器）
  if (!src || error) {
    return null;
  }

  return (
    <div className={`shrink-0 w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden p-1 relative transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-contain"
        // 这里的 onLoad/onError 作为备用，主要逻辑由 useEffect 处理
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      {children}
    </div>
  );
}
