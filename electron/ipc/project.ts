import { IpcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { readdirSync, statSync, existsSync } from 'fs'
import { join } from 'path'
import { readData, writeData } from '../store'
import type { Project, ProjectInput, ScanCandidate } from '../../src/types'

const PROJECTS_FILE = 'projects.json'

/**
 * 注册项目管理相关的 IPC handlers
 */
export function registerProjectHandlers(ipcMain: IpcMain): void {
  // 获取所有项目
  ipcMain.handle('project:getAll', async () => {
    return readData<Project[]>(PROJECTS_FILE, [])
  })

  // 添加项目
  ipcMain.handle('project:add', async (_event, projectInput: ProjectInput) => {
    const projects = readData<Project[]>(PROJECTS_FILE, [])
    const now = new Date().toISOString()
    const newProject: Project = {
      id: uuidv4(),
      name: projectInput.name,
      description: projectInput.description,
      path: projectInput.path,
      codeModules: projectInput.codeModules || [],
      docs: projectInput.docs,
      createdAt: now,
      updatedAt: now,
      tags: projectInput.tags || []
    }
    projects.push(newProject)
    writeData(PROJECTS_FILE, projects)
    return newProject
  })

  // 更新项目
  ipcMain.handle('project:update', async (_event, id: string, data: Partial<ProjectInput>) => {
    const projects = readData<Project[]>(PROJECTS_FILE, [])
    const index = projects.findIndex(p => p.id === id)
    if (index === -1) {
      throw new Error(`项目不存在: ${id}`)
    }
    const existing = projects[index]
    projects[index] = {
      id: existing.id,
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      path: data.path ?? existing.path,
      codeModules: data.codeModules ?? existing.codeModules ?? [],
      docs: data.docs !== undefined ? data.docs : existing.docs,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
      tags: data.tags ?? existing.tags ?? [],
      sortOrder: existing.sortOrder,
      groupId: (data as any).groupId !== undefined ? (data as any).groupId : existing.groupId,
      starred: existing.starred
    }
    writeData(PROJECTS_FILE, projects)
    return projects[index]
  })

  // 删除项目
  ipcMain.handle('project:delete', async (_event, id: string) => {
    const projects = readData<Project[]>(PROJECTS_FILE, [])
    const filtered = projects.filter(p => p.id !== id)
    if (filtered.length === projects.length) {
      throw new Error(`项目不存在: ${id}`)
    }
    writeData(PROJECTS_FILE, filtered)
  })

  // 切换星标
  ipcMain.handle('project:toggleStar', async (_event, projectId: string) => {
    const projects = readData<Project[]>(PROJECTS_FILE, [])
    const project = projects.find(p => p.id === projectId)
    if (!project) {
      throw new Error(`项目不存在: ${projectId}`)
    }
    project.starred = !project.starred
    project.updatedAt = new Date().toISOString()
    writeData(PROJECTS_FILE, projects)
    return project
  })

  // 重新排序项目
  ipcMain.handle('project:reorder', async (_event, orderedIds: string[]) => {
    const projects = readData<Project[]>(PROJECTS_FILE, [])
    // 根据传入的ID顺序更新 sortOrder
    for (let i = 0; i < orderedIds.length; i++) {
      const project = projects.find(p => p.id === orderedIds[i])
      if (project) {
        project.sortOrder = i
      }
    }
    writeData(PROJECTS_FILE, projects)
  })

  // 批量切换星标
  ipcMain.handle('project:batchToggleStar', async (_event, ids: string[]) => {
    const projects = readData<Project[]>(PROJECTS_FILE, [])
    const updated: Project[] = []
    for (const id of ids) {
      const project = projects.find(p => p.id === id)
      if (project) {
        project.starred = !project.starred
        project.updatedAt = new Date().toISOString()
        updated.push(project)
      }
    }
    writeData(PROJECTS_FILE, projects)
    return updated
  })

  // 批量移至分组
  ipcMain.handle('project:batchMoveToGroup', async (_event, ids: string[], groupId: string | null) => {
    const projects = readData<Project[]>(PROJECTS_FILE, [])
    const updated: Project[] = []
    for (const id of ids) {
      const project = projects.find(p => p.id === id)
      if (project) {
        project.groupId = groupId || undefined
        project.updatedAt = new Date().toISOString()
        updated.push(project)
      }
    }
    writeData(PROJECTS_FILE, projects)
    return updated
  })

  // 批量删除
  ipcMain.handle('project:batchDelete', async (_event, ids: string[]) => {
    const projects = readData<Project[]>(PROJECTS_FILE, [])
    const filtered = projects.filter(p => !ids.includes(p.id))
    writeData(PROJECTS_FILE, filtered)
  })

  // 扫描并导入项目
  ipcMain.handle('project:scanAndImport', async (_event, rootPath: string) => {
    if (!existsSync(rootPath)) {
      throw new Error(`目录不存在: ${rootPath}`)
    }

    const stat = statSync(rootPath)
    if (!stat.isDirectory()) {
      throw new Error(`路径不是目录: ${rootPath}`)
    }

    // 需要忽略的文件夹名
    const ignoredNames = new Set(['node_modules', '.git', '.svn', '.hg', '.vscode', '.idea', '__pycache__', 'dist', 'build', 'target', 'vendor', 'coverage', '.cache', 'tmp', 'temp'])

    // 读取一级子文件夹
    const entries = readdirSync(rootPath, { withFileTypes: true })
    const subDirs = entries.filter(entry => {
      if (!entry.isDirectory()) return false
      if (entry.name.startsWith('.')) return false
      if (ignoredNames.has(entry.name)) return false
      return true
    })

    const projects = readData<Project[]>(PROJECTS_FILE, [])
    const importedProjects: Project[] = []
    let skipped = 0

    for (const dir of subDirs) {
      const dirPath = join(rootPath, dir.name)

      // 检查是否已存在同路径项目
      if (projects.some(p => p.path === dirPath)) {
        skipped++
        continue
      }

      // 智能扫描代码模块
      const codeModules = scanCodeModulesInDir(dirPath)
      // 自动置顶第一个代码模块
      if (codeModules.length > 0) {
        codeModules[0].pinned = true
      }
      // 扫描文档目录
      const docs = scanDocsInDir(dirPath)

      const now = new Date().toISOString()
      const newProject: Project = {
        id: uuidv4(),
        name: dir.name,
        description: '',
        path: dirPath,
        codeModules,
        docs,
        createdAt: now,
        updatedAt: now,
        tags: []
      }

      projects.push(newProject)
      importedProjects.push(newProject)
    }

    if (importedProjects.length > 0) {
      writeData(PROJECTS_FILE, projects)
    }

    return {
      imported: importedProjects.length,
      skipped,
      projects: importedProjects
    }
  })

  // 预扫描项目目录（不导入，仅返回候选列表，标注已存在的）
  ipcMain.handle('project:scanPreview', async (_event, rootPath: string) => {
    if (!existsSync(rootPath)) {
      throw new Error(`目录不存在: ${rootPath}`)
    }
    const stat = statSync(rootPath)
    if (!stat.isDirectory()) {
      throw new Error(`路径不是目录: ${rootPath}`)
    }

    const ignoredNames = new Set(['node_modules', '.git', '.svn', '.hg', '.vscode', '.idea', '__pycache__', 'dist', 'build', 'target', 'vendor', 'coverage', '.cache', 'tmp', 'temp'])
    const entries = readdirSync(rootPath, { withFileTypes: true })
    const subDirs = entries.filter(entry => {
      if (!entry.isDirectory()) return false
      if (entry.name.startsWith('.')) return false
      if (ignoredNames.has(entry.name)) return false
      return true
    })

    const projects = readData<Project[]>(PROJECTS_FILE, [])
    const existingPaths = new Set(projects.map(p => p.path))
    const candidates: ScanCandidate[] = []

    for (const dir of subDirs) {
      const dirPath = join(rootPath, dir.name)
      const exists = existingPaths.has(dirPath)
      // 扫描代码模块（仅计数，不保存）
      let codeModuleCount = 0
      let hasDocs = false
      if (!exists) {
        try {
          const modules = scanCodeModulesInDir(dirPath)
          codeModuleCount = modules.length
          hasDocs = !!scanDocsInDir(dirPath)
        } catch { /* ignore */ }
      }
      candidates.push({
        name: dir.name,
        path: dirPath,
        exists,
        codeModuleCount,
        hasDocs
      })
    }

    return candidates
  })

  // 批量导入选中的项目路径
  ipcMain.handle('project:batchImport', async (_event, paths: string[]) => {
    const projects = readData<Project[]>(PROJECTS_FILE, [])
    const existingPaths = new Set(projects.map(p => p.path))
    let imported = 0
    let skipped = 0

    for (const dirPath of paths) {
      if (existingPaths.has(dirPath)) {
        skipped++
        continue
      }
      if (!existsSync(dirPath)) {
        skipped++
        continue
      }
      const dirName = dirPath.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || dirPath
      const codeModules = scanCodeModulesInDir(dirPath)
      // 自动置顶第一个代码模块
      if (codeModules.length > 0) {
        codeModules[0].pinned = true
      }
      const docs = scanDocsInDir(dirPath)
      const now = new Date().toISOString()
      const newProject: Project = {
        id: uuidv4(),
        name: dirName,
        description: '',
        path: dirPath,
        codeModules,
        docs,
        createdAt: now,
        updatedAt: now,
        tags: []
      }
      projects.push(newProject)
      existingPaths.add(dirPath)
      imported++
    }

    if (imported > 0) {
      writeData(PROJECTS_FILE, projects)
    }

    return { imported, skipped }
  })

  // 扫描项目目录下的代码模块（供编辑时使用）
  ipcMain.handle('project:scanCodeModules', async (_event, projectPath: string) => {
    if (!existsSync(projectPath)) {
      throw new Error(`目录不存在: ${projectPath}`)
    }
    return scanCodeModulesInDir(projectPath)
  })
}

/**
 * 需要忽略的目录名（用于代码模块扫描）
 */
const SCAN_IGNORED_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'out',
  '.idea', '.vscode', '__pycache__', '.next', '.nuxt', 'target',
  'vendor', 'coverage', '.cache', 'tmp', 'temp', '.gradle'
])

