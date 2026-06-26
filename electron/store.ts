import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

/**
 * 简单的 JSON 文件存储模块
 * 数据保存在应用目录/data/ 下
 */

let dataDir: string = ''

/**
 * 初始化存储模块，设置数据目录并确保默认数据文件存在
 */
export function initStore(dataPath: string): void {
  dataDir = dataPath
  // 确保数据目录存在
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
  // 初始化默认数据文件
  ensureDefaultData('projects.json', [])
  ensureDefaultData('settings.json', {
    workspacePath: '',
    hotkey: 'Alt+Space',
    theme: 'system',
    editors: [],
    customEditors: []
  })
}

/**
 * 获取数据目录路径
 */
export function getDataDir(): string {
  return dataDir
}

/**
 * 确保数据文件存在，不存在则创建默认值
 */
function ensureDefaultData<T>(filename: string, defaultValue: T): void {
  const filePath = join(dataDir, filename)
  if (!existsSync(filePath)) {
    try {
      writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8')
    } catch (error) {
      console.error(`[Store] 初始化默认数据失败: ${filePath}`, error)
    }
  }
}

/**
 * 读取 JSON 数据文件
 * @param filename 文件名（如 projects.json）
 * @param defaultValue 文件不存在时的默认值
 */
export function readData<T>(filename: string, defaultValue: T): T {
  const filePath = join(dataDir, filename)
  try {
    if (!existsSync(filePath)) {
      // 文件不存在，写入默认值并返回
      writeData(filename, defaultValue)
      return defaultValue
    }
    const raw = readFileSync(filePath, 'utf-8')
    if (!raw || raw.trim() === '') {
      return defaultValue
    }
    const parsed = JSON.parse(raw)
    // 基本数据校验：确保返回类型一致
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
      console.warn(`[Store] 数据格式异常，期望数组: ${filePath}`)
      return defaultValue
    }
    if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        console.warn(`[Store] 数据格式异常，期望对象: ${filePath}`)
        return defaultValue
      }
    }
    return parsed as T
  } catch (error) {
    console.error(`[Store] 读取文件失败: ${filePath}`, error)
    return defaultValue
  }
}

/**
 * 写入 JSON 数据文件
 * @param filename 文件名（如 projects.json）
 * @param data 要写入的数据
 */
export function writeData<T>(filename: string, data: T): void {
  const filePath = join(dataDir, filename)
  try {
    // 确保目录存在
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error(`[Store] 写入文件失败: ${filePath}`, error)
    throw error
  }
}

/**
 * 删除数据文件中某个键（仅对对象类型数据有效）
 */
export function deleteKey(filename: string, key: string): void {
  const data = readData<Record<string, unknown>>(filename, {})
  if (key in data) {
    delete data[key]
    writeData(filename, data)
  }
}
