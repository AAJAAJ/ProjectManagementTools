<template>
  <Transition name="overlay">
    <div class="search-overlay" @click.self="hide">
      <div class="search-container" @keydown="handleKeydown">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref="inputRef"
            v-model="localQuery"
            type="text"
            class="search-input"
            placeholder="搜索项目、代码、工具..."
            @input="handleSearch"
            @keydown.escape="hide"
            @keydown.down.prevent="handleArrowDown"
            @keydown.up.prevent="handleArrowUp"
            @keydown.enter.prevent="handleEnter"
          />
          <span class="search-hint">ESC 关闭</span>
        </div>

        <!-- 扩展面板 -->
        <Transition name="panel">
          <div class="search-panel">
            <!-- 加载状态 -->
            <div v-if="searchStore.loading" class="search-loading">
              <div class="spinner"></div>
              <span>搜索中...</span>
            </div>

            <!-- 有输入：搜索结果 -->
            <template v-else-if="localQuery">
              <div class="search-results" v-if="searchStore.results.length > 0">
                <div
                  v-for="(result, index) in searchStore.results"
                  :key="index"
                  class="search-result-item"
                  :class="['result-type-' + result.type, { active: index === searchStore.selectedIndex }]"
                  @click="handleSelect(result)"
                  @mouseenter="searchStore.selectedIndex = index"
                >
                  <span class="result-type-icon" :class="'icon-type-' + result.type">
                    <svg v-if="result.type === 'project'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    </svg>
                    <svg v-else-if="result.type === 'file'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
                    </svg>
                    <svg v-else-if="result.type === 'code'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/>
                    </svg>
                    <svg v-else-if="result.type === 'tool'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                  </span>
                  <div class="result-content">
                    <span class="result-title">{{ result.title }}</span>
                    <span class="result-subtitle">{{ result.subtitle }}</span>
                  </div>
                  <span class="result-type-badge" :class="'badge-type-' + result.type">{{ getTypeLabel(result.type) }}</span>
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

            <!-- 无输入：星标项目 + 最近项目 + 快捷操作 -->
            <template v-else>
              <!-- 星标项目 -->
              <div class="panel-section" v-if="starredProjects.length > 0">
                <div class="panel-section-title">星标项目</div>
                <div
                  v-for="(project, index) in starredProjects"
                  :key="project.id"
                  class="panel-item"
                  :class="{ active: panelSelectedIndex === index }"
                  @click="openProject(project.id)"
                  @mouseenter="panelSelectedIndex = index"
                >
                  <span class="panel-item-icon starred-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </span>
                  <div class="panel-item-content">
                    <span class="panel-item-title">{{ project.name }}</span>
                    <span class="panel-item-subtitle">{{ project.description || project.path }}</span>
                  </div>
                </div>
              </div>

              <!-- 最近项目 -->
              <div class="panel-section" v-if="searchStore.recentProjects.length > 0">
                <div class="panel-section-title">最近项目</div>
                <div
                  v-for="(project, index) in searchStore.recentProjects"
                  :key="project.id"
                  class="panel-item"
                  :class="{ active: panelSelectedIndex === starredCount + index }"
                  @click="openProject(project.id)"
                  @mouseenter="panelSelectedIndex = starredCount + index"
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
                  :class="{ active: panelSelectedIndex === starredCount + recentCount + index }"
                  @click="action.handler()"
                  @mouseenter="panelSelectedIndex = starredCount + recentCount + index"
                >
                  <span class="panel-item-icon action-icon">{{ action.icon }}</span>
                  <div class="panel-item-content">
                    <span class="panel-item-title">{{ action.label }}</span>
                  </div>
                  <span v-if="action.shortcut" class="panel-item-shortcut">{{ action.shortcut }}</span>
                </div>
              </div>
            </template>
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/search'
import { useProjectStore } from '@/stores/project'
import type { SearchResult } from '@/types'

const router = useRouter()
const searchStore = useSearchStore()
const projectStore = useProjectStore()
const localQuery = ref('')
const inputRef = ref<HTMLInputElement>()
const panelSelectedIndex = ref(0)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

/** 星标项目 */
const starredProjects = computed(() => projectStore.projects.filter(p => p.starred))

/** 星标项目数量（用于键盘导航偏移计算） */
const starredCount = computed(() => starredProjects.value.length)

/** 最近项目数量（用于键盘导航偏移计算） */
const recentCount = computed(() => searchStore.recentProjects.length)

/** 面板总可选项数量 */
const panelTotalCount = computed(() => starredCount.value + recentCount.value + quickActions.length)

