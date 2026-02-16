# Nexus — 企业工具平台

基于 **Electron + React + TypeScript** 的桌面工具平台，目前包含邮件批量外发模块。

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Electron + Electron Forge |
| 前端 | React 18 + TypeScript + Ant Design 5 |
| 构建 | Vite |
| 邮件 | Nodemailer |
| 路由 | React Router v6 |
| 状态 | Zustand |

## 开发

```bash
# 安装依赖
npm install

# 启动开发模式
npm start

# Linux 下需要禁用沙箱
ELECTRON_DISABLE_SANDBOX=1 npm start
```

## 打包

### Windows（在 Windows 电脑上执行）

```bash
# 打包为 Windows 安装程序（Squirrel）
npm run make

# 产物位于: out/make/squirrel.windows/x64/
# 文件: Nexus-x.x.x-Setup.exe
```

安装程序功能：

- ✅ 自动创建桌面快捷方式
- ✅ 自动创建开始菜单快捷方式
- ✅ 支持通过「添加/删除程序」卸载

### Linux

```bash
npm run make
# 产物位于 out/make/deb 或 out/make/rpm
```

## 项目结构

```
src/
├── main.ts                  # Electron 主进程入口
├── preload.ts               # IPC 安全桥接
├── shared/ipc.ts            # IPC 通道 & 类型定义
├── main/                    # 后端服务（Node.js）
│   ├── ipc/handlers.ts
│   └── services/
│       ├── config.service.ts
│       ├── email.service.ts
│       ├── project.service.ts
│       └── ini-parser.ts
└── renderer/                # 前端（React）
    ├── App.tsx
    ├── components/
    └── pages/
```

## 使用说明

1. 启动应用后，在「系统设置」中设置工作根目录
2. 将 `EmailAddress.csv` 放在工作根目录下
3. 在「SMTP 配置」中设置邮箱账号密码
4. 在「项目管理」中创建或查看项目
5. 在「批量发送」中选择项目并发送
