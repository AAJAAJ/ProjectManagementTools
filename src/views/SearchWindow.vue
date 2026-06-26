<template>
  <div class="search-window" :class="themeClass">
    <div class="search-container" @keydown="handleKeydown">
      <div class="search-input-wrapper">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref="inputRef"
          v-model="localQuery"
          type="text"
          class="search-input"
          placeholder="搜索项目、文件、代码..."
          @input="handleSearch"
          @keydown.escape="hideWindow"
          @keydown.down.prevent="handleArrowDown"
          @keydown.up.prevent="handleArrowUp"
          @keydown.enter.prevent="handleEnter"
        />
        <span class="search-hint">ESC 关闭</span>
      </div>

      <!-- 扩展面板 -->
      <div class="search-panel">
        <!-- 加载状态 -->
        <div v-if="loading" class="search-loading">
          <div class="spinner"></div>
          <span>搜索中...</span>
        </div>

        <!-- 有输入：搜索结果 -->
        <template v-else-if="localQuery">
          <div class="search-results" v-if="results.length > 0">
            <div
              v-for="(result, index) in results"
              :key="index"
              class="search-result-item"
              :class="{ active: index === selectedIndex }"
              @click="handleSelect(result)"
              @mouseenter="selectedIndex = index"
            >
              <span class="result-type-icon">
                <svg v-if="result.type === 'project'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
                <svg v-else-if="result.type === 'file'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/>
                </svg>
              </span>
              <div class="result-content">
                <span class="result-title">{{ result.title }}</span>
                <span class="result-subtitle">{{ result.subtitle }}</span>
              </div>
              <span class="result-type-badge">{{ getTypeLabel(result.type) }}</span>
            </div>
          </div>

          <!-- 无结果 -->
          <div v-else class="search-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <p>没有找到匹配结果</p>
          </div>
        </template>

        <!-- 无输入：最近项目 + 快捷操作 -->
        <template v-else>
          <!-- 最近项目 -->
          <div class="panel-section" v-if="recentProjects.length > 0">
            <div class="panel-section-title">最近项目</div>
            <div
              v-for="(project, index) in recentProjects"
              :key="project.id"
              class="panel-item"
              :class="{ active: panelSelectedIndex === index }"
              @click="openProject(project.id)"
              @mouseenter="panelSelectedIndex = index"
            >
              <span class="panel-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </span>
              <div class="panel-item-content">
                <span class="panel-item-title">{{ project.name }}</span>
                <span class="panel-item-subtitle">{{ project.description || project.path }}</span>
              </div>
            </div>
          </div>

          <!-- 快捷操作 -->
          <div class="panel-section">
            <div class="panel-section-title">快捷操作</div>
            <div
              v-for="(action, index) in quickActions"
              :key="action.label"
              class="panel-item"
              :class="{ active: panelSelectedIndex === recentProjects.length + index }"
              @click="action.handler()"
              @mouseenter="panelSelectedIndex = recentProjects.length + index"
            >
              <span class="panel-item-icon action-icon">{{ action.icon }}</span>
              <div class="panel-item-content">
                <span class="panel-item-title">{{ action.label }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useProjectStore } from '@/stores/project'
import { useSettingsStore } from '@/stores/settings'
import type { SearchResult, Project } from '@/types'

const searchStore = useSearchStore()
const projectStore = useProjectStore()
const settingsStore = useSettingsStore()

const localQuery = ref('')
const inputRef = ref<HTMLInputElement>()
const results = ref<SearchResult[]>([])
const loading = ref(false)
const selectedIndex = ref(0)
const panelSelectedIndex = ref(0)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const themeClass = computed(() => `theme-${settingsStore.currentTheme}`)

