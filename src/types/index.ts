/**
 * 项目管理工具 - 类型定义
 */

/** 项目分组 */
export interface ProjectGroup {
  id: string
  name: string
  collapsed: boolean
  sortOrder: number
}

/** 代码模块 */
export interface CodeModule {
  path: string       // 代码目录路径
  label: string      // 备注标签，如 "前端"、"后端"、"微服务A"、"工具库" 等
  language?: string  // 主要语言（可选）
  framework?: string // 框架（可选）
  editorId?: string  // 指定的默认编辑器ID，空则使用列表中第一个
  pinned?: boolean   // 是否置顶
}

/** 项目 */
export interface Project {
  id: string
  name: string
  description: string
  path: string           // 项目根目录
  codeModules: CodeModule[]  // 代码模块列表
  docs?: string          // 文件/文档目录路径
  createdAt: string
  updatedAt: string
  tags: string[]
  sortOrder?: number     // 排序序号，用于拖拽排序
  groupId?: string       // 所属分组ID，空则为未分组
  starred?: boolean      // 是否星标
}

/** 项目输入（创建/更新时使用） */
export interface ProjectInput {
  name: string
  description: string
  path: string
  codeModules: CodeModule[]
  docs?: string
  tags?: string[]
}

/** 编辑器 */
export interface Editor {
  id: string
  name: string        // 显示名称
  path: string        // 可执行文件路径
  icon?: string       // 图标标识（预设图标名或自定义）
  args?: string       // 额外启动参数（如 --new-window）
  installed: boolean  // 是否检测到已安装
  custom: boolean     // 是否为用户自定义添加的
}

/** 搜索结果 */
export interface SearchResult {
  type: 'project' | 'file' | 'code' | 'tool'
  title: string
  subtitle: string
  path: string
  projectId?: string
  toolId?: string
}

/** 应用设置 */
export interface Settings {
  workspacePath: string
  toolWorkspacePath: string   // 工具默认工作区
  hotkey: string              // 全局搜索快捷键
  appHotkey: string           // 应用内搜索快捷键
  mainWindowHotkey: string    // 打开主窗口快捷键
  theme: 'light' | 'dark' | 'system'
  editors: Editor[]
  customEditors: Editor[]  // 用户自定义编辑器列表
  defaultEditorId: string     // 默认编辑器ID
  firstRun: boolean           // 是否首次运行（用于自动扫描）
  autoUpdate?: boolean  // 是否启用自动更新
}

/** 扫描导入结果 */
export interface ScanResult {
  imported: number
  skipped: number
  projects: Project[]
}

/** 扫描预览候选项 */
export interface ScanCandidate {
  name: string
  path: string
  exists: boolean         // 是否已存在同路径项目
  codeModuleCount: number // 识别到的代码模块数
  hasDocs: boolean        // 是否有文档目录
}

/** 文件条目 */
export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  extension: string
  modifiedAt: string
}

/** 工具条目 */
export interface ToolItem {
  id: string
  name: string        // 工具名称
  path: string        // 可执行文件路径或目录路径或命令
  type: 'executable' | 'directory' | 'command'  // 类型：可执行文件、目录、命令
  args?: string       // 启动参数（仅可执行文件）
  workDir?: string    // 默认工作区目录
  icon?: string       // 图标标识（文件路径或预设图标名）
  iconPath?: string   // 扫描到的图标文件路径
  color?: string      // 显示颜色（用于展示模式小方块背景）
  description?: string // 描述
  tags?: string[]     // 标签
  sortOrder?: number  // 排序序号
}

/** Electron API 接口（渲染进程调用） */
export interface ElectronAPI {
  // 项目管理
  getProjects(): Promise<Project[]>
  addProject(project: ProjectInput): Promise<Project>
  updateProject(id: string, data: Partial<ProjectInput>): Promise<Project>
  deleteProject(id: string): Promise<void>
  reorderProjects(orderedIds: string[]): Promise<void>
  scanAndImportProjects(rootPath: string): Promise<ScanResult>
  scanProjectsPreview(rootPath: string): Promise<ScanCandidate[]>
  batchImportProjects(paths: string[]): Promise<{ imported: number; skipped: number }>
  scanCodeModules(projectPath: string): Promise<CodeModule[]>
  toggleStar(projectId: string): Promise<Project>

  // 批量操作
  batchToggleStar(ids: string[]): Promise<Project[]>
  batchMoveToGroup(ids: string[], groupId: string | null): Promise<Project[]>
  batchDelete(ids: string[]): Promise<void>

  // 分组管理
  getGroups(): Promise<ProjectGroup[]>
  addGroup(name: string): Promise<ProjectGroup>
  updateGroup(id: string, data: Partial<ProjectGroup>): Promise<ProjectGroup>
  deleteGroup(id: string): Promise<void>
  reorderGroups(orderedIds: string[]): Promise<void>

  // 编辑器操作
  getAvailableEditors(): Promise<Editor[]>
  rescanEditors(): Promise<Editor[]>
  openInEditor(editorId: string, path: string): Promise<void>

  // 文件操作
  openFolder(path: string): Promise<void>
  selectFolder(): Promise<string | null>
  selectFile(title?: string, filters?: { name: string; extensions: string[] }[]): Promise<string | null>
  listFiles(path: string): Promise<FileEntry[]>
  openFile(path: string): Promise<void>

  // 搜索
  search(query: string): Promise<SearchResult[]>

  // 设置
  getSettings(): Promise<Settings>
  updateSettings(settings: Partial<Settings>): Promise<Settings>
  prepareHotkeyRecord(): Promise<void>
  restoreHotkeyRecord(): Promise<void>

  // 工具管理
  getTools(): Promise<ToolItem[]>
  addTool(tool: Omit<ToolItem, 'id'>): Promise<ToolItem>
  updateTool(id: string, data: Partial<ToolItem>): Promise<ToolItem>
  deleteTool(id: string): Promise<void>
  reorderTools(orderedIds: string[]): Promise<void>
  openTool(id: string): Promise<void>
  scanAndImportTools(rootPath: string): Promise<{ imported: number; skipped: number }>
  scanToolIcon(toolId: string): Promise<{ iconPath?: string; color?: string } | null>

  // 窗口控制
  windowMinimize(): Promise<void>
  windowMaximize(): Promise<void>
  windowClose(): Promise<void>
  windowIsMaximized(): Promise<boolean>

  // 搜索窗口控制
  hideSearchWindow(): Promise<void>
  openProjectInMain(projectId: string): Promise<void>

  // 事件监听
  onNavigateToProject(callback: (projectId: string) => void): void

  // 自动更新
  checkForUpdates(): Promise<{ hasUpdate: boolean; version: string | null; releaseNotes: any; error?: string }>
  downloadUpdate(): Promise<boolean>
  installUpdate(): Promise<void>
  onDownloadProgress(callback: (progress: { percent: number; transferred: number; total: number }) => void): void
  onUpdateDownloaded(callback: () => void): void
}
