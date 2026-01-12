# FN-Index 内网服务导航

一个现代化、高性能的内网服务导航页，支持静态配置与动态服务发现。基于 Next.js 15、Tailwind CSS v4 和 Shadcn UI 构建。

![界面预览](https://github.com/fluidicon.png)

## ✨ 核心特性

- **🚀 极速加载**: 采用 React Server Components (RSC) 和 Streaming SSR 技术，本地配置秒开，外部数据流式加载。
- **📝 灵活配置**: 基于 `services.yaml` 文件管理所有服务，简单直观。
- **🔌 动态服务发现**: 支持从外部 API（如飞牛 OS、Docker 管理器等）动态拉取服务列表。
- **🌍 环境智能感知**: 
  - 自动检测用户是处于**内网**还是**外网**环境（通过 `check_ip` 机制）。
  - 内网环境显示 "Local" 绿色标签，外网环境显示 "Remote" 琥珀色标签。
  - 外网访问内网服务时，自动弹出安全提示。
- **🔑 免密快捷访问**: 支持携带 `entry-token` 参数，实现点击卡片自动登录目标服务。
- **💓 健康状态检测**: 实时检测服务连通性与延迟（Ping），直观展示在线/离线状态。
- **🎨 现代化 UI**: 响应式设计，完美支持深色模式（Dark Mode），图标自动防挂裂。

## 🛠️ 快速开始

### 1. 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看效果。

### 3. 构建与部署

```bash
npm run build
npm run start
```

## ⚙️ 配置指南

所有配置均位于项目根目录的 `services.yaml` 文件中。

### 基础配置

```yaml
title: "我的内网导航"
subtitle: "Home Lab Services"
favicon: "/favicon.ico"
```

### 1. 静态服务组 (`groups`)

手动定义的固定服务列表。

```yaml
groups:
  - name: "开发工具"
    description: "常用开发与运维工具"
    services:
      - name: "Google"
        url: "https://www.google.com"
        description: "搜索引擎"
        icon: "https://www.google.com/favicon.ico" # 可选，留空会自动推导
      - name: "本地测试"
        url: "http://192.168.1.100:3000"
        visible: true
```

### 2. 外部动态源 (`external_sources`)

从外部 API 动态获取服务列表，适合对接 NAS、Docker 管理平台等。

```yaml
external_sources:
  - name: "NAS 服务"
    url: "http://192.168.1.10:3000/api/services" # 获取服务的 API 地址
    description: "从 NAS 动态同步的服务"
    
    # [新功能] 请求配置
    method: "POST" # 支持 GET/POST 等，默认为 POST
    headers:
      "Content-Type": "application/json"
      "Authorization": "Bearer $KEY" # 支持在 Header 中使用环境变量
    
    # [新功能] 请求体映射
    # 使用 $ 前缀引用环境变量
    # $IS_LOCAL 是内置的特殊变量，表示当前环境检测结果 (true/false)
    body:
      fnId: "$FN_ID"
      username: "$FN_USERNAME"
      password: "$FN_PASSWORD"
      key: "$API_KEY"
      isLocal: "$IS_LOCAL"
    
    # [核心功能] 环境检测 IP
    # 系统会尝试 Ping 这个地址 (前端超时 1s)
    # 如果通畅 -> 判定为内网 (Local) -> 开启直连
    # 如果不通 -> 判定为外网 (Remote) -> 可能会禁用某些功能或提示用户
    check_ip: "http://192.168.1.10:5666" 
    
    # 字段映射：将 API 返回的 JSON 字段映射到导航页标准字段
    mapping:
      name: "title"       # API 返回的 title 字段 -> 映射为 name
      url: "link"         # API 返回的 link 字段 -> 映射为 url
      icon: "icon_url"
      description: "desc"
    
    # 本地覆盖：可以通过 alias 匹配 API 返回的服务，强制覆盖其配置
    services:
      - name: "QBittorrent" # 覆盖名称
        alias: "qb_service" # 对应 API 返回数据中的 alias 标识
        icon: "/icons/qb.png" # 强制使用本地图标
```

## 🛡️ 环境感知与安全机制

### 工作原理

系统通过 `check_ip` 字段判断用户当前的网络环境：

1.  **探测**: 页面加载时，服务器端会尝试请求 `check_ip` 定义的地址。
2.  **判定**:
    *   **成功**: 标记该组服务为 **Local (内网)**。Payload 中 `isLocal: true`。
    *   **失败/超时**: 标记该组服务为 **Remote (外网)**。Payload 中 `isLocal: false`。
3.  **表现**:
    *   **Local**: 标题旁显示绿色 "Local" 徽章，点击服务直接跳转。
    *   **Remote**: 标题旁显示黄色 "Remote" 徽章。点击服务时，会弹出 **Alert Dialog**，提示用户当前处于外网环境，可能需要手动鉴权或检查连接。

### 免密登录 (Entry Token)

如果外部 API 返回的数据中包含 `entryToken` 字段：
- **内网模式**: 直接跳转原链接。
- **外网模式**: 跳转链接会自动追加 `?entry-token=xxxx` 参数。
- **目标服务适配**: 目标服务需支持读取 URL 参数中的 token 进行自动登录。

## 🔐 环境变量

本项目支持通过环境变量配置外部 API 的认证信息（如果外部源需要鉴权）。

在项目根目录创建 `.env` 或 `.env.local` 文件：

```env
# 飞牛 ID (可选)
FN_ID=your_fn_id

# 用户名 (可选)
FN_USERNAME=your_username

# 密码 (可选)
FN_PASSWORD=your_password

# API Key (可选)
API_KEY=your_api_key

# 强制指定是否为本地环境 (可选, true/false)
# 注意: 如果 services.yaml 中配置了 check_ip，则 check_ip 的检测结果优先级更高
IS_LOCAL=true
```

这些变量会在请求 `external_sources` 中定义的 URL 时，作为 JSON Body 发送给目标 API。

## 📁 目录结构

```
.
├── app/
│   ├── api/            # 后端 API 路由 (Status Check, Mock API)
│   ├── page.tsx        # 主页 (Server Component)
│   └── layout.tsx      # 全局布局
├── components/
│   ├── ExternalGroupsLoader.tsx # 外部源异步加载器 (Suspense)
│   ├── ServiceCard.tsx          # 服务卡片 (Client Component, 含状态检测)
│   └── ...
├── lib/
│   └── config.ts       # 核心配置解析逻辑
├── services.yaml       # 配置文件
└── public/             # 静态资源
```

## 🚀 性能优化说明

本项目针对内网环境做了大量优化：

1.  **并行加载**: 多个 `external_sources` 并行请求，互不阻塞。
2.  **流式渲染**: 外部源加载时显示骨架屏，不阻塞主页静态内容的显示（TTFB 极低）。
3.  **快速超时**:
    *   IP 检测超时: 1s
    *   API 请求超时: 2s
    *   服务状态 Ping 超时: 1.5s
    *   保证即使某个服务挂了，页面操作也不会卡顿。

## 🤝 贡献

欢迎提交 Issue 或 Pull Request 来改进本项目。

---

Built with ❤️ using Next.js
