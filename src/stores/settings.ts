import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Settings } from '@/types'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({
    workspacePath: 'D:\\Projects',
    toolWorkspacePath: '',
    hotkey: 'Alt+Space',
    appHotkey: 'Ctrl+F',
    mainWindowHotkey: 'Alt+P',
    theme: 'system',
    editors: [],
    customEditors: [],
    defaultEditorId: '',
    firstRun: true,
    autoUpdate: true,
  })
  const loading = ref(false)

  /** 计算当前实际主题 */
  const currentTheme = computed(() => {
    if (settings.value.theme === 'system') {
      // 检测系统主题偏好
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return 'light'
    }
    return settings.value.theme
  })

  /** 加载设置 */
  async function loadSettings() {
    loading.value = true
    try {
      settings.value = await window.electronAPI.getSettings()
    } catch (error) {
      console.error('加载设置失败:', error)
    } finally {
      loading.value = false
    }
  }

  /** 更新设置 */
  async function updateSettings(partial: Partial<Settings>) {
    const updated = await window.electronAPI.updateSettings(partial)
    settings.value = updated
    return updated
  }

  return {
    settings,
    loading,
    currentTheme,
    loadSettings,
    updateSettings
  }
})
