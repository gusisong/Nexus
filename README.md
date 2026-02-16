# Nexus (企业工具平台)

Nexus 是一个基于 Electron + React + TypeScript 构建的现代化企业工具平台，旨在整合各类办公自动化工具。目前核心功能包括「邮件批量发送」与「项目文件管理」。

## ✨ 核心特性

- **项目管理**：
  - 双栏式文件管理（左侧项目树 + 右侧文件表）
  - 支持文件/文件夹拖拽上传
  - 内置 CSV 编辑器（支持 BOM 及编码自动识别）
  - 项目/文件增删改查
- **邮件群发**：
  - 支持 SMTP 协议批量发送
  - 智能限流与重试机制（避免 421 错误）
  - 实时发送进度监控
  - 自动识别 `.xlsx` 附件并匹配供应商代码
- **现代化架构**：
  - 强类型 IPC 通信（Result<T> 模式）
  - Zustand 全局状态管理
  - Ant Design 5.0 UI 组件库

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- NPM >= 8.0.0

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm start
```

此命令将启动 Electron 主进程及 Vite 开发服务器（渲染进程），支持热重载。

### 构建应用

```bash
# 生成可执行文件 (Linux: .deb/.rpm, Windows: .exe w/ Squirrel)
npm run make
```

构建产物将输出至 `out/` 目录。

## 📁 目录结构

```
src/
├── main/              # Electron 主进程
│   ├── ipc/           # IPC 处理器注册
│   └── services/      # 后端业务逻辑 (文件、项目、邮件等)
├── renderer/          # React 渲染进程
│   ├── components/    # 通用 UI 组件
│   ├── hooks/         # 自定义 Hooks (业务逻辑封装)
│   ├── pages/         # 页面视图 (项目管理、发送面板等)
│   └── stores/        # Zustand 状态库
└── shared/            # 前后端共享类型 (IPC 契约、Result 定义)
```

## 🛠️ 技术栈

- Electron 33.0
- React 19 + TypeScript
- Vite 5.4
- Ant Design 5.x
- Zustand (状态管理)
- Nodemailer (邮件发送)
- Papaparse (CSV 处理)

## 📄 许可证

MIT