/** 快捷操作列表 */
const quickActions = [
  {
    icon: '📁',
    label: '新建项目',
    shortcut: '',
    handler: () => {
      hide()
      // 通过路由跳转到首页并触发新建（通过 query 参数）
      router.push({ path: '/', query: { action: 'new' } })
    }
  },
  {
    icon: '⚙️',
    label: '打开设置',
    shortcut: '',
    handler: () => {
      hide()
      router.push('/settings')
    }
  },
  {
    icon: '🔄',
    label: '刷新项目列表',
    shortcut: '',
    handler: () => {
      hide()
      projectStore.loadProjects()
    }
  }
]

/** 自动聚焦：监听 isVisible 变化 */
watch(() => searchStore.isVisible, async (visible) => {
  if (visible) {
    localQuery.value = ''
    panelSelectedIndex.value = 0
    await nextTick()
    inputRef.value?.focus()
  }
})

function hide() {
  localQuery.value = ''
  searchStore.hide()
}

function handleSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    searchStore.search(localQuery.value)
  }, 300)
}

function handleKeydown(e: KeyboardEvent) {
  // 搜索面板打开时，阻止所有键盘事件冒泡到外部
  e.stopPropagation()
}

function handleArrowDown() {
  if (localQuery.value) {
    searchStore.selectNext()
  } else {
    panelSelectedIndex.value = (panelSelectedIndex.value + 1) % panelTotalCount.value
  }
}

function handleArrowUp() {
  if (localQuery.value) {
    searchStore.selectPrev()
  } else {
    panelSelectedIndex.value = (panelSelectedIndex.value - 1 + panelTotalCount.value) % panelTotalCount.value
  }
}

function handleEnter() {
  if (localQuery.value) {
    const selected = searchStore.getSelected()
    if (selected) {
      handleSelect(selected)
    }
  } else {
    // 面板模式下按 Enter
    const idx = panelSelectedIndex.value
    if (idx < starredCount.value) {
      const project = starredProjects.value[idx]
      if (project) openProject(project.id)
    } else if (idx < starredCount.value + recentCount.value) {
      const project = searchStore.recentProjects[idx - starredCount.value]
      if (project) openProject(project.id)
    } else {
      const actionIdx = idx - starredCount.value - recentCount.value
      if (quickActions[actionIdx]) {
        quickActions[actionIdx].handler()
      }
    }
  }
}

function handleSelect(result: SearchResult) {
  if (result.type === 'project' && result.projectId) {
    searchStore.addToRecent(result.projectId)
    router.push(`/project/${result.projectId}`)
  } else if (result.type === 'tool' && result.toolId) {
    window.electronAPI.openTool(result.toolId)
  } else if (result.path) {
    window.electronAPI.openFolder(result.path)
  }
  hide()
}

function openProject(projectId: string) {
  searchStore.addToRecent(projectId)
  hide()
  router.push(`/project/${projectId}`)
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    project: '项目',
    file: '文件',
    code: '代码',
    tool: '工具'
  }
  return labels[type] || type
}
</script>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  justify-content: center;
  padding-top: 100px;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.search-container {
  width: 600px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  animation: containerIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  align-self: flex-start;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

@keyframes containerIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  gap: 12px;
  background: var(--bg-dialog);
  border-bottom: 1px solid var(--border-color);
}

.search-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  background: transparent;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.search-hint {
  font-size: 11px;
  color: var(--text-tertiary);
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

/* 扩展面板 */
.search-panel {
  background: var(--bg-dialog);
  max-height: 400px;
  overflow-y: auto;
  padding: 6px;
  animation: panelExpand 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes panelExpand {
  from {
    opacity: 0;
    transform: translateY(-4px);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 400px;
  }
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

.starred-icon {
  color: var(--color-warning);
  background: var(--color-warning-light);
}

.panel-item.active .starred-icon {
  color: var(--color-warning);
  background: var(--color-warning-light);
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

.panel-item-shortcut {
  font-size: 11px;
  color: var(--text-tertiary);
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
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

/* 不同类型图标颜色 */
.icon-type-project {
  color: #4f8cff;
  background: rgba(79, 140, 255, 0.12);
}

.icon-type-file {
  color: #6366f1;
  background: rgba(99, 102, 241, 0.12);
}

.icon-type-code {
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
}

.icon-type-tool {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
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

/* 不同类型标签颜色 */
.badge-type-project {
  background: rgba(79, 140, 255, 0.12);
  color: #4f8cff;
}

.badge-type-file {
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
}

.badge-type-code {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.badge-type-tool {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
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

/* Transition */
.overlay-enter-active {
  transition: opacity 0.2s ease;
}
.overlay-leave-active {
  transition: opacity 0.15s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* Panel transition */
.panel-enter-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.panel-leave-active {
  transition: all 0.15s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
