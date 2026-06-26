import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, ProjectInput, ProjectGroup } from '@/types'

/** 将响应式对象转为纯对象，避免 Electron IPC structured clone 错误 */
function toPlainObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const groups = ref<ProjectGroup[]>([])
  const loading = ref(false)
  const currentProject = ref<Project | null>(null)

  // 多选状态
  const selectedIds = ref<Set<string>>(new Set())
  const lastSelectedId = ref<string | null>(null)

  /** 是否处于多选模式 */
  const isSelectionMode = computed(() => selectedIds.value.size > 0)

  /** 检查是否选中 */
  function isSelected(id: string): boolean {
    return selectedIds.value.has(id)
  }

  /** 单选（清除其他选择） */
  function selectProject(id: string) {
    selectedIds.value = new Set([id])
    lastSelectedId.value = id
  }

  /** 切换选择（Ctrl+Click） */
  function toggleSelect(id: string) {
    const newSet = new Set(selectedIds.value)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    selectedIds.value = newSet
    lastSelectedId.value = id
  }

  /** 范围选择（Shift+Click） */
  function rangeSelect(id: string) {
    if (!lastSelectedId.value) {
      selectProject(id)
      return
    }
    // 获取所有项目的平坦列表
    const allProjects = groupedProjects.value.flatMap(g => g.projects)
    const lastIndex = allProjects.findIndex(p => p.id === lastSelectedId.value)
    const currentIndex = allProjects.findIndex(p => p.id === id)
    if (lastIndex === -1 || currentIndex === -1) {
      selectProject(id)
      return
    }
    const start = Math.min(lastIndex, currentIndex)
    const end = Math.max(lastIndex, currentIndex)
    const newSet = new Set(selectedIds.value)
    for (let i = start; i <= end; i++) {
      newSet.add(allProjects[i].id)
    }
    selectedIds.value = newSet
  }

  /** 全选 */
  function selectAll() {
    const allIds = projects.value.map(p => p.id)
    selectedIds.value = new Set(allIds)
  }

  /** 清除选择 */
  function clearSelection() {
    selectedIds.value = new Set()
    lastSelectedId.value = null
  }

  /** 批量切换星标 */
  async function batchToggleStar(ids: string[]) {
    const updatedList = await window.electronAPI.batchToggleStar(toPlainObject(ids))
    for (const updated of updatedList) {
      const index = projects.value.findIndex(p => p.id === updated.id)
      if (index !== -1) {
        projects.value[index] = updated
      }
    }
  }

  /** 批量移至分组 */
  async function batchMoveToGroup(ids: string[], groupId: string | null) {
    const updatedList = await window.electronAPI.batchMoveToGroup(toPlainObject(ids), groupId)
    for (const updated of updatedList) {
      const index = projects.value.findIndex(p => p.id === updated.id)
      if (index !== -1) {
        projects.value[index] = updated
      }
    }
  }

  /** 批量删除 */
  async function batchDelete(ids: string[]) {
    await window.electronAPI.batchDelete(toPlainObject(ids))
    projects.value = projects.value.filter(p => !ids.includes(p.id))
    clearSelection()
  }

  /** 按分组分类的项目：星标组 → 各自定义组 → 未分组 */
  const groupedProjects = computed(() => {
    const sortedGroups = [...groups.value].sort((a, b) => a.sortOrder - b.sortOrder)

    const result: { id: string; name: string; icon?: string; collapsed: boolean; projects: Project[] }[] = []

    // 星标组
    const starredProjects = projects.value
      .filter(p => p.starred)
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
    if (starredProjects.length > 0) {
      result.push({
        id: '__starred__',
        name: '⭐ 星标项目',
        icon: 'star',
        collapsed: false,
        projects: starredProjects
      })
    }

    // 自定义分组
    for (const group of sortedGroups) {
      const groupProjects = projects.value
        .filter(p => p.groupId === group.id && !p.starred)
        .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
      result.push({
        id: group.id,
        name: group.name,
        collapsed: group.collapsed,
        projects: groupProjects
      })
    }

    // 未分组
    const ungroupedProjects = projects.value
      .filter(p => !p.groupId && !p.starred)
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
    result.push({
      id: '__ungrouped__',
      name: '未分组',
      collapsed: false,
      projects: ungroupedProjects
    })

    return result
  })

  /** 加载所有项目 */
  async function loadProjects() {
    loading.value = true
    try {
      projects.value = await window.electronAPI.getProjects()
    } catch (error) {
      console.error('加载项目失败:', error)
    } finally {
      loading.value = false
    }
  }

  /** 加载所有分组 */
  async function loadGroups() {
    try {
      groups.value = await window.electronAPI.getGroups()
    } catch (error) {
      console.error('加载分组失败:', error)
    }
  }

  /** 添加项目 */
  async function addProject(input: ProjectInput) {
    const project = await window.electronAPI.addProject(toPlainObject(input))
    projects.value.push(project)
    return project
  }

  /** 更新项目 */
  async function updateProject(id: string, data: Partial<ProjectInput>) {
    const updated = await window.electronAPI.updateProject(id, toPlainObject(data))
    const index = projects.value.findIndex(p => p.id === id)
    if (index !== -1) {
      projects.value[index] = updated
    }
    if (currentProject.value?.id === id) {
      currentProject.value = updated
    }
    return updated
  }

  /** 删除项目 */
  async function deleteProject(id: string) {
    await window.electronAPI.deleteProject(id)
    projects.value = projects.value.filter(p => p.id !== id)
    if (currentProject.value?.id === id) {
      currentProject.value = null
    }
  }

  /** 重新排序项目 */
  async function reorderProjects(orderedIds: string[]) {
    for (let i = 0; i < orderedIds.length; i++) {
      const project = projects.value.find(p => p.id === orderedIds[i])
      if (project) {
        project.sortOrder = i
      }
    }
    await window.electronAPI.reorderProjects(toPlainObject(orderedIds))
  }

  /** 切换星标 */
  async function toggleStar(projectId: string) {
    const updated = await window.electronAPI.toggleStar(projectId)
    const index = projects.value.findIndex(p => p.id === projectId)
    if (index !== -1) {
      projects.value[index] = updated
    }
    return updated
  }

  /** 添加分组 */
  async function addGroup(name: string) {
    const group = await window.electronAPI.addGroup(name)
    groups.value.push(group)
    return group
  }

  /** 更新分组 */
  async function updateGroup(id: string, data: Partial<ProjectGroup>) {
    const updated = await window.electronAPI.updateGroup(id, toPlainObject(data))
    const index = groups.value.findIndex(g => g.id === id)
    if (index !== -1) {
      groups.value[index] = updated
    }
    return updated
  }

  /** 删除分组 */
  async function deleteGroup(id: string) {
    await window.electronAPI.deleteGroup(id)
    groups.value = groups.value.filter(g => g.id !== id)
    // 将该分组下项目设为未分组
    projects.value.forEach(p => {
      if (p.groupId === id) {
        p.groupId = undefined
      }
    })
  }

  /** 重新排序分组 */
  async function reorderGroups(orderedIds: string[]) {
    for (let i = 0; i < orderedIds.length; i++) {
      const group = groups.value.find(g => g.id === orderedIds[i])
      if (group) {
        group.sortOrder = i
      }
    }
    await window.electronAPI.reorderGroups(toPlainObject(orderedIds))
  }

  /** 设置当前项目 */
  function setCurrentProject(project: Project | null) {
    currentProject.value = project
  }

  return {
    projects,
    groups,
    loading,
    currentProject,
    groupedProjects,
    selectedIds,
    lastSelectedId,
    isSelectionMode,
    isSelected,
    selectProject,
    toggleSelect,
    rangeSelect,
    selectAll,
    clearSelection,
    batchToggleStar,
    batchMoveToGroup,
    batchDelete,
    loadProjects,
    loadGroups,
    addProject,
    updateProject,
    deleteProject,
    reorderProjects,
    toggleStar,
    addGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    setCurrentProject
  }
})
