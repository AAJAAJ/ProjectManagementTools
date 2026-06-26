<template>
  <div class="app-container" :class="themeClass">
    <TitleBar />
    <!-- 全局顶部搜索栏 -->
    <div class="global-search-bar" @click="searchStore.toggle()">
      <svg class="global-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <span class="global-search-text">搜索项目、代码、工具...</span>
      <span class="global-search-hint">{{ settingsStore.settings.appHotkey || 'Ctrl+K' }}</span>
    </div>
    <div class="app-body">
      <aside class="sidebar">
        <nav class="nav-menu">
          <router-link to="/" class="nav-item" exact-active-class="active">
            <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            <span class="nav-label">项目</span>
          </router-link>
          <router-link to="/tools" class="nav-item" active-class="active">
            <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <span class="nav-label">工具</span>
          </router-link>
        </nav>

        <!-- 设置按钮放底部 -->
        <div class="nav-footer">
          <router-link to="/settings" class="nav-item" active-class="active">
            <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span class="nav-label">设置</span>
          </router-link>
        </div>
      </aside>
      <main class="main-content">
        <router-view />
      </main>
    </div>
    <SearchOverlay v-if="searchStore.isVisible" />

    <!-- 关闭确认对话框 -->
    <div v-if="closeDialogVisible" class="dialog-overlay" @click.self="cancelClose">
      <div class="dialog close-dialog">
        <div class="dialog-header">
          <h2>您点击了关闭按钮</h2>
        </div>
        <div class="dialog-body">
          <p class="close-tip">您想要：</p>
          <label class="close-option">
            <input type="radio" v-model="closeAction" value="minimize" />
            <span>最小化到托盘</span>
          </label>
          <label class="close-option">
            <input type="radio" v-model="closeAction" value="quit" />
            <span>退出</span>
          </label>
          <label class="close-remember">
            <input type="checkbox" v-model="closeRemember" />
            <span>不再提醒</span>
          </label>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="cancelClose">取消</button>
          <button class="btn btn-primary" @click="confirmClose">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import TitleBar from './components/TitleBar.vue'
import SearchOverlay from './components/SearchOverlay.vue'
import { useSettingsStore } from './stores/settings'
import { useSearchStore } from './stores/search'
import { useProjectStore } from './stores/project'

const router = useRouter()
const settingsStore = useSettingsStore()
const searchStore = useSearchStore()
const projectStore = useProjectStore()

const themeClass = computed(() => {
  return `theme-${settingsStore.currentTheme}`
})

// 关闭确认对话框
const closeDialogVisible = ref(false)
const closeAction = ref<'minimize' | 'quit'>('minimize')
const closeRemember = ref(false)

function cancelClose() {
  closeDialogVisible.value = false
  closeRemember.value = false
}

async function confirmClose() {
  const action = closeAction.value
  const remember = closeRemember.value
  closeDialogVisible.value = false
  closeRemember.value = false
  try {
    await window.electronAPI.executeClose(action, remember)
  } catch (e) {
    console.error('执行关闭操作失败:', e)
  }
}

function handleKeydown(e: KeyboardEvent) {
  // 应用内搜索快捷键（可自定义）
  const appHotkey = settingsStore.settings.appHotkey || 'Ctrl+K'
  const parts = appHotkey.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const needCtrl = parts.includes('ctrl')
  const needMeta = parts.includes('cmd') || parts.includes('meta')
  const needAlt = parts.includes('alt')
  if ((needCtrl ? e.ctrlKey : true) && (needMeta ? e.metaKey : true) && (needAlt ? e.altKey : true) && e.key.toLowerCase() === key) {
    e.preventDefault()
    searchStore.toggle()
  }
}

onMounted(async () => {
  // 全局键盘快捷键
  document.addEventListener('keydown', handleKeydown)
  // 加载设置
  await settingsStore.loadSettings()
  // 首次运行自动扫描编辑器
  if (settingsStore.settings.firstRun) {
    try {
      await window.electronAPI.rescanEditors()
      await settingsStore.updateSettings({ firstRun: false })
    } catch { /* ignore */ }
  }
  // 加载项目数据
  await projectStore.loadProjects()
  // 监听搜索窗口的导航消息
  window.electronAPI.onNavigateToProject((projectId: string) => {
    if (projectId === '__settings__') {
      router.push('/settings')
    } else if (projectId === '') {
      router.push({ path: '/', query: { action: 'new' } })
    } else {
      router.push(`/project/${projectId}`)
    }
  })
  // 监听关闭请求，弹出确认对话框
  window.electronAPI.onCloseRequested(() => {
    closeDialogVisible.value = true
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* 全局顶部搜索栏 */
.global-search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}

.global-search-bar:hover {
  background: var(--bg-hover);
}

.global-search-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.global-search-text {
  flex: 1;
  font-size: var(--font-sm);
  color: var(--text-tertiary);
}

.global-search-hint {
  font-size: 11px;
  color: var(--text-tertiary);
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 180px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: auto;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px;
}

/* 置顶模块已移至项目行右侧按钮，不再在侧边栏显示 */

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px;
}

.nav-footer {
  padding: 0 8px;
  border-top: 1px solid var(--border-color);
  padding-top: 8px;
  margin-top: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  font-size: var(--font-base);
  border: none;
  background: transparent;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  text-decoration: none;
}

.nav-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 500;
}

.nav-icon {
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

/* 关闭确认对话框 */
.close-dialog {
  max-width: 380px;
}

.close-tip {
  margin: 0 0 12px;
  font-size: var(--font-base);
  color: var(--text-primary);
}

.close-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 6px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.close-option:hover {
  background: var(--bg-hover);
}

.close-option input {
  cursor: pointer;
}

.close-remember {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
  cursor: pointer;
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.close-remember input {
  cursor: pointer;
}
</style>
