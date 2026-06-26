import { IpcMain, dialog, shell } from 'electron'
import { readdirSync, statSync } from 'fs'
import { join, extname, basename } from 'path'

/**
 * 文件条目信息
 */
interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  extension: string
  modifiedAt: string
}

/**
 * 注册文件操作相关的 IPC handlers
 */
export function registerFileHandlers(ipcMain: IpcMain): void {
  // 在资源管理器中打开文件夹
  ipcMain.handle('file:openFolder', async (_event, path: string) => {
    try {
      const result = await shell.openPath(path)
      if (result) {
        throw new Error(result)
      }
    } catch (error) {
      throw new Error(`无法打开文件夹: ${path} - ${(error as Error).message}`)
    }
  })

  // 选择文件夹（打开文件夹选择对话框）
  ipcMain.handle('file:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择文件夹'
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  // 选择文件（用于选择编辑器可执行文件等）
  ipcMain.handle('file:selectFile', async (_event, title?: string, filters?: { name: string; extensions: string[] }[]) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: title || '选择文件',
      filters: filters || [
        { name: '可执行文件', extensions: ['exe'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  // 列出指定目录的文件和子目录
  ipcMain.handle('file:listFiles', async (_event, dirPath: string) => {
    try {
      const entries = readdirSync(dirPath, { withFileTypes: true })
      const fileEntries: FileEntry[] = []

      for (const entry of entries) {
        // 跳过隐藏文件和系统文件
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue
        }

        const fullPath = join(dirPath, entry.name)
        try {
          const stats = statSync(fullPath)
          fileEntries.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: stats.size,
            extension: entry.isDirectory() ? '' : extname(entry.name).toLowerCase(),
            modifiedAt: stats.mtime.toISOString()
          })
        } catch {
          // 跳过无法访问的文件
          continue
        }
      }

      // 排序：文件夹优先，然后按名称排序
      fileEntries.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name, 'zh-CN')
      })

      return fileEntries
    } catch (error) {
      throw new Error(`无法列出目录内容: ${dirPath} - ${(error as Error).message}`)
    }
  })

  // 使用系统默认程序打开文件
  ipcMain.handle('file:openFile', async (_event, filePath: string) => {
    try {
      const result = await shell.openPath(filePath)
      if (result) {
        throw new Error(result)
      }
    } catch (error) {
      throw new Error(`无法打开文件: ${basename(filePath)} - ${(error as Error).message}`)
    }
  })
}
