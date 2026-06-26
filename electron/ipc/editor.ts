import { IpcMain } from 'electron'
import { existsSync, readdirSync } from 'fs'
import { spawn, execSync } from 'child_process'
import { join } from 'path'
import type { Editor } from '../../src/types'
import { getCurrentSettings } from './settings'

/**
 * 编辑器检测和启动模块
 * 支持 VS Code、IntelliJ IDEA、Trae-CN、Qoder
 */

// 编辑器检测结果缓存
let editorCache: Editor[] | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60 * 1000 // 缓存有效期 60 秒

const USERNAME = process.env.USERNAME || process.env.USERPROFILE?.split('\\').pop() || ''

/**
 * 编辑器配置定义
 */
interface EditorConfig {
  id: string
  name: string
  searchPaths: string[]
  command?: string  // PATH 中的命令名
  icon?: string
}

/**
 * 所有支持的编辑器配置
 */
const EDITOR_CONFIGS: EditorConfig[] = [
  {
    id: 'vscode',
    name: 'Visual Studio Code',
    searchPaths: [
      `C:\\Users\\${USERNAME}\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe`,
      'C:\\Program Files\\Microsoft VS Code\\Code.exe',
      'C:\\Program Files (x86)\\Microsoft VS Code\\Code.exe'
    ],
    command: 'code',
    icon: 'vscode'
  },
  {
    id: 'idea',
    name: 'IntelliJ IDEA',
    searchPaths: [
      // JetBrains Toolbox 安装路径
      `C:\\Users\\${USERNAME}\\AppData\\Local\\JetBrains\\Toolbox\\apps`,
      // 标准安装路径
      'C:\\Program Files\\JetBrains'
    ],
    icon: 'idea'
  },
  {
    id: 'trae-cn',
    name: 'Trae CN',
    searchPaths: [
      `C:\\Users\\${USERNAME}\\AppData\\Local\\Programs\\Trae CN\\Trae CN.exe`
    ],
    command: 'trae',
    icon: 'trae'
  },
  {
    id: 'qoder',
    name: 'Qoder',
    searchPaths: [
      `C:\\Users\\${USERNAME}\\AppData\\Local\\Programs\\Qoder\\Qoder.exe`
    ],
    command: 'qoder',
    icon: 'qoder'
  }
]

/**
 * 通过 where 命令检测 PATH 中是否有某个命令
 */
function findInPath(command: string): string | null {
  try {
    const result = execSync(`where ${command}`, {
      encoding: 'utf-8',
      timeout: 5000,
      windowsHide: true
    }).trim()
    // where 可能返回多行，取第一行
    const firstLine = result.split('\n')[0].trim()
    if (firstLine && existsSync(firstLine)) {
      return firstLine
    }
    return firstLine || null
  } catch {
    return null
  }
}

/**
 * 查找 IntelliJ IDEA 安装路径
 * 需要在目录中搜索，因为版本号会变化
 */
function findIdeaPath(): string | null {
  // 方法1: JetBrains Toolbox
  const toolboxAppsDir = `C:\\Users\\${USERNAME}\\AppData\\Local\\JetBrains\\Toolbox\\apps`
  if (existsSync(toolboxAppsDir)) {
    try {
      const apps = readdirSync(toolboxAppsDir)
      for (const app of apps) {
        if (app.startsWith('IDEA') || app.includes('idea')) {
          const appDir = join(toolboxAppsDir, app)
          // 在 app 目录下搜索 idea64.exe
          const ideaExe = findExeInDir(appDir, 'idea64.exe')
          if (ideaExe) return ideaExe
        }
      }
    } catch { /* ignore */ }
  }

  // 方法2: 标准安装路径 C:\Program Files\JetBrains\
  const jetbrainsDir = 'C:\\Program Files\\JetBrains'
  if (existsSync(jetbrainsDir)) {
    try {
      const dirs = readdirSync(jetbrainsDir)
      for (const dir of dirs) {
        if (dir.startsWith('IntelliJ IDEA')) {
          const ideaExe = join(jetbrainsDir, dir, 'bin', 'idea64.exe')
          if (existsSync(ideaExe)) return ideaExe
        }
      }
    } catch { /* ignore */ }
  }

  // 方法3: 通过 where 命令
  const fromPath = findInPath('idea64')
  if (fromPath) return fromPath

  return null
}

/**
 * 递归在目录中查找指定的 exe 文件（最多递归3层）
 */
function findExeInDir(dir: string, exeName: string, depth: number = 0): string | null {
  if (depth > 3) return null
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isFile() && entry.name.toLowerCase() === exeName.toLowerCase()) {
        return fullPath
      }
      if (entry.isDirectory() && depth < 3) {
        const found = findExeInDir(fullPath, exeName, depth + 1)
        if (found) return found
      }
    }
  } catch { /* ignore permission errors */ }
  return null
}

