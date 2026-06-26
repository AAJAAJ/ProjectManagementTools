<template>
  <div class="title-bar">
    <div class="title-bar-drag">
      <span class="app-title">项目管理工具</span>
    </div>
    <div class="title-bar-controls">
      <button class="control-btn" @click="minimize" title="最小化">
        <svg class="control-icon" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
        </svg>
      </button>
      <button class="control-btn" @click="maximize" :title="isMaximized ? '还原' : '最大化'">
        <svg v-if="!isMaximized" class="control-icon" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <rect x="1.5" y="1.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1" />
        </svg>
        <svg v-else class="control-icon" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <rect x="0.5" y="3" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1" />
          <path d="M3 3 V0.5 H9 V6.5 H6" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round" />
        </svg>
      </button>
      <button class="control-btn close-btn" @click="close" title="关闭">
        <svg class="control-icon" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <line x1="1.5" y1="1.5" x2="8.5" y2="8.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
          <line x1="8.5" y1="1.5" x2="1.5" y2="8.5" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isMaximized = ref(false)

async function minimize() {
  await window.electronAPI.windowMinimize()
}

async function maximize() {
  await window.electronAPI.windowMaximize()
  isMaximized.value = await window.electronAPI.windowIsMaximized()
}

async function close() {
  await window.electronAPI.windowClose()
}

onMounted(async () => {
  try {
    isMaximized.value = await window.electronAPI.windowIsMaximized()
  } catch { /* ignore */ }
})
</script>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  background: var(--bg-titlebar);
  border-bottom: 1px solid var(--border-color);
  -webkit-app-region: drag;
  user-select: none;
}

.title-bar-drag {
  flex: 1;
  display: flex;
  align-items: center;
  padding-left: 12px;
}

.app-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.title-bar-controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.control-btn:hover {
  background: var(--bg-hover);
}

.close-btn:hover {
  background: #e81123;
  color: white;
}

/* 统一图标尺寸，保证三个按钮图标视觉一致 */
.control-icon {
  display: block;
  flex-shrink: 0;
}
</style>
