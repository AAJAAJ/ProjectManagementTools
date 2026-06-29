import { IpcMain } from 'electron'
import { readData, writeData } from '../store'
import type { Settings } from '../../src/types'

const SETTINGS_FILE = 'settings.json'

/**
 * 默认设置
 */
const DEFAULT_SETTINGS: Settings = {
  workspacePath: 'D:\\Projects',
  toolWorkspacePath: '',
  hotkey: 'Alt+Space',
  appHotkey: 'Ctrl+F',
  mainWindowHotkey: 'Alt+W',
  theme: 'system',
  editors: [],
  customEditors: [],
  defaultEditorId: '',
  firstRun: true,
  autoUpdate: true,
  closeAction: '',
}

/**
 * 获取当前设置（供其他模块调用）
 */
export function getCurrentSettings(): Settings {
  return readData<Settings>(SETTINGS_FILE, DEFAULT_SETTINGS)
}

/**
 * 更新当前设置（供主进程其他模块直接持久化部分字段）
 */
export function updateCurrentSettings(partial: Partial<Settings>): Settings {
  const current = readData<Settings>(SETTINGS_FILE, DEFAULT_SETTINGS)
  const updated: Settings = { ...DEFAULT_SETTINGS, ...current, ...partial }
  writeData(SETTINGS_FILE, updated)
  return updated
}

/**
 * 注册设置相关的 IPC handlers
 */
export function registerSettingsHandlers(ipcMain: IpcMain): void {
  // 获取设置
  ipcMain.handle('settings:get', async () => {
    const settings = readData<Settings>(SETTINGS_FILE, DEFAULT_SETTINGS)
    // 确保返回值包含所有必需字段（兼容旧数据）
    return {
      ...DEFAULT_SETTINGS,
      ...settings
    }
  })

  // 更新设置
  ipcMain.handle('settings:update', async (_event, partialSettings: Partial<Settings>) => {
    const current = readData<Settings>(SETTINGS_FILE, DEFAULT_SETTINGS)

    // 合并设置，确保不丢失字段
    const updated: Settings = {
      ...DEFAULT_SETTINGS,
      ...current,
      ...partialSettings
    }

    // 数据校验
    if (updated.theme && !['light', 'dark', 'system'].includes(updated.theme)) {
      updated.theme = 'system'
    }
    if (updated.hotkey && typeof updated.hotkey !== 'string') {
      updated.hotkey = DEFAULT_SETTINGS.hotkey
    }

    writeData(SETTINGS_FILE, updated)
    return updated
  })
}
