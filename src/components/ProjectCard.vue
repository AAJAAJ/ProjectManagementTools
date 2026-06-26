<template>
  <div
    class="project-row"
    :class="{
      'project-row--starred': project.starred,
      'project-row--selected': selected,
      'project-row--selection-mode': selectionMode
    }"
    @click="handleClick"
    @contextmenu.prevent="onContextMenu"
  >
    <!-- 复选框 -->
    <div class="select-checkbox" :class="{ 'select-checkbox--visible': selectionMode }" @click.stop="$emit('toggle-select', project.id)">
      <div class="checkbox-inner" :class="{ 'checkbox-inner--checked': selected }">
        <svg v-if="selected" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
    </div>

    <!-- 拖拽手柄 -->
    <div class="drag-handle" @click.stop>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="3" r="1.5"/><circle cx="11" cy="3" r="1.5"/>
        <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
        <circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="13" r="1.5"/>
      </svg>
    </div>

    <!-- 星标按钮 -->
    <button
      class="star-btn"
      :class="{ 'star-btn--active': project.starred }"
      :title="project.starred ? '取消星标' : '设为星标'"
      @click.stop="$emit('toggle-star', project.id)"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" :fill="project.starred ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>

    <!-- 左侧：项目信息 -->
    <div class="row-info">
      <div class="row-main">
        <h3 class="row-title">{{ project.name }}</h3>
        <span class="row-desc">{{ project.description || project.path }}</span>
      </div>
      <div class="row-bottom">
        <div class="row-tags" v-if="project.tags.length > 0">
          <span class="tag" v-for="tag in project.tags.slice(0, 3)" :key="tag">{{ tag }}</span>
          <span class="tag-more" v-if="project.tags.length > 3">+{{ project.tags.length - 3 }}</span>
        </div>
        <!-- 置顶模块快捷按钮 -->
        <div class="pinned-modules" v-if="pinnedModules.length > 0">
          <button
            v-for="mod in pinnedModules"
            :key="mod.path"
            class="pinned-mod-btn"
            :title="mod.label + (mod.editorId ? ' - 用编辑器打开' : ' - 打开文件夹')"
            @click.stop="openPinnedModule(mod)"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            {{ mod.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 右侧：操作按钮 -->
    <div class="row-actions" @click.stop>
      <!-- 动态编辑器按钮 -->
      <button
        v-for="editor in installedEditors"
        :key="editor.id"
        class="icon-btn"
        :title="editor.name"
        @click="openEditor(editor.id)"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" opacity="0.12"/>
          <text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">{{ getEditorIconText(editor) }}</text>
        </svg>
      </button>

      <!-- 文件夹 -->
      <button class="icon-btn" title="打开项目文件夹" @click="$emit('open-folder', project.path)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      <div class="action-divider"></div>

      <!-- 编辑 -->
      <button class="icon-btn" title="编辑项目" @click="$emit('edit')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>

      <!-- 删除 -->
      <button class="icon-btn icon-btn-danger" title="删除项目" @click="$emit('delete')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3,6 5,6 21,6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>

      <div class="action-divider"></div>

      <!-- 更多操作 -->
      <button class="icon-btn" title="更多操作" @click="onMoreClick">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="19" cy="12" r="2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Project, Editor, CodeModule } from '@/types'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{
  project: Project
  selected: boolean
  selectionMode: boolean
}>()

const emit = defineEmits<{
  click: []
  edit: []
  delete: []
  'toggle-star': [projectId: string]
  'toggle-select': [projectId: string]
  'range-select': [projectId: string]
  'open-editor': [editorId: string, path: string]
  'open-folder': [path: string]
  'context-menu': [event: { x: number; y: number; project: Project }]
}>()

const settingsStore = useSettingsStore()

/** 所有已安装的编辑器（自动检测+自定义） */
const installedEditors = computed(() => {
  const detected = (settingsStore.settings.editors || []).filter(e => e.installed)
  const custom = (settingsStore.settings.customEditors || []).filter(e => e.installed)
  return [...detected, ...custom]
})

/** 置顶的代码模块 */
const pinnedModules = computed(() => {
  if (!props.project.codeModules) return []
  return props.project.codeModules.filter(m => m.pinned)
})

function getEditorIconText(editor: Editor): string {
  if (editor.icon === 'vscode') return 'VS'
  if (editor.icon === 'idea') return 'IJ'
  if (editor.icon === 'terminal') return '>_'
  if (editor.icon === 'code') return '</>'
  if (editor.icon === 'trae') return 'T'
  if (editor.icon === 'qoder') return 'Q'
  return editor.name.charAt(0).toUpperCase()
}

function handleClick(e: MouseEvent) {
  if (e.ctrlKey || e.metaKey) {
    emit('toggle-select', props.project.id)
  } else if (e.shiftKey) {
    emit('range-select', props.project.id)
  } else {
    emit('click')
  }
}

function getCodePath(): string {
  if (props.project.codeModules && props.project.codeModules.length > 0) {
    return props.project.codeModules[0].path
  }
  return props.project.path
}

function openEditor(editorId: string) {
  // 如果有代码模块且模块指定了该编辑器，使用那个模块路径
  if (props.project.codeModules && props.project.codeModules.length > 0) {
    const matchingModule = props.project.codeModules.find(m => m.editorId === editorId)
    if (matchingModule) {
      emit('open-editor', editorId, matchingModule.path)
      return
    }
  }
  emit('open-editor', editorId, getCodePath())
}

/** 打开置顶模块 */
function openPinnedModule(mod: CodeModule) {
  if (mod.editorId) {
    emit('open-editor', mod.editorId, mod.path)
  } else if (installedEditors.value.length > 0) {
    emit('open-editor', installedEditors.value[0].id, mod.path)
  } else {
    emit('open-folder', mod.path)
  }
}

function onContextMenu(e: MouseEvent) {
  emit('context-menu', { x: e.clientX, y: e.clientY, project: props.project })
}

function onMoreClick(e: MouseEvent) {
  const btn = e.currentTarget as HTMLElement
  const rect = btn.getBoundingClientRect()
  emit('context-menu', { x: rect.left, y: rect.bottom + 4, project: props.project })
}
</script>

<style scoped>
.project-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.project-row--selected {
  background: rgba(79, 140, 255, 0.08);
  border-color: var(--color-primary, #4f8cff);
  border-left: 3px solid var(--color-primary, #4f8cff);
}

/* 星标项目使用默认底色，不做特殊高亮 */

/* 复选框 */
.select-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.select-checkbox--visible,
.project-row:hover .select-checkbox {
  opacity: 1;
}

.checkbox-inner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--text-tertiary);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  background: transparent;
}

.checkbox-inner--checked {
  background: var(--color-primary, #4f8cff);
  border-color: var(--color-primary, #4f8cff);
  color: #fff;
}

.checkbox-inner:hover {
  border-color: var(--color-primary, #4f8cff);
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--text-tertiary);
  cursor: grab;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
}

.drag-handle:active {
  cursor: grabbing;
}

.project-row:hover .drag-handle {
  opacity: 1;
}

.drag-handle:hover {
  color: var(--text-secondary);
}

.star-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  opacity: 0;
}

.project-row:hover .star-btn,
.star-btn--active {
  opacity: 1;
}

.star-btn--active {
  color: #f59e0b;
}

.star-btn:hover {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.project-row:hover {
  background: var(--bg-hover);
  border-color: var(--border-color);
}

.row-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row-main {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.row-bottom {
  display: flex;
  align-items: center;
  gap: 8px;
}

.row-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.row-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: monospace;
}

.row-tags {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.pinned-modules {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.pinned-mod-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border: 1px solid var(--color-warning-light);
  background: var(--color-warning-light);
  color: var(--color-warning);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.pinned-mod-btn:hover {
  background: var(--color-warning);
  color: #fff;
  border-color: var(--color-warning);
}

.tag {
  font-size: 11px;
  padding: 2px 7px;
  background: var(--bg-active);
  color: var(--color-primary);
  border-radius: 10px;
  white-space: nowrap;
}

.tag-more {
  font-size: 11px;
  color: var(--text-secondary);
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.project-row:hover .row-actions {
  opacity: 1;
}

.action-divider {
  width: 1px;
  height: 18px;
  background: var(--border-color);
  margin: 0 4px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: var(--bg-active);
  color: var(--color-primary);
}

.icon-btn-danger:hover {
  background: var(--color-danger-light, #fde8e8);
  color: var(--color-danger);
}
</style>
