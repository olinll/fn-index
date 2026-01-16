# FN Index (飞牛导航)

FN Index 是一个专为 NAS 用户设计的现代化、响应式服务导航页。它支持内网/外网双模式自动切换，提供服务延迟探测、快捷搜索、主题切换等功能，帮助你高效管理和访问家庭实验室服务。

![Screenshot](public/miyou.png)

## ✨ 主要功能

- **双重网络模式**：
  - **内部模式**：优先使用局域网 IP 访问，速度更快。
  - **外部模式**：使用域名/公网 IP 访问，适合远程连接。
  - **自动探测**：支持配置探测地址（`probeUrl`），自动检测当前网络环境并切换模式。
- **服务延迟探测**：内置延迟检测功能，实时显示各服务的响应速度（毫秒级）。
- **智能搜索**：支持通过服务名称或描述快速筛选服务。
- **现代化 UI**：
  - 响应式设计，完美适配移动端和桌面端。
  - 支持深色/浅色主题切换。
  - 玻璃拟态风格头部，平滑的动画效果。
- **配置灵活**：所有服务配置通过 `service.yaml` 文件管理，简单直观。
- **安全提示**：针对外部网络访问敏感服务（如 API 组），提供二次确认弹窗，防止误操作。
- **剪贴板集成**：非 HTTP 链接或特定场景下支持一键复制链接。

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/fn-index.git
cd fn-index
```

### 2. 安装依赖

```bash
npm install
# 或者
yarn install
```

### 3. 配置服务

在项目根目录下创建或修改 `service.yaml` 文件。示例配置如下：

```yaml
title: "我的导航"
description: "HomeLab Services Dashboard"
favicon: "/miyou.png" # 网站图标
probeUrl: "http://10.0.0.1" # 用于探测内网环境的地址

groups:
  - name: "核心服务"
    description: "常用基础设施"
    items:
      - name: "路由器"
        description: "主路由管理后台"
        icon: "/icons/router.png"
        internalUrl: "http://192.168.1.1"
        externalUrl: "https://router.example.com"
      
  - name: "媒体中心"
    items:
      - name: "Jellyfin"
        description: "影视媒体库"
        externalUrl: "https://jellyfin.example.com"
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 即可看到导航页。

### 5. 构建生产版本

```bash
npm run build
npm start
```

## ⚙️ 配置说明 (`service.yaml`)

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 页面标题 |
| `description` | string | 页面副标题/描述 |
| `favicon` | string | 浏览器标签页图标路径 |
| `probeUrl` | string | (可选) 用于检测内网连通性的 URL。若能访问，自动切换至内部模式。 |
| `groups` | array | 服务分组列表 |

### Group 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 分组名称 |
| `description` | string | (可选) 分组描述，显示在标题下方 |
| `api` | object | (可选) API 配置，若存在，该组下的服务在外部模式访问时会有安全弹窗提示。 |
| `items` | array | 服务项目列表 |

### Item 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 服务名称 |
| `description` | string | (可选) 服务描述 |
| `icon` | string | (可选) 图标路径。若未设置，尝试自动获取 favicon。 |
| `internalUrl` | string | (可选) 内网访问地址 |
| `externalUrl` | string | (可选) 外网访问地址。若无 internalUrl，内网模式也会使用此地址。 |

## 🛠️ 环境变量

如果需要集成外部 API 服务（如 FN Connect），请复制 `.env.example` 到 `.env.local` 并配置：

```bash
FN_ID=your_id
FN_USERNAME=your_username
FN_PASSWORD=your_password
FN_KEY=your_key
```

## 📄 许可证

MIT License