/**
 * 检测单个编辑器是否安装
 */
function detectSingleEditor(config: EditorConfig): Editor {
  const editor: Editor = {
    id: config.id,
    name: config.name,
    path: '',
    installed: false,
    icon: config.icon,
    custom: false
  }

  // IDEA 需要特殊处理（目录中搜索）
  if (config.id === 'idea') {
    const ideaPath = findIdeaPath()
    if (ideaPath) {
      editor.path = ideaPath
      editor.installed = true
    }
    return editor
  }

  // 方法1: 检查常见安装路径
  for (const searchPath of config.searchPaths) {
    if (existsSync(searchPath)) {
      editor.path = searchPath
      editor.installed = true
      return editor
    }
  }

  // 方法2: 通过 PATH 中的命令检测
  if (config.command) {
    const foundPath = findInPath(config.command)
    if (foundPath) {
      editor.path = foundPath
      editor.installed = true
      return editor
    }
  }

  return editor
}

/**
 * 检测所有编辑器，带缓存
 */
function detectEditors(): Editor[] {
  const now = Date.now()
  // 使用缓存（60秒内有效）
  if (editorCache && (now - cacheTimestamp) < CACHE_TTL) {
    return editorCache
  }

  const editors: Editor[] = EDITOR_CONFIGS.map(config => detectSingleEditor(config))
  
  // 更新缓存
  editorCache = editors
  cacheTimestamp = now

  return editors
}

/**
 * 清除编辑器缓存（设置变更时调用）
 */
export function clearEditorCache(): void {
  editorCache = null
  cacheTimestamp = 0
}

/**
 * 获取合并后的编辑器列表（自动检测 + 用户路径覆盖 + 用户自定义）
 */
function getMergedEditors(): Editor[] {
  const detected = detectEditors()
  const settings = getCurrentSettings()

  // 应用用户在 settings.editors 中保存的路径覆盖
  const editorOverrides = settings.editors || []
  const mergedDetected = detected.map(editor => {
    const override = editorOverrides.find(e => e.id === editor.id)
    if (override && override.path) {
      const pathExists = existsSync(override.path)
      return {
        ...editor,
        path: override.path,
        args: override.args !== undefined ? override.args : editor.args,
        installed: pathExists
      }
    }
    return editor
  })

  const customEditors: Editor[] = (settings.customEditors || []).map(e => ({
    ...e,
    installed: e.path ? existsSync(e.path) : false,
    custom: true
  }))
  return [...mergedDetected, ...customEditors]
}

/**
 * 注册编辑器相关的 IPC handlers
 */
export function registerEditorHandlers(ipcMain: IpcMain): void {
  // 获取可用编辑器列表（合并自动检测+自定义）
  ipcMain.handle('editor:getAvailable', async () => {
    return getMergedEditors()
  })

  // 重新扫描编辑器（清除缓存后重新检测）
  ipcMain.handle('editor:rescan', async () => {
    clearEditorCache()
    return getMergedEditors()
  })

  // 用指定编辑器打开路径
  ipcMain.handle('editor:open', async (_event, editorId: string, projectPath: string) => {
    const allEditors = getMergedEditors()
    const editor = allEditors.find(e => e.id === editorId)

    if (!editor || !editor.installed) {
      throw new Error(`编辑器未安装或未找到: ${editorId}`)
    }

    try {
      // 构建启动参数
    const args: string[] = []
    if (editor.args) {
      args.push(...editor.args.split(/\s+/).filter(Boolean))
    }
    args.push(projectPath)

    // 根据编辑器类型确定启动方式
    switch (editorId) {
      case 'vscode': {
        // VS Code 优先使用 code 命令
        const cmd = editor.path.toLowerCase().endsWith('.exe') ? editor.path : 'code'
        spawn(cmd, args, {
          detached: true,
          stdio: 'ignore',
          shell: true
        }).unref()
        break
      }
      case 'idea': {
        // IDEA: "可执行文件" "代码目录"
        spawn(`"${editor.path}"`, [`"${projectPath}"`], {
          detached: true,
          stdio: 'ignore',
          shell: true
        }).unref()
        break
      }
      case 'trae-cn': {
        // Trae CN: "可执行文件" "代码目录" > nul 2>&1
        spawn(`"${editor.path}" "${projectPath}" > nul 2>&1`, [], {
          detached: true,
          stdio: 'ignore',
          shell: true
        }).unref()
        break
      }
      default: {
        // 其他编辑器：统一用双引号包裹路径
        spawn(`"${editor.path}"`, [`"${projectPath}"`], {
          detached: true,
          stdio: 'ignore',
          shell: true
        }).unref()
      }
    }
    } catch (error) {
      throw new Error(`启动编辑器失败: ${(error as Error).message}`)
    }
  })
}
