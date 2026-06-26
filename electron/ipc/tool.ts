import { IpcMain } from 'electron'
import { existsSync, readdirSync, statSync } from 'fs'
import { spawn } from 'child_process'
import { join, dirname, basename, extname } from 'path'
import { readData, writeData } from '../store'
import type { ToolItem } from '../../src/types'

const TOOLS_FILE = 'tools.json'

/** 工具展示颜色调色板（按名称哈希分配） */
const TOOL_COLORS = [
  '#4f8cff', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#eab308'
]

/** 常见图标文件名（按优先级排序） */
const ICON_FILENAMES = [
  'icon.ico', 'icon.png', 'icon.svg', 'icon.bmp',
  'logo.png', 'logo.svg', 'logo.ico',
  'favicon.ico', 'favicon.png',
  'app.ico', 'app.png'
]

/** 图标文件扩展名 */
const ICON_EXTENSIONS = ['.ico', '.png', '.svg']

/**
 * 根据工具名称生成稳定的颜色
 */
function getColorForTool(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash |= 0
  }
  return TOOL_COLORS[Math.abs(hash) % TOOL_COLORS.length]
}

/**
 * 扫描工具图标文件
 * - 可执行文件：在同目录查找同名 .ico/.png，或常见图标文件名
 * - 目录：在目录内查找常见图标文件名
 * - 命令：无图标
 */
function scanIconForTool(tool: ToolItem): string | undefined {
  if (tool.type === 'command') return undefined

  const targetDir = tool.type === 'directory' ? tool.path : dirname(tool.path)
  if (!existsSync(targetDir)) return undefined

  try {
    const entries = readdirSync(targetDir)
    const fileNames = entries.filter(e => {
      const fullPath = join(targetDir, e)
      try { return statSync(fullPath).isFile() } catch { return false }
    })

    // 1. 优先查找与可执行文件同名的图标
    if (tool.type === 'executable') {
      const baseName = basename(tool.path, extname(tool.path))
      for (const ext of ICON_EXTENSIONS) {
        const candidate = `${baseName}${ext}`
        if (fileNames.includes(candidate)) {
          return join(targetDir, candidate)
        }
      }
    }

    // 2. 查找常见图标文件名
    for (const iconFile of ICON_FILENAMES) {
      if (fileNames.includes(iconFile)) {
        return join(targetDir, iconFile)
      }
    }

    // 3. 查找目录中任意 .ico 文件
    const icoFiles = fileNames.filter(f => f.toLowerCase().endsWith('.ico'))
    if (icoFiles.length > 0) {
      return join(targetDir, icoFiles[0])
    }
  } catch { /* ignore */ }

  return undefined
}

/**
 * 注册工具管理相关的 IPC handlers
 */
