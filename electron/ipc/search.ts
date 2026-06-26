import { IpcMain } from 'electron'
import { existsSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import { readData } from '../store'
import type { Project, SearchResult, ToolItem } from '../../src/types'

const PROJECTS_FILE = 'projects.json'
const TOOLS_FILE = 'tools.json'

/**
 * 文件名索引缓存
 * key: 项目路径, value: { files: 文件名列表, timestamp: 缓存时间 }
 */
interface FileIndexCache {
  files: string[]
  timestamp: number
}

const fileIndexMap = new Map<string, FileIndexCache>()
const FILE_CACHE_TTL = 5 * 60 * 1000 // 文件索引缓存 5 分钟

/**
 * 需要忽略的目录名
 */
const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'out',
  '.idea', '.vscode', '__pycache__', '.next', '.nuxt', 'target',
  'vendor', 'coverage', '.cache', 'tmp', 'temp'
])

/**
 * 递归扫描目录获取文件名列表
 * @param dirPath 目录路径
 * @param maxDepth 最大递归深度
 * @param currentDepth 当前深度
 */
function scanDirectory(dirPath: string, maxDepth: number = 4, currentDepth: number = 0): string[] {
  if (currentDepth >= maxDepth) return []

  const files: string[] = []

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      // 跳过隐藏文件和忽略目录
      if (entry.name.startsWith('.') && entry.isDirectory()) continue
      if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue

      const fullPath = join(dirPath, entry.name)

      if (entry.isFile()) {
        files.push(fullPath)
      } else if (entry.isDirectory()) {
        const subFiles = scanDirectory(fullPath, maxDepth, currentDepth + 1)
        files.push(...subFiles)
      }
    }
  } catch {
    // 忽略无法访问的目录
  }

  return files
}

/**
 * 获取项目的文件索引（带缓存）
 */
function getFileIndex(projectPath: string): string[] {
  if (!existsSync(projectPath)) return []

  const now = Date.now()
  const cached = fileIndexMap.get(projectPath)

  if (cached && (now - cached.timestamp) < FILE_CACHE_TTL) {
    return cached.files
  }

  // 重新扫描
  const files = scanDirectory(projectPath)

  // 更新缓存
  fileIndexMap.set(projectPath, { files, timestamp: now })

  return files
}

/**
 * 计算搜索相关度分数
 */
function calculateRelevance(text: string, keyword: string): number {
  const lowerText = text.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()

  // 完全匹配得分最高
  if (lowerText === lowerKeyword) return 100
  // 以关键词开头
  if (lowerText.startsWith(lowerKeyword)) return 80
  // 包含完整关键词
  if (lowerText.includes(lowerKeyword)) return 60
  // 分词匹配
  const words = lowerKeyword.split(/\s+/)
  const matchedWords = words.filter(w => lowerText.includes(w))
  if (matchedWords.length > 0) {
    return (matchedWords.length / words.length) * 40
  }

  return 0
}

/**
 * 注册搜索相关的 IPC handlers
 */
