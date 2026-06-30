import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, copyFileSync, unlinkSync, rmdirSync } from 'fs'
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

/**
 * 从旧数据目录迁移数据到当前 dataDir
 * 迁移完成后将旧目录重命名为 data.old
 * @param oldPath 旧数据目录路径
 */
export function migrateOldData(oldPath: string): void {
  try {
    // 旧目录不存在则无需迁移
    if (!existsSync(oldPath)) {
      return
    }
    const oldStat = statSync(oldPath)
    if (!oldStat.isDirectory()) {
      return
    }
    // 读取旧目录下所有 .json 文件
    const files = readdirSync(oldPath).filter(f => f.endsWith('.json'))
    for (const file of files) {
      const src = join(oldPath, file)
      const dest = join(dataDir, file)
      copyFileSync(src, dest)
    }
    // 将旧目录重命名为 data.old（通过复制+删除实现，避免引入额外导入）
    const oldBackupPath = join(oldPath, '..', 'data.old')
    // 若已存在 data.old，先递归删除其内容
    if (existsSync(oldBackupPath)) {
      try {
        const oldFiles = readdirSync(oldBackupPath)
        for (const f of oldFiles) {
          unlinkSync(join(oldBackupPath, f))
        }
        rmdirSync(oldBackupPath)
      } catch {
        // 忽略删除失败
      }
    }
    try {
      // 复制旧目录下所有文件到 data.old
      mkdirSync(oldBackupPath, { recursive: true })
      const allFiles = readdirSync(oldPath)
      for (const f of allFiles) {
        const srcStat = statSync(join(oldPath, f))
        if (srcStat.isFile()) {
          copyFileSync(join(oldPath, f), join(oldBackupPath, f))
        }
      }
      // 删除原旧目录内容
      for (const f of allFiles) {
        const srcStat = statSync(join(oldPath, f))
        if (srcStat.isFile()) {
          unlinkSync(join(oldPath, f))
        }
      }
      rmdirSync(oldPath)
    } catch (error) {
      console.error(`[Store] 重命名旧目录失败: ${oldPath} -> ${oldBackupPath}`, error)
    }
  } catch (error) {
    console.error(`[Store] 迁移旧数据失败: ${oldPath}`, error)
  }
}

/**
 * 备份 dataDir 下所有 .json 文件
 * 备份目录格式：dataDir/backups/YYYYMMDD_HHMMSS/
 * @returns 备份目录名（如 20260630_143020），失败返回空字符串
 */
export function backupData(): string {
  try {
    // 生成备份目录名 YYYYMMDD_HHMMSS
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const backupDir = join(dataDir, 'backups', stamp)
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true })
    }
    // 复制所有 .json 文件
    const files = readdirSync(dataDir).filter(f => f.endsWith('.json'))
    for (const file of files) {
      const src = join(dataDir, file)
      const dest = join(backupDir, file)
      copyFileSync(src, dest)
    }
    return stamp
  } catch (error) {
    console.error('[Store] 备份数据失败', error)
    return ''
  }
}

/**
 * 从指定备份目录恢复所有 json 文件到 dataDir
 * @param backupName 备份目录名（如 20260630_143020）
 */
export function restoreBackup(backupName: string): void {
  try {
    const backupDir = join(dataDir, 'backups', backupName)
    if (!existsSync(backupDir)) {
      console.error(`[Store] 备份目录不存在: ${backupDir}`)
      return
    }
    const files = readdirSync(backupDir).filter(f => f.endsWith('.json'))
    for (const file of files) {
      const src = join(backupDir, file)
      const dest = join(dataDir, file)
      copyFileSync(src, dest)
    }
  } catch (error) {
    console.error(`[Store] 恢复备份失败: ${backupName}`, error)
  }
}

/**
 * 列出所有备份
 * @returns 备份列表，按日期降序排序
 */
export function listBackups(): { name: string; date: string; files: string[] }[] {
  try {
    const backupsRoot = join(dataDir, 'backups')
    if (!existsSync(backupsRoot)) {
      return []
    }
    const entries = readdirSync(backupsRoot).filter(name => {
      const p = join(backupsRoot, name)
      return statSync(p).isDirectory()
    })
    const result = entries.map(name => {
      const dir = join(backupsRoot, name)
      const files = readdirSync(dir).filter(f => f.endsWith('.json'))
      // 从备份名 YYYYMMDD_HHMMSS 解析日期
      let date = ''
      const m = name.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/)
      if (m) {
        date = `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`
      } else {
        // 使用目录修改时间作为回退
        try {
          date = new Date(statSync(dir).mtime).toISOString()
        } catch {
          date = ''
        }
      }
      return { name, date, files }
    })
    // 按日期降序排序
    result.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    return result
  } catch (error) {
    console.error('[Store] 列出备份失败', error)
    return []
  }
}

/**
 * 删除指定备份目录
 * @param backupName 备份目录名
 */
export function deleteBackup(backupName: string): void {
  try {
    const backupDir = join(dataDir, 'backups', backupName)
    if (!existsSync(backupDir)) {
      console.warn(`[Store] 备份目录不存在: ${backupDir}`)
      return
    }
    // 先删除目录内所有文件
    const files = readdirSync(backupDir)
    for (const file of files) {
      unlinkSync(join(backupDir, file))
    }
    // 再删除空目录
    rmdirSync(backupDir)
  } catch (error) {
    console.error(`[Store] 删除备份失败: ${backupName}`, error)
  }
}

/**
 * 清理旧备份，保留最近 keepCount 个备份
 * @param keepCount 保留的备份数量，默认 5
 */
export function cleanupOldBackups(keepCount = 5): void {
  try {
    const backups = listBackups()
    if (backups.length <= keepCount) {
      return
    }
    // listBackups 已按日期降序排序，需删除索引 >= keepCount 的备份
    const toDelete = backups.slice(keepCount)
    for (const backup of toDelete) {
      deleteBackup(backup.name)
    }
  } catch (error) {
    console.error('[Store] 清理旧备份失败', error)
  }
}

/**
 * 清理 dataDir/updates/ 目录下超过 7 天的 .exe 安装包
 */
export function cleanupOldInstallers(): void {
  try {
    const updatesDir = join(dataDir, 'updates')
    if (!existsSync(updatesDir)) {
      return
    }
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    const files = readdirSync(updatesDir).filter(f => f.toLowerCase().endsWith('.exe'))
    for (const file of files) {
      const filePath = join(updatesDir, file)
      const stat = statSync(filePath)
      if (now - stat.mtimeMs > sevenDays) {
        unlinkSync(filePath)
      }
    }
  } catch (error) {
    console.error('[Store] 清理旧安装包失败', error)
  }
}

/**
 * 将安装包复制到 dataDir/updates/ 目录
 * @param filePath 安装包源文件路径
 * @returns 目标文件路径，失败返回空字符串
 */
export function saveInstaller(filePath: string): string {
  try {
    const updatesDir = join(dataDir, 'updates')
    if (!existsSync(updatesDir)) {
      mkdirSync(updatesDir, { recursive: true })
    }
    // 从源路径取文件名
    const fileName = filePath.split(/[\\/]/).pop() || 'installer.exe'
    const dest = join(updatesDir, fileName)
    copyFileSync(filePath, dest)
    return dest
  } catch (error) {
    console.error(`[Store] 保存安装包失败: ${filePath}`, error)
    return ''
  }
}
