<template>
  <div class="project-view">
    <!-- 顶部区域 -->
    <header class="page-header">
      <div class="header-left">
        <button class="btn btn-ghost" @click="goBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
          返回
        </button>
        <h1 v-if="project">{{ project.name }}</h1>
      </div>
      <div class="header-actions" v-if="project">
        <button class="btn" @click="showEditDialog = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          编辑
        </button>
        <button class="btn btn-danger" @click="showDeleteConfirm = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          删除
        </button>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="!project" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 项目详情 -->
    <div v-else class="project-detail">
      <!-- 代码模块区域 -->
      <section class="detail-section" v-if="project.codeModules && project.codeModules.length > 0">
        <h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/>
          </svg>
          代码模块
        </h2>
        <div class="modules-grid">
          <div
            class="module-card"
            :class="{ 'module-card--pinned': mod.pinned }"
            v-for="(mod, index) in sortedCodeModules"
            :key="index"
          >
            <div class="module-header">
              <div class="module-icon">{{ mod.label.charAt(0) }}</div>
              <div class="module-info">
                <h3>
                  {{ mod.label }}
                  <button
                    v-if="project.codeModules.length > 1"
                    class="pin-btn"
                    :class="{ 'pin-btn--active': mod.pinned }"
                    :title="mod.pinned ? '取消置顶' : '置顶'"
                    @click="toggleModulePin(index)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" :fill="mod.pinned ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </button>
                </h3>
                <span class="module-path" :title="mod.path">{{ mod.path }}</span>
              </div>
            </div>
            <div class="module-meta" v-if="mod.framework || mod.language">
              <span class="badge badge-primary" v-if="mod.framework">{{ mod.framework }}</span>
              <span class="badge badge-primary" v-if="mod.language">{{ mod.language }}</span>
            </div>
            <div class="module-actions">
              <!-- 编译器快捷打开按钮 -->
              <div class="editor-quick-open" v-if="editors.length > 0">
                <button
                  class="btn btn-sm btn-primary"
                  @click="openInEditor(getModuleEditorId(mod), mod.path)"
                  :title="'用 ' + getModuleEditorName(mod) + ' 打开'"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  {{ getModuleEditorName(mod) }}
                </button>
                <button
                  class="btn btn-sm editor-switch-btn"
                  @click.stop="toggleEditorMenu('mod-' + index)"
                  title="切换编辑器"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                <div class="dropdown-menu" v-if="activeEditorMenu === 'mod-' + index" @click.stop>
                  <button
                    v-for="editor in editors"
                    :key="editor.id"
                    class="dropdown-item"
                    :class="{ 'dropdown-item--active': editor.id === getModuleEditorId(mod) }"
                    @click.stop="openInEditor(editor.id, mod.path)"
                  >
                    {{ editor.name }}
                  </button>
                </div>
              </div>
              <button class="btn btn-sm" v-else-if="mod.editorId && getEditorById(mod.editorId)" @click="openInEditor(mod.editorId, mod.path)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                用 {{ getEditorById(mod.editorId)?.name }} 打开
              </button>
              <button class="btn btn-sm" @click="openFolder(mod.path)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                打开文件夹
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 文档区域 -->
      <section class="detail-section" v-if="project.docs">
        <h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
          文档
        </h2>
        <div class="docs-card">
          <div class="docs-info">
            <span class="docs-path">{{ project.docs }}</span>
          </div>
          <button class="btn btn-sm" @click="openFolder(project.docs!)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            打开文件夹
          </button>
        </div>
      </section>

      <!-- 项目信息区 -->
      <section class="detail-section">
        <h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          项目信息
        </h2>
        <div class="info-card">
          <div class="info-grid">
            <div class="info-item">
              <label>项目路径</label>
              <span class="path-link" @click="openFolder(project.path)">{{ project.path }}</span>
            </div>
            <div class="info-item">
              <label>描述</label>
              <span>{{ project.description || '暂无描述' }}</span>
            </div>
            <div class="info-item">
              <label>创建时间</label>
              <span>{{ formatDate(project.createdAt) }}</span>
            </div>
            <div class="info-item">
              <label>更新时间</label>
              <span>{{ formatDate(project.updatedAt) }}</span>
            </div>
          </div>
          <div class="info-tags" v-if="project.tags.length > 0">
            <label>标签</label>
            <div class="tags">
              <span class="badge badge-primary" v-for="tag in project.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 快捷操作 -->
      <section class="detail-section">
        <h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
          </svg>
          快捷操作
        </h2>
        <div class="quick-actions">
          <button class="btn" @click="openFolder(project.path)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            打开项目文件夹
          </button>
          <button class="btn" v-if="editors.length > 0" @click="openInEditor(editors[0].id, project.path)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            用 {{ editors[0].name }} 打开
          </button>
        </div>
      </section>
    </div>

    <!-- 编辑对话框 -->
    <ProjectDialog
      v-if="showEditDialog && project"
      :project="project"
      @close="showEditDialog = false"
      @submit="handleUpdate"
    />

    <!-- 删除确认 -->
    <div v-if="showDeleteConfirm" class="dialog-overlay" @click.self="showDeleteConfirm = false">
      <div class="dialog" style="max-width: 400px;">
        <div class="dialog-header">
          <h2>确认删除</h2>
        </div>
        <div class="dialog-body">
          <p>确定要删除项目 <strong>{{ project?.name }}</strong> 吗？</p>
          <p class="text-muted text-sm" style="margin-top: 8px;">此操作不会删除项目文件，仅从管理列表中移除。</p>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="showDeleteConfirm = false">取消</button>
          <button class="btn btn-danger" @click="handleDeleteProject">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import ProjectDialog from '@/components/ProjectDialog.vue'
