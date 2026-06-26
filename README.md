# 项目管理工具 (Project Management Tools)

基于 Electron + Vue 3 + Vite + TypeScript 的 Windows 桌面项目管理客户端。

## 特性

- 📁 **项目管理**：添加、编辑、删除、搜索项目，支持分组和拖拽排序
- 💻 **代码模块**：自动扫描识别 Java/前端/Go/Rust/Python/C# 等代码模块，一键打开编辑器
- 🔧 **工具管理**：管理本地免安装工具，面板模式快速启动，支持可执行文件/目录/命令
- 🔍 **全局搜索**：搜索项目、代码、工具，不同颜色区分，标签搜索
- 🏷️ **标签系统**：项目和工具支持自定义标签，按标签搜索
- ⭐ **星标置顶**：星标项目快速访问，代码模块置顶快捷打开
- 🎨 **主题切换**：浅色/深色/跟随系统
- ⌨️ **自定义快捷键**：全局搜索、应用内搜索、打开主窗口快捷键均可自定义
- 🔄 **自动更新**：支持 GitHub Release 自动检测更新

## 下载安装

1. 前往 [Releases](https://github.com/AAJAAJ/ProjectManagementTools/releases) 下载最新版安装包
2. 运行 `ProjectManagementTools_setup.exe`
3. 按照安装向导完成安装（默认安装路径 `D:\Program Files\ProjectManagementTools`）
4. 安装后自动创建桌面快捷方式和开始菜单

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本（生成安装包）
npm run build
```

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Electron | 28 | 跨平台桌面框架 |
| Vue 3 | 3.4 | 前端框架（Composition API） |
| Vite | 5 | 构建工具 |
| TypeScript | 5.3 | 类型安全 |
| Pinia | 2 | 状态管理 |
| Vue Router | 4 | 路由管理 |
| vuedraggable | 4 | 拖拽排序 |
| electron-builder | 24 | 打包工具 |
| electron-updater | latest | 自动更新 |

## 项目结构

```
├── electron/              # Electron 主进程
│   ├── main.ts           # 主进程入口
│   ├── preload.ts        # 预加载脚本（IPC 桥接）
│   ├── store.ts          # JSON 数据存储
│   └── ipc/              # IPC 处理器
│       ├── project.ts    # 项目管理（扫描、导入、代码识别）
│       ├── editor.ts     # 编辑器检测与启动
│       ├── tool.ts       # 工具管理
│       ├── search.ts     # 搜索引擎
│       ├── settings.ts   # 设置管理
│       ├── group.ts      # 分组管理
│       └── file.ts       # 文件操作
├── src/                  # Vue 渲染进程
│   ├── App.vue           # 根组件（侧边栏+全局搜索栏）
│   ├── main.ts           # 渲染进程入口
│   ├── components/       # 公共组件
│   │   ├── ProjectCard.vue    # 项目卡片
│   │   ├── ProjectDialog.vue  # 项目编辑对话框
│   │   ├── SearchOverlay.vue  # 搜索浮层
│   │   ├── ContextMenu.vue    # 右键菜单
│   │   └── TitleBar.vue       # 自定义标题栏
│   ├── views/            # 页面视图
│   │   ├── HomeView.vue       # 首页（项目列表）
│   │   ├── ProjectView.vue    # 项目详情
│   │   ├── ToolsView.vue      # 工具管理
│   │   ├── SettingsView.vue   # 设置页
│   │   └── SearchWindow.vue   # 搜索窗口
│   ├── stores/           # Pinia 状态管理
│   ├── router/           # Vue Router
│   ├── types/            # TypeScript 类型定义
│   └── styles/           # 全局样式
├── build/                # 构建资源
│   └── icon.ico          # 应用图标
├── electron-builder.json5  # 打包配置
└── package.json
```

## 开源协议

本项目使用 MIT 协议。所使用的开源组件各自遵循其协议：

- Electron: MIT
- Vue: MIT
- Vite: MIT
- TypeScript: Apache-2.0
- Pinia: MIT
- Vue Router: MIT
- vuedraggable: MIT
- electron-builder: MIT
- electron-updater: MIT

## 版本

当前版本：v1.0.0

详见 [CHANGELOG](https://github.com/AAJAAJ/ProjectManagementTools/releases)。
