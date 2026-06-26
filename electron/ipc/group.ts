import { IpcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { readData, writeData } from '../store'
import type { ProjectGroup } from '../../src/types'

const GROUPS_FILE = 'groups.json'

/**
 * 注册分组管理相关的 IPC handlers
 */
export function registerGroupHandlers(ipcMain: IpcMain): void {
  // 获取所有分组
  ipcMain.handle('group:getAll', async () => {
    return readData<ProjectGroup[]>(GROUPS_FILE, [])
  })

  // 添加分组
  ipcMain.handle('group:add', async (_event, name: string) => {
    const groups = readData<ProjectGroup[]>(GROUPS_FILE, [])
    const newGroup: ProjectGroup = {
      id: uuidv4(),
      name,
      collapsed: false,
      sortOrder: groups.length
    }
    groups.push(newGroup)
    writeData(GROUPS_FILE, groups)
    return newGroup
  })

  // 更新分组
  ipcMain.handle('group:update', async (_event, id: string, data: Partial<ProjectGroup>) => {
    const groups = readData<ProjectGroup[]>(GROUPS_FILE, [])
    const index = groups.findIndex(g => g.id === id)
    if (index === -1) {
      throw new Error(`分组不存在: ${id}`)
    }
    const existing = groups[index]
    groups[index] = {
      ...existing,
      name: data.name ?? existing.name,
      collapsed: data.collapsed ?? existing.collapsed,
      sortOrder: data.sortOrder ?? existing.sortOrder
    }
    writeData(GROUPS_FILE, groups)
    return groups[index]
  })

  // 删除分组
  ipcMain.handle('group:delete', async (_event, id: string) => {
    const groups = readData<ProjectGroup[]>(GROUPS_FILE, [])
    const filtered = groups.filter(g => g.id !== id)
    if (filtered.length === groups.length) {
      throw new Error(`分组不存在: ${id}`)
    }
    writeData(GROUPS_FILE, filtered)
  })

  // 重新排序分组
  ipcMain.handle('group:reorder', async (_event, orderedIds: string[]) => {
    const groups = readData<ProjectGroup[]>(GROUPS_FILE, [])
    for (let i = 0; i < orderedIds.length; i++) {
      const group = groups.find(g => g.id === orderedIds[i])
      if (group) {
        group.sortOrder = i
      }
    }
    writeData(GROUPS_FILE, groups)
  })
}
