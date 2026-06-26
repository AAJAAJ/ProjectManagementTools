import { contextBridge, ipcRenderer } from 'electron'

/**
 * Preload 脚本
 * 通过 contextBridge 安全暴露 IPC API 到渲染进程
 */

const electronAPI = {
  // 项目管理
  getProjects: () => ipcRenderer.invoke('project:getAll'),
  addProject: (project: any) => ipcRenderer.invoke('project:add', project),
  updateProject: (id: string, data: any) => ipcRenderer.invoke('project:update', id, data),
  deleteProject: (id: string) => ipcRenderer.invoke('project:delete', id),
  reorderProjects: (orderedIds: string[]) => ipcRenderer.invoke('project:reorder', orderedIds),
  scanAndImportProjects: (rootPath: string) => ipcRenderer.invoke('project:scanAndImport', rootPath),
  scanProjectsPreview: (rootPath: string) => ipcRenderer.invoke('project:scanPreview', rootPath),
  batchImportProjects: (paths: string[]) => ipcRenderer.invoke('project:batchImport', paths),
  scanCodeModules: (projectPath: string) => ipcRenderer.invoke('project:scanCodeModules', projectPath),
  toggleStar: (projectId: string) => ipcRenderer.invoke('project:toggleStar', projectId),

  // 批量操作
  batchToggleStar: (ids: string[]) => ipcRenderer.invoke('project:batchToggleStar', ids),
  batchMoveToGroup: (ids: string[], groupId: string | null) => ipcRenderer.invoke('project:batchMoveToGroup', ids, groupId),
  batchDelete: (ids: string[]) => ipcRenderer.invoke('project:batchDelete', ids),

  // 分组管理
  getGroups: () => ipcRenderer.invoke('group:getAll'),
  addGroup: (name: string) => ipcRenderer.invoke('group:add', name),
  updateGroup: (id: string, data: any) => ipcRenderer.invoke('group:update', id, data),
  deleteGroup: (id: string) => ipcRenderer.invoke('group:delete', id),
  reorderGroups: (orderedIds: string[]) => ipcRenderer.invoke('group:reorder', orderedIds),

  // 编辑器操作
  getAvailableEditors: () => ipcRenderer.invoke('editor:getAvailable'),
  rescanEditors: () => ipcRenderer.invoke('editor:rescan'),
  openInEditor: (editorId: string, path: string) => ipcRenderer.invoke('editor:open', editorId, path),

  // 文件操作
  openFolder: (path: string) => ipcRenderer.invoke('file:openFolder', path),
  selectFolder: () => ipcRenderer.invoke('file:selectFolder'),
  selectFile: (title?: string, filters?: { name: string; extensions: string[] }[]) => ipcRenderer.invoke('file:selectFile', title, filters),
  listFiles: (path: string) => ipcRenderer.invoke('file:listFiles', path),
  openFile: (path: string) => ipcRenderer.invoke('file:openFile', path),

  // 搜索
  search: (query: string) => ipcRenderer.invoke('search:query', query),

  // 设置
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: any) => ipcRenderer.invoke('settings:update', settings),
  prepareHotkeyRecord: () => ipcRenderer.invoke('settings:prepareRecord'),
  restoreHotkeyRecord: () => ipcRenderer.invoke('settings:restoreRecord'),

  // 工具管理
  getTools: () => ipcRenderer.invoke('tool:getAll'),
  addTool: (tool: any) => ipcRenderer.invoke('tool:add', tool),
  updateTool: (id: string, data: any) => ipcRenderer.invoke('tool:update', id, data),
  deleteTool: (id: string) => ipcRenderer.invoke('tool:delete', id),
  reorderTools: (orderedIds: string[]) => ipcRenderer.invoke('tool:reorder', orderedIds),
  openTool: (id: string) => ipcRenderer.invoke('tool:open', id),
  scanAndImportTools: (rootPath: string) => ipcRenderer.invoke('tool:scanAndImport', rootPath),
  scanToolIcon: (toolId: string) => ipcRenderer.invoke('tool:scanIcon', toolId),

  // 自动更新
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  onDownloadProgress: (callback: (progress: { percent: number; transferred: number; total: number }) => void) => {
    ipcRenderer.on('updater:download-progress', (_event, progress) => callback(progress))
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('updater:update-downloaded', () => callback())
  },

  // 窗口控制
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowMaximize: () => ipcRenderer.invoke('window:maximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),
  windowIsMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // 搜索窗口控制
  hideSearchWindow: () => ipcRenderer.invoke('searchWindow:hide'),
  openProjectInMain: (projectId: string) => ipcRenderer.invoke('searchWindow:openProjectInMain', projectId),

  // 事件监听
  onNavigateToProject: (callback: (projectId: string) => void) => {
    ipcRenderer.on('navigate-to-project', (_event, projectId) => callback(projectId))
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// 类型声明，供渲染进程使用
export type ElectronAPI = typeof electronAPI
