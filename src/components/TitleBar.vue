<template>
  <div class="title-bar">
    <div class="title-bar-drag">
      <span class="app-title">项目管理工具</span>
    </div>
    <div class="title-bar-controls">
      <button class="control-btn" @click="minimize" title="最小化">
        <span class="icon">─</span>
      </button>
      <button class="control-btn" @click="maximize" title="最大化">
        <span class="icon">□</span>
      </button>
      <button class="control-btn close-btn" @click="close" title="关闭">
        <span class="icon">✕</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
async function minimize() {
  await window.electronAPI.windowMinimize()
}

async function maximize() {
  await window.electronAPI.windowMaximize()
}

async function close() {
  await window.electronAPI.windowClose()
}
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

.icon {
  font-size: 11px;
  line-height: 1;
}
</style>