import type { Project, Editor, ProjectInput, CodeModule } from '@/types'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const project = ref<Project | null>(null)
const editors = ref<Editor[]>([])
const showEditDialog = ref(false)
const showDeleteConfirm = ref(false)
const activeEditorMenu = ref<string | null>(null)

/** 置顶模块排在前面 */
const sortedCodeModules = computed(() => {
  if (!project.value?.codeModules) return []
  return [...project.value.codeModules].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return 0
  })
})

onMounted(async () => {
  const id = route.params.id as string
  await projectStore.loadProjects()
  project.value = projectStore.projects.find(p => p.id === id) || null
  try {
    const allEditors = await window.electronAPI.getAvailableEditors()
    editors.value = allEditors.filter(e => e.installed)
  } catch (e) {
    console.error('加载编辑器列表失败:', e)
  }
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside() {
  activeEditorMenu.value = null
}

function goBack() {
  router.push('/')
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function getEditorById(editorId: string): Editor | undefined {
  return editors.value.find(e => e.id === editorId)
}

/** 获取模块应使用的编辑器ID */
function getModuleEditorId(mod: CodeModule): string {
  if (mod.editorId) {
    const editor = getEditorById(mod.editorId)
    if (editor) return editor.id
  }
  return editors.value[0]?.id || ''
}

/** 获取模块应使用的编辑器名称 */
function getModuleEditorName(mod: CodeModule): string {
  const editorId = getModuleEditorId(mod)
  const editor = getEditorById(editorId)
  return editor?.name || '编辑器'
}

async function openFolder(path: string) {
  await window.electronAPI.openFolder(path)
}

async function openInEditor(editorId: string, path: string) {
  await window.electronAPI.openInEditor(editorId, path)
  activeEditorMenu.value = null
}

function toggleEditorMenu(type: string) {
  activeEditorMenu.value = activeEditorMenu.value === type ? null : type
}

/** 切换模块置顶状态 */
async function toggleModulePin(index: number) {
  if (!project.value) return
  const mod = sortedCodeModules.value[index]
  const realIndex = project.value.codeModules.findIndex(m => m.path === mod.path && m.label === mod.label)
  if (realIndex === -1) return
  const updatedModules = [...project.value.codeModules]
  updatedModules[realIndex] = { ...updatedModules[realIndex], pinned: !updatedModules[realIndex].pinned }
  const updated = await projectStore.updateProject(project.value.id, { codeModules: updatedModules } as any)
  project.value = updated
}

async function handleUpdate(data: ProjectInput) {
  if (!project.value) return
  const updated = await projectStore.updateProject(project.value.id, data)
  project.value = updated
  showEditDialog.value = false
}

async function handleDeleteProject() {
  if (!project.value) return
  await projectStore.deleteProject(project.value.id)
  router.push('/')
}
</script>

<style scoped>
.project-view {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  font-size: var(--font-xl);
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px;
  color: var(--text-secondary);
}

.detail-section {
  margin-bottom: 28px;
}

.detail-section h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-md);
  font-weight: 600;
  margin-bottom: 14px;
  color: var(--text-primary);
}

.detail-section h2 svg {
  color: var(--text-secondary);
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;
}

.module-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.module-card--pinned {
  border-color: var(--color-warning);
  background: linear-gradient(135deg, var(--color-warning-light) 0%, var(--bg-secondary) 100%);
}

.module-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.module-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: var(--font-xs);
  font-weight: 600;
  flex-shrink: 0;
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.module-info {
  min-width: 0;
}

.module-info h3 {
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.pin-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.pin-btn:hover {
  color: var(--color-warning);
  background: var(--color-warning-light);
}

.pin-btn--active {
  color: var(--color-warning);
}

.module-path {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.module-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.module-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.editor-quick-open {
  position: relative;
  display: flex;
}

.editor-quick-open .btn-primary {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.editor-switch-btn {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  padding: 5px 6px;
}

.editor-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: var(--bg-dialog);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 100;
  min-width: 140px;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: var(--font-sm);
  text-align: left;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.dropdown-item--active {
  color: var(--color-primary);
  font-weight: 500;
}

.docs-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
}

.docs-path {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  font-family: monospace;
}

.info-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 18px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span {
  font-size: var(--font-base);
  color: var(--text-primary);
}

.path-link {
  cursor: pointer;
  color: var(--color-primary) !important;
}

.path-link:hover {
  text-decoration: underline;
}

.info-tags {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.info-tags label {
  display: block;
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.quick-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