export function registerSearchHandlers(ipcMain: IpcMain): void {
  // 全局搜索
  ipcMain.handle('search:query', async (_event, query: string) => {
    if (!query || query.trim() === '') {
      return []
    }

    const keyword = query.trim()
    const keywordLower = keyword.toLowerCase()
    const projects = readData<Project[]>(PROJECTS_FILE, [])
    const results: SearchResult[] = []
    const resultScores = new Map<string, number>()

    // 1. 搜索项目名称和描述
    for (const project of projects) {
      const nameScore = calculateRelevance(project.name, keyword)
      const descScore = calculateRelevance(project.description, keyword)
      const maxScore = Math.max(nameScore, descScore)

      if (maxScore > 0) {
        const key = `project:${project.id}`
        results.push({
          type: 'project',
          title: project.name,
          subtitle: project.description,
          path: project.path,
          projectId: project.id
        })
        resultScores.set(key, maxScore)
      }

      // 2. 搜索标签
      if (project.tags && project.tags.length > 0) {
        const tagMatch = project.tags.some(tag => tag.toLowerCase().includes(keywordLower))
        if (tagMatch && !results.find(r => r.projectId === project.id)) {
          const key = `project-tag:${project.id}`
          results.push({
            type: 'project',
            title: project.name,
            subtitle: `标签匹配: ${project.tags.filter(t => t.toLowerCase().includes(keywordLower)).join(', ')}`,
            path: project.path,
            projectId: project.id
          })
          resultScores.set(key, 50) // 标签匹配的默认分数
        }
      }
    }

    // 3. 搜索文件名（遍历所有项目目录）
    for (const project of projects) {
      if (!project.path || !existsSync(project.path)) continue

      const files = getFileIndex(project.path)
      let fileMatchCount = 0
      const MAX_FILE_RESULTS = 5 // 每个项目最多返回5个文件结果

      for (const filePath of files) {
        if (fileMatchCount >= MAX_FILE_RESULTS) break

        const fileName = basename(filePath)
        const fileScore = calculateRelevance(fileName, keyword)

        if (fileScore > 0) {
          const key = `file:${filePath}`
          // 显示相对路径作为副标题
          const relativePath = filePath.replace(project.path, '').replace(/^[\\/]/, '')
          results.push({
            type: 'file',
            title: fileName,
            subtitle: `${project.name} / ${relativePath}`,
            path: filePath,
            projectId: project.id
          })
          resultScores.set(key, fileScore)
          fileMatchCount++
        }
      }
    }

    // 4. 搜索代码模块
    for (const project of projects) {
      if (!project.codeModules) continue
      for (const mod of project.codeModules) {
        const labelScore = calculateRelevance(mod.label, keyword)
        const langScore = mod.language ? calculateRelevance(mod.language, keyword) : 0
        const frameworkScore = mod.framework ? calculateRelevance(mod.framework, keyword) : 0
        const maxScore = Math.max(labelScore, langScore, frameworkScore)
        if (maxScore > 0) {
          const key = `code:${project.id}:${mod.path}`
          results.push({
            type: 'code',
            title: mod.label,
            subtitle: `${project.name} - ${mod.path}`,
            path: mod.path,
            projectId: project.id
          })
          resultScores.set(key, maxScore)
        }
      }
    }

    // 5. 搜索工具
    const tools = readData<ToolItem[]>(TOOLS_FILE, [])
    for (const tool of tools) {
      const nameScore = calculateRelevance(tool.name, keyword)
      const descScore = tool.description ? calculateRelevance(tool.description, keyword) : 0
      const maxScore = Math.max(nameScore, descScore)

      if (maxScore > 0) {
        const key = `tool:${tool.id}`
        results.push({
          type: 'tool',
          title: tool.name,
          subtitle: tool.description || tool.path,
          path: tool.path,
          toolId: tool.id
        })
        resultScores.set(key, maxScore)
      }

      // 搜索工具标签
      if (tool.tags && tool.tags.length > 0) {
        const tagMatch = tool.tags.some(tag => tag.toLowerCase().includes(keywordLower))
        if (tagMatch && !results.find(r => r.toolId === tool.id)) {
          const key = `tool-tag:${tool.id}`
          results.push({
            type: 'tool',
            title: tool.name,
            subtitle: `标签匹配: ${tool.tags.filter(t => t.toLowerCase().includes(keywordLower)).join(', ')}`,
            path: tool.path,
            toolId: tool.id
          })
          resultScores.set(key, 50)
        }
      }
    }

    // 6. 按相关度排序
    results.sort((a, b) => {
      const keyA = `${a.type}:${a.type === 'file' || a.type === 'code' ? a.path : (a.projectId || a.toolId || '')}`
      const keyB = `${b.type}:${b.type === 'file' || b.type === 'code' ? b.path : (b.projectId || b.toolId || '')}`

      // 先按类型排序（项目 > 工具 > 文件 > 代码）
      const typeOrder: Record<string, number> = { project: 0, tool: 1, file: 2, code: 3 }
      const typeCompare = (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99)
      if (typeCompare !== 0) return typeCompare

      // 再按分数排序
      const scoreA = resultScores.get(keyA) || 0
      const scoreB = resultScores.get(keyB) || 0
      return scoreB - scoreA
    })

    // 限制总结果数量
    return results.slice(0, 20)
  })
}