/** 最近项目 */
const recentProjects = computed<Project[]>(() => {
  if (searchStore.recentProjectIds.length > 0) {
    return searchStore.recentProjectIds
      .map(id => projectStore.projects.find(p => p.id === id))
      .filter((p): p is Project => !!p)
      .slice(0, 5)
  }
  return [...projectStore.projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
})

/** 面板总可选项数量 */
const panelTotalCount = computed(() => recentProjects.value.length + quickActions.length)

/** 快捷操作列表 */
const quickActions = [
  {
    icon: '📁',
    label: '新建项目',
    handler: () => {
      window.electronAPI.openProjectInMain('')
      hideWindow()
    }
  },
  {
    icon: '⚙️',
    label: '打开设置',
    handler: () => {
      window.electronAPI.openProjectInMain('__settings__')
      hideWindow()
    }
  },
  {
    icon: '🔄',
    label: '刷新项目列表',
    handler: () => {
      projectStore.loadProjects()
    }
  }
]

onMounted(async () => {
  await settingsStore.loadSettings()
  await projectStore.loadProjects()
  inputRef.value?.focus()
})

function hideWindow() {
  localQuery.value = ''
  results.value = []
  selectedIndex.value = 0
  window.electronAPI.hideSearchWindow()
}

function handleSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    const keyword = localQuery.value
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
  }, 300)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') {
    e.stopPropagation()
  }
}

function handleArrowDown() {
  if (localQuery.value) {
    if (results.value.length === 0) return
    selectedIndex.value = (selectedIndex.value + 1) % results.value.length
  } else {
    panelSelectedIndex.value = (panelSelectedIndex.value + 1) % panelTotalCount.value
  }
}

function handleArrowUp() {
  if (localQuery.value) {
    if (results.value.length === 0) return
    selectedIndex.value = (selectedIndex.value - 1 + results.value.length) % results.value.length
  } else {
    panelSelectedIndex.value = (panelSelectedIndex.value - 1 + panelTotalCount.value) % panelTotalCount.value
  }
}

function handleEnter() {
  if (localQuery.value) {
    const selected = results.value[selectedIndex.value]
    if (selected) {
      handleSelect(selected)
    }
  } else {
    const idx = panelSelectedIndex.value
    if (idx < recentProjects.value.length) {
      const project = recentProjects.value[idx]
      if (project) openProject(project.id)
    } else {
      const actionIdx = idx - recentProjects.value.length
      if (quickActions[actionIdx]) {
        quickActions[actionIdx].handler()
      }
    }
  }
}

function handleSelect(result: SearchResult) {
  if (result.type === 'project' && result.projectId) {
    searchStore.addToRecent(result.projectId)
    window.electronAPI.openProjectInMain(result.projectId)
  } else if (result.path) {
    window.electronAPI.openFolder(result.path)
  }
  hideWindow()
}

function openProject(projectId: string) {
  searchStore.addToRecent(projectId)
  window.electronAPI.openProjectInMain(projectId)
  hideWindow()
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    project: '项目',
    file: '文件',
    code: '代码'
  }
  return labels[type] || type
}
</script>

<style scoped>
.search-window {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: transparent;
  padding: 0;
  overflow: hidden;
}

.search-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-dialog);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(0, 0, 0, 0.05);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  padding: 18px 22px;
  gap: 14px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.search-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 18px;
  background: transparent;
  color: var(--text-primary);
  font-weight: 400;
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.search-hint {
  font-size: 11px;
  color: var(--text-tertiary);
  padding: 3px 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

/* 扩展面板 */
.search-panel {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}

/* 面板区块 */
.panel-section {
  padding: 4px 0;
}

.panel-section + .panel-section {
  border-top: 1px solid var(--border-color);
  margin-top: 4px;
  padding-top: 8px;
}

.panel-section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 6px 14px 4px;
}

.panel-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.panel-item:hover,
.panel-item.active {
  background: var(--bg-hover);
}

.panel-item.active {
  background: var(--color-primary-light);
}

.panel-item-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.panel-item.active .panel-item-icon {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.panel-item-icon.action-icon {
  font-size: 15px;
  background: transparent;
}

.panel-item-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.panel-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-item-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 搜索结果 */
.search-results {
  overflow-y: auto;
  flex: 1;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.search-result-item:hover,
.search-result-item.active {
  background: var(--bg-hover);
}

.search-result-item.active {
  background: var(--color-primary-light);
}

.result-type-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.search-result-item.active .result-type-icon {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-type-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: var(--text-secondary);
  font-size: 14px;
}

.search-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: var(--text-secondary);
  font-size: 13px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