export function registerToolHandlers(ipcMain: IpcMain): void {
  // 获取所有工具
  ipcMain.handle('tool:getAll', async () => {
    const tools = readData<ToolItem[]>(TOOLS_FILE, [])
    return tools.map(t => ({
      ...t,
      installed: t.type === 'command' ? true : existsSync(t.path)
    }))
  })

  // 添加工具
  ipcMain.handle('tool:add', async (_event, toolData: Omit<ToolItem, 'id'>) => {
    const tools = readData<ToolItem[]>(TOOLS_FILE, [])
    const newTool: ToolItem = {
      ...toolData,
      id: 'tool-' + Date.now(),
      sortOrder: tools.length,
      tags: Array.isArray(toolData.tags) ? [...toolData.tags] : [],
      color: toolData.color || getColorForTool(toolData.name)
    }
    tools.push(newTool)
    writeData(TOOLS_FILE, tools)
    return newTool
  })

  // 更新工具
  ipcMain.handle('tool:update', async (_event, id: string, data: Partial<ToolItem>) => {
    console.log('[tool:update] 收到数据:', JSON.stringify({ id, data }))
    const tools = readData<ToolItem[]>(TOOLS_FILE, [])
    const index = tools.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error(`工具不存在: ${id}`)
    }
    const existing = tools[index]
    // 构建更新后的工具对象，显式处理每个字段避免 undefined 覆盖
    const updated: ToolItem = {
      ...existing,
      name: data.name !== undefined ? data.name : existing.name,
      type: data.type !== undefined ? data.type : existing.type,
      path: data.path !== undefined ? data.path : existing.path,
      args: data.args !== undefined ? data.args : existing.args,
      workDir: data.workDir !== undefined ? data.workDir : existing.workDir,
      icon: data.icon !== undefined ? data.icon : existing.icon,
      iconPath: data.iconPath !== undefined ? data.iconPath : existing.iconPath,
      color: data.color || existing.color || getColorForTool(existing.name),
      description: data.description !== undefined ? data.description : existing.description,
      tags: data.tags !== undefined ? [...data.tags] : (existing.tags || []),
      sortOrder: data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder
    }
    tools[index] = updated
    console.log('[tool:update] 保存后 tags:', JSON.stringify(updated.tags))
    writeData(TOOLS_FILE, tools)
    return updated
  })

  // 删除工具
  ipcMain.handle('tool:delete', async (_event, id: string) => {
    const tools = readData<ToolItem[]>(TOOLS_FILE, [])
    const filtered = tools.filter(t => t.id !== id)
    writeData(TOOLS_FILE, filtered)
  })

  // 重新排序工具
  ipcMain.handle('tool:reorder', async (_event, orderedIds: string[]) => {
    const tools = readData<ToolItem[]>(TOOLS_FILE, [])
    for (let i = 0; i < orderedIds.length; i++) {
      const tool = tools.find(t => t.id === orderedIds[i])
      if (tool) {
        tool.sortOrder = i
      }
    }
    writeData(TOOLS_FILE, tools)
  })

  // 打开工具
  ipcMain.handle('tool:open', async (_event, id: string) => {
    const tools = readData<ToolItem[]>(TOOLS_FILE, [])
    const tool = tools.find(t => t.id === id)
    if (!tool) {
      throw new Error(`工具不存在: ${id}`)
    }

    if (tool.type === 'directory') {
      // 打开目录
      const { shell } = require('electron')
      await shell.openPath(tool.path)
    } else if (tool.type === 'command') {
      // 执行命令
      const args: string[] = []
      if (tool.args) {
        args.push(...tool.args.split(/\s+/).filter(Boolean))
      }
      const options: any = {
        detached: true,
        stdio: 'ignore',
        shell: true
      }
      if (tool.workDir) {
        options.cwd = tool.workDir
      }
      spawn(tool.path, args, options).unref()
    } else {
      // 启动可执行文件
      const args: string[] = []
      if (tool.args) {
        args.push(...tool.args.split(/\s+/).filter(Boolean))
      }
      const options: any = {
        detached: true,
        stdio: 'ignore',
        shell: true
      }
      if (tool.workDir) {
        options.cwd = tool.workDir
      }
      spawn(`"${tool.path}"`, args, options).unref()
    }
  })

  // 扫描工具目录
  ipcMain.handle('tool:scanAndImport', async (_event, rootPath: string) => {
    const { readdirSync, statSync } = require('fs')
    const { join } = require('path')
    const tools = readData<ToolItem[]>(TOOLS_FILE, [])
    const existingPaths = new Set(tools.map(t => t.path))
    let imported = 0
    let skipped = 0

    try {
      const entries = readdirSync(rootPath)
      for (const entry of entries) {
        const fullPath = join(rootPath, entry)
        try {
          const stat = statSync(fullPath)
          if (stat.isDirectory()) {
            if (existingPaths.has(fullPath)) {
              skipped++
              continue
            }
            const newTool: ToolItem = {
              id: 'tool-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
              name: entry,
              path: fullPath,
              type: 'directory',
              sortOrder: tools.length + imported
            }
            tools.push(newTool)
            imported++
          } else if (/\.(exe|bat|cmd)$/i.test(entry)) {
            if (existingPaths.has(fullPath)) {
              skipped++
              continue
            }
            const name = entry.replace(/\.(exe|bat|cmd)$/i, '')
            const newTool: ToolItem = {
              id: 'tool-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
              name,
              path: fullPath,
              type: 'executable',
              sortOrder: tools.length + imported
            }
            tools.push(newTool)
            imported++
          }
        } catch { /* skip inaccessible entries */ }
      }
    } catch { /* skip inaccessible directory */ }

    if (imported > 0) {
      writeData(TOOLS_FILE, tools)
    }

    return { imported, skipped }
  })

  // 扫描工具图标（异步）
  // 查找工具目录中的图标文件，并分配颜色，结果保存到工具数据中
  ipcMain.handle('tool:scanIcon', async (_event, toolId: string) => {
    const tools = readData<ToolItem[]>(TOOLS_FILE, [])
    const index = tools.findIndex(t => t.id === toolId)
    if (index === -1) {
      throw new Error(`工具不存在: ${toolId}`)
    }
    const tool = tools[index]
    const iconPath = scanIconForTool(tool)
    const color = tool.color || getColorForTool(tool.name)
    // 保存扫描结果
    tools[index].iconPath = iconPath
    tools[index].color = color
    writeData(TOOLS_FILE, tools)
    return { iconPath, color }
  })
}
