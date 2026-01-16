# 开发文档

本文档旨在帮助开发者了解 FN Index 的项目结构、技术栈以及核心功能实现，以便进行二次开发或贡献代码。

## 🛠️ 技术栈

- **框架**: [Next.js 16](https://nextjs.org/) (App Router)
- **语言**: TypeScript
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **图标**: [Lucide React](https://lucide.dev/)
- **组件库**: [Radix UI](https://www.radix-ui.com/) (无头组件), [Shadcn UI](https://ui.shadcn.com/) (设计模式)
- **通知**: [Sonner](https://sonner.emilkowal.ski/)
- **配置解析**: YAML

## 📂 项目结构

```
fn-index/
├── public/                 # 静态资源目录
│   ├── icon/               # 服务图标
│   └── miyou.png           # 默认 Logo/Favicon
├── src/
│   ├── app/                # Next.js App Router 目录
│   │   ├── globals.css     # 全局样式（Tailwind 指令）
│   │   ├── layout.tsx      # 根布局（包含 ThemeProvider, Toaster）
│   │   └── page.tsx        # 主页面（服务端组件，负责加载配置）
│   ├── components/         # React 组件
│   │   ├── ui/             # 通用 UI 组件 (Alert Dialog 等)
│   │   ├── nav-card.tsx    # 服务卡片组件 (在 NavPage 中定义)
│   │   ├── nav-icon.tsx    # 图标组件 (处理图片加载与回退)
│   │   ├── nav-page.tsx    # 核心页面组件 (客户端组件，包含主要交互逻辑)
│   │   └── theme-provider.tsx # 主题提供者
│   ├── lib/                # 工具库
│   │   ├── config.ts       # 配置加载逻辑 (YAML 解析 + API 聚合)
│   │   ├── fn-api.ts       # 外部 API 调用封装
│   │   └── utils.ts        # 通用辅助函数 (cn 等)
│   └── types/              # TypeScript 类型定义
│       └── config.ts       # 配置相关的接口定义 (AppConfig, NavGroup, NavItem)
├── service.yaml            # 默认配置文件
├── next.config.ts          # Next.js 配置
├── tailwind.config.ts      # Tailwind 配置
└── package.json            # 项目依赖
```

## 🧩 核心组件与逻辑

### 1. 配置加载 (`src/lib/config.ts`)
- 在服务端运行。
- 读取 `service.yaml` 文件。
- 如果配置了 API 别名，会调用 `fn-api.ts` 获取外部服务列表并合并到静态配置中。
- 返回统一的 `AppConfig` 对象给前端。

### 2. 核心交互 (`src/components/nav-page.tsx`)
这是一个客户端组件 (`use client`)，负责处理所有用户交互：
- **状态管理**：
  - `mode`: 当前网络模式 ('internal' | 'external')。
  - `search`: 搜索关键词。
  - `latencies`: 存储各服务的探测延迟。
- **自动探测**：
  - 组件挂载后，如果配置了 `probeUrl`，会尝试发起 `no-cors` 请求。
  - 如果请求成功（未超时），自动切换到 `internal` 模式。
- **手动探测**：
  - 用户点击“探测”按钮时，并发请求所有服务的 URL。
  - 计算 `performance.now()` 差值作为延迟时间。
- **安全拦截**：
  - 对于标记为 API 组的服务，在 `external` 模式下点击时，会拦截默认跳转，弹出 `AlertDialog` 提示用户添加 Token。

### 3. 图标处理 (`src/components/nav-icon.tsx`)
- 优先加载配置的 `icon` 图片。
- 图片加载失败或未配置时，自动回退显示首字母（Avatar 模式）。
- 支持懒加载和加载状态显示。

## 💻 开发指南

### 环境准备

确保本地已安装 Node.js (v18+) 和 npm/yarn/pnpm。

### 启动开发环境

```bash
npm run dev
```

### 修改样式

主要样式定义在 `src/app/globals.css` 中，使用了 CSS Variables 定义主题色。组件样式主要通过 Tailwind 类名在组件文件中直接定义。

### 添加新组件

推荐使用 Shadcn UI 的方式添加组件：
1. 安装依赖 (如 `@radix-ui/react-xxx`)。
2. 在 `src/components/ui` 下创建组件文件。
3. 结合 `class-variance-authority` (如果需要) 和 Tailwind 编写样式。

### 构建与部署

```bash
npm run build
npm start
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！在提交代码前，请确保：
1. 代码风格保持一致。
2. 没有引入明显的 Type 错误。
3. 新功能经过本地测试。