/** 编辑器ID常量 */
const EDITOR_IDEA = 'idea'
const EDITOR_TRAE_CN = 'trae-cn'
const EDITOR_VSCODE = 'vscode'

/**
 * 智能扫描目录下的代码模块
 * 递归扫描子文件夹，根据特征文件识别代码类型和推荐编辑器
 * 注意：识别到代码模块的目录不再递归其子目录
 */
function scanCodeModulesInDir(rootPath: string): { path: string; label: string; language?: string; framework?: string; editorId?: string; pinned?: boolean }[] {
  const modules: { path: string; label: string; language?: string; framework?: string; editorId?: string }[] = []
  const found = new Set<string>() // 已识别的目录路径，防止重复

  // 递归扫描，最大深度3
  function scan(dirPath: string, depth: number) {
    if (depth > 3) return
    let entries
    try {
      entries = readdirSync(dirPath, { withFileTypes: true })
    } catch { return }

    // 检查当前目录的特征文件
    const fileNames = entries.filter(e => e.isFile()).map(e => e.name.toLowerCase())
    const hasPomXml = fileNames.includes('pom.xml')
    const hasBuildGradle = fileNames.includes('build.gradle') || fileNames.includes('build.gradle.kts')
    const hasPackageJson = fileNames.includes('package.json')
    const hasIndexHtml = fileNames.includes('index.html')
    const hasGoMod = fileNames.includes('go.mod')
    const hasCargoToml = fileNames.includes('cargo.toml')
    const hasRequirementsTxt = fileNames.includes('requirements.txt')
    const hasPyProjectToml = fileNames.includes('pyproject.toml')
    const hasCsproj = entries.some(e => e.isFile() && e.name.toLowerCase().endsWith('.csproj'))
    const hasIdeaDir = entries.some(e => e.isDirectory() && e.name === '.idea')
    const hasVuePkg = hasPackageJson && (() => {
      try {
        const pkg = JSON.parse(require('fs').readFileSync(join(dirPath, 'package.json'), 'utf-8'))
        return pkg.dependencies && (pkg.dependencies.vue || (pkg.devDependencies && pkg.devDependencies.vue))
      } catch { return false }
    })()
    const hasReactPkg = hasPackageJson && (() => {
      try {
        const pkg = JSON.parse(require('fs').readFileSync(join(dirPath, 'package.json'), 'utf-8'))
        return pkg.dependencies && (pkg.dependencies.react || (pkg.devDependencies && pkg.devDependencies.react))
      } catch { return false }
    })()

    // 标记当前目录是否已识别为代码模块
    let identified = false

    // 服务端 (Maven)
    if (hasPomXml && !found.has(dirPath)) {
      found.add(dirPath)
      identified = true
      modules.push({
        path: dirPath,
        label: '服务端',
        language: 'Java',
        framework: 'Spring Boot',
        editorId: hasIdeaDir ? EDITOR_IDEA : EDITOR_IDEA
      })
    }
    // 服务端 (Gradle)
    else if (hasBuildGradle && !found.has(dirPath)) {
      found.add(dirPath)
      identified = true
      modules.push({
        path: dirPath,
        label: '服务端',
        language: 'Java',
        framework: 'Gradle',
        editorId: EDITOR_IDEA
      })
    }
    // 前端 Vue
    else if (hasVuePkg && !found.has(dirPath)) {
      found.add(dirPath)
      identified = true
      modules.push({
        path: dirPath,
        label: '前端',
        language: 'JavaScript',
        framework: 'Vue',
        editorId: EDITOR_TRAE_CN
      })
    }
    // 前端 React
    else if (hasReactPkg && !found.has(dirPath)) {
      found.add(dirPath)
      identified = true
      modules.push({
        path: dirPath,
        label: '前端',
        language: 'JavaScript',
        framework: 'React',
        editorId: EDITOR_VSCODE
      })
    }
    // 前端 (有 index.html 但无 package.json，或纯静态页面)
    else if (hasIndexHtml && !found.has(dirPath) && !hasPackageJson) {
      found.add(dirPath)
      identified = true
      modules.push({
        path: dirPath,
        label: '前端',
        language: 'HTML',
        framework: 'Static',
        editorId: EDITOR_TRAE_CN
      })
    }
    // 前端 Node.js
    else if (hasPackageJson && !found.has(dirPath)) {
      found.add(dirPath)
      identified = true
      modules.push({
        path: dirPath,
        label: 'Node.js',
        language: 'JavaScript',
        framework: 'Node.js',
        editorId: EDITOR_VSCODE
      })
    }
    // Go
    else if (hasGoMod && !found.has(dirPath)) {
      found.add(dirPath)
      identified = true
      modules.push({
        path: dirPath,
        label: 'Go',
        language: 'Go',
        framework: 'Go Module',
        editorId: EDITOR_VSCODE
      })
    }
    // Rust
    else if (hasCargoToml && !found.has(dirPath)) {
      found.add(dirPath)
      identified = true
      modules.push({
        path: dirPath,
        label: 'Rust',
        language: 'Rust',
        framework: 'Cargo',
        editorId: EDITOR_VSCODE
      })
    }
    // Python
    else if ((hasRequirementsTxt || hasPyProjectToml) && !found.has(dirPath)) {
      found.add(dirPath)
      identified = true
      modules.push({
        path: dirPath,
        label: 'Python',
        language: 'Python',
        framework: 'Python',
        editorId: EDITOR_VSCODE
      })
    }
    // C#/.NET
    else if (hasCsproj && !found.has(dirPath)) {
      found.add(dirPath)
      identified = true
      modules.push({
        path: dirPath,
        label: '.NET',
        language: 'C#',
        framework: '.NET',
        editorId: EDITOR_VSCODE
      })
    }

    // 已识别为代码模块的目录不再递归子目录
    if (identified) return

    // 递归扫描子目录
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.')) continue
      if (SCAN_IGNORED_DIRS.has(entry.name)) continue
      scan(join(dirPath, entry.name), depth + 1)
    }
  }

  scan(rootPath, 0)
  return modules
}

/**
 * 扫描文档目录
 */
function scanDocsInDir(rootPath: string): string | undefined {
  const docsDirs = ['docs', 'doc', '文档', 'documents', 'wiki']
  try {
    const entries = readdirSync(rootPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory() && docsDirs.includes(entry.name.toLowerCase())) {
        return join(rootPath, entry.name)
      }
    }
  } catch { /* ignore */ }
  return undefined
}
