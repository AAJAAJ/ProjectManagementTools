import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SearchResult, Project } from '@/types'
import { useProjectStore } from './project'

export const useSearchStore = defineStore('search', () => {
  const isVisible = ref(false)
  const query = ref('')
  const results = ref<SearchResult[]>([])
  const loading = ref(false)
  const selectedIndex = ref(0)
  const recentProjectIds = ref<string[]>([])

  /** 最近访问的项目（最多5个，按访问顺序） */
  const recentProjects = computed<Project[]>(() => {
    const projectStore = useProjectStore()
    // 优先使用手动记录的最近访问列表
    if (recentProjectIds.value.length > 0) {
      return recentProjectIds.value
        .map(id => projectStore.projects.find(p => p.id === id))
        .filter((p): p is Project => !!p)
        .slice(0, 5)
    }
    // 兜底：按 updatedAt 排序取前5
    return [...projectStore.projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  })

  /** 添加到最近访问 */
  function addToRecent(projectId: string) {
    const idx = recentProjectIds.value.indexOf(projectId)
    if (idx !== -1) {
      recentProjectIds.value.splice(idx, 1)
    }
    recentProjectIds.value.unshift(projectId)
    if (recentProjectIds.value.length > 5) {
      recentProjectIds.value = recentProjectIds.value.slice(0, 5)
    }
  }

  /** 显示搜索覆盖层 */
  function show() {
    isVisible.value = true
    query.value = ''
    results.value = []
    selectedIndex.value = 0
  }

  /** 隐藏搜索覆盖层 */
  function hide() {
    isVisible.value = false
    query.value = ''
    results.value = []
    selectedIndex.value = 0
  }

  /** 切换搜索覆盖层 */
  function toggle() {
    if (isVisible.value) {
      hide()
    } else {
      show()
    }
  }

  /** 执行搜索 */
  async function search(keyword: string) {
    query.value = keyword
    if (!keyword.trim()) {
      results.value = []
      selectedIndex.value = 0
      return
    }
    loading.value = true
    try {
      results.value = await window.electronAPI.search(keyword)
      selectedIndex.value = 0
    } catch (error) {
      console.error('搜索失败:', error)
      results.value = []
    } finally {
      loading.value = false
    }
  }

  /** 选择下一个结果 */
  function selectNext() {
    if (results.value.length === 0) return
    selectedIndex.value = (selectedIndex.value + 1) % results.value.length
  }

  /** 选择上一个结果 */
  function selectPrev() {
    if (results.value.length === 0) return
    selectedIndex.value = (selectedIndex.value - 1 + results.value.length) % results.value.length
  }

  /** 获取当前选中的结果 */
  function getSelected(): SearchResult | null {
    if (results.value.length === 0) return null
    return results.value[selectedIndex.value] || null
  }

  return {
    isVisible,
    query,
    results,
    loading,
    selectedIndex,
    recentProjects,
    recentProjectIds,
    show,
    hide,
    toggle,
    search,
    selectNext,
    selectPrev,
    getSelected,
    addToRecent
  }
})
