<template>
  <div class="home-view">
    <header class="page-header">
      <div class="header-left">
        <h1>项目列表</h1>
        <span class="project-count" v-if="!projectStore.loading">
          {{ projectStore.projects.length }} 个项目
        </span>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost" @click="openScanImportDialog" title="扫描导入项目">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          扫描导入
        </button>
        <button class="btn btn-ghost" @click="showGroupDialog = true" title="新建分组">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          新建分组
        </button>
        <div class="sort-select">
          <select class="input" v-model="sortBy" @change="sortProjects">
            <option value="sortOrder">手动排序</option>
            <option value="updatedAt">最近更新</option>
            <option value="name">按名称</option>
            <option value="createdAt">创建时间</option>
          </select>
        </div>
        <button class="btn btn-primary" @click="showDialog = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建项目
        </button>
      </div>
    </header>

    <!-- 批量操作工具栏 -->
    <Transition name="batch-bar">
      <div v-if="projectStore.isSelectionMode" class="batch-toolbar">
        <div class="batch-toolbar-left">
          <span class="batch-count">已选 {{ projectStore.selectedIds.size }} 项</span>
          <button class="batch-link-btn" @click="projectStore.selectAll()">全选</button>
          <button class="batch-link-btn" @click="projectStore.clearSelection()">取消选择</button>
        </div>
        <div class="batch-toolbar-right">
          <button class="batch-action-btn" @click="handleBatchToggleStar" title="批量星标/取消星标">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            星标
          </button>
          <div class="batch-group-wrapper" @mouseenter="onBatchGroupMouseEnter" @mouseleave="onBatchGroupMouseLeave">
            <div class="batch-action-btn batch-group-dropdown">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              移至分组
            </div>
            <div v-if="showBatchGroupMenu" class="batch-group-menu">
              <div class="batch-group-menu-item" @click="handleBatchMoveToGroup(null)">未分组</div>
              <div
                v-for="group in projectStore.groups"
                :key="group.id"
                class="batch-group-menu-item"
                @click="handleBatchMoveToGroup(group.id)"
              >
                {{ group.name }}
              </div>
            </div>
          </div>
          <button class="batch-action-btn batch-action-btn--danger" @click="handleBatchDelete" title="批量删除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            删除
          </button>
        </div>
      </div>
    </Transition>

    <!-- 加载状态 -->
    <div v-if="projectStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载项目...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="projectStore.projects.length === 0" class="empty-state">
      <div class="empty-illustration">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <h3>还没有项目</h3>
      <p>点击"新建项目"开始管理你的开发项目</p>
      <button class="btn btn-primary" @click="showDialog = true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        新建项目
      </button>
    </div>

    <!-- 分组项目列表 -->
    <div v-else class="grouped-project-list">
      <div
        v-for="group in projectStore.groupedProjects"
        :key="group.id"
        class="project-group"
      >
        <!-- 分组头 -->
        <div class="group-header" @click="toggleGroupCollapse(group.id)">
          <div class="group-header-left">
            <!-- 全选复选框（仅选择模式下显示） -->
            <label
              v-if="projectStore.isSelectionMode"
              class="group-select-checkbox"
              @click.stop
            >
              <input
                type="checkbox"
                :checked="getGroupSelectionState(group.projects).all"
                :indeterminate="getGroupSelectionState(group.projects).indeterminate"
                @change="toggleGroupSelect(group.projects)"
              />
              <span class="checkbox-visual"></span>
            </label>
            <svg
              class="collapse-arrow"
              :class="{ 'collapse-arrow--collapsed': collapsedGroups.has(group.id) }"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <span class="group-name">{{ group.name }}</span>
            <span class="group-count">{{ group.projects.length }}</span>
          </div>
          <div class="group-header-actions" @click.stop>
            <template v-if="group.id !== '__starred__' && group.id !== '__ungrouped__'">
              <button class="icon-btn-sm" title="重命名分组" @click="startRenameGroup(group.id, group.name)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="icon-btn-sm icon-btn-sm-danger" title="删除分组" @click="handleDeleteGroup(group.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </template>
          </div>
        </div>

        <!-- 分组内容（带折叠动画） -->
        <div class="group-content" :class="{ 'group-content--collapsed': collapsedGroups.has(group.id) }">
          <draggable
            v-if="group.projects.length > 0"
            :model-value="group.projects"
            class="project-list"
            item-key="id"
            handle=".drag-handle"
            :animation="300"
            ghost-class="drag-ghost"
            drag-class="drag-active"
            :group="{ name: 'projects' }"
            @end="(evt: any) => onDragEnd(evt, group.id)"
          >
            <template #item="{ element }">
              <ProjectCard
                :project="element"
                :selected="projectStore.isSelected(element.id)"
                :selection-mode="projectStore.isSelectionMode"
                @click="handleCardClick(element)"
                @edit="handleEdit(element)"
                @delete="handleDelete(element)"
                @toggle-star="handleToggleStar"
                @toggle-select="handleToggleSelect"
                @range-select="handleRangeSelect"
                @open-editor="handleOpenEditor"
                @open-folder="handleOpenFolder"
                @context-menu="showContextMenu"
              />
            </template>
          </draggable>
          <div v-else class="group-empty">
            暂无项目
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑项目对话框 -->
    <ProjectDialog
      v-if="showDialog"
      :project="editingProject"
      @close="closeDialog"
      @submit="handleSubmit"
    />

    <!-- 扫描导入对话框 -->
    <div v-if="showScanImportDialog" class="dialog-overlay" @click.self="closeScanImportDialog">
      <div class="dialog scan-import-dialog">
        <div class="dialog-header">
          <h2>扫描导入项目</h2>
          <button class="btn btn-ghost btn-icon" @click="closeScanImportDialog">✕</button>
        </div>
        <div class="dialog-body">
          <!-- 扫描目录选择 -->
          <div class="form-group">
            <label>扫描目录</label>
            <div class="input-with-btn">
              <input
                v-model="scanImportPath"
                class="input"
                placeholder="选择要扫描的目录"
                readonly
              />
              <button class="btn" @click="selectScanImportPath">选择</button>
            </div>
          </div>

          <!-- 扫描中 -->
          <div v-if="scanImportLoading" class="scan-loading">
            <div class="spinner"></div>
            <span>正在扫描目录...</span>
          </div>

          <!-- 扫描结果 -->
          <div v-if="scanCandidates.length > 0" class="scan-results-section">
            <div class="scan-results-header">
              <label>
                <input type="checkbox" :checked="allNewChecked" @change="toggleCheckAll" />
                全选新项目
              </label>
              <span class="scan-summary">
                共 {{ scanCandidates.length }} 个，已存在 {{ scanCandidates.filter(c => c.exists).length }} 个，选中 {{ checkedNewCount }} 个
              </span>
            </div>
            <div class="scan-candidates-list">
              <label
                v-for="candidate in scanCandidates"
                :key="candidate.path"
                class="candidate-item"
                :class="{ 'candidate-exists': candidate.exists }"
              >
                <input
                  type="checkbox"
                  :checked="scanCheckedPaths.has(candidate.path)"
                  :disabled="candidate.exists"
                  @change="toggleCheck(candidate.path)"
                />
                <span class="candidate-name">{{ candidate.name }}</span>
                <span v-if="candidate.exists" class="candidate-badge badge-exists">已存在</span>
                <span v-if="!candidate.exists && candidate.codeModuleCount > 0" class="candidate-badge badge-code">
                  {{ candidate.codeModuleCount }} 个代码模块
                </span>
                <span v-if="!candidate.exists && candidate.hasDocs" class="candidate-badge badge-docs">含文档</span>
              </label>
            </div>
          </div>

          <!-- 导入结果 -->
          <div v-if="scanImportResult" class="scan-import-result">
            <p>导入完成：成功 {{ scanImportResult.imported }} 个，跳过 {{ scanImportResult.skipped }} 个</p>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="closeScanImportDialog">关闭</button>
          <button
            v-if="scanCandidates.length > 0 && !scanImportResult"
            class="btn btn-primary"
            @click="confirmScanImport"
            :disabled="checkedNewCount === 0 || scanImportLoading"
          >
            导入选中 ({{ checkedNewCount }})
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="deletingProject" class="dialog-overlay" @click.self="deletingProject = null">
      <div class="dialog" style="max-width: 400px;">
        <div class="dialog-header">
          <h2>确认删除</h2>
        </div>
        <div class="dialog-body">
          <p>确定要删除项目 <strong>{{ deletingProject.name }}</strong> 吗？</p>
          <p class="text-muted text-sm" style="margin-top: 8px;">此操作不会删除项目文件，仅从管理列表中移除。</p>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="deletingProject = null">取消</button>
          <button class="btn btn-danger" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>

    <!-- 批量删除确认对话框 -->
    <div v-if="showBatchDeleteConfirm" class="dialog-overlay" @click.self="showBatchDeleteConfirm = false">
      <div class="dialog" style="max-width: 400px;">
        <div class="dialog-header">
          <h2>确认批量删除</h2>
        </div>
        <div class="dialog-body">
          <p>确定要删除选中的 <strong>{{ projectStore.selectedIds.size }}</strong> 个项目吗？</p>
          <p class="text-muted text-sm" style="margin-top: 8px;">此操作不会删除项目文件，仅从管理列表中移除。</p>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="showBatchDeleteConfirm = false">取消</button>
          <button class="btn btn-danger" @click="confirmBatchDelete">删除</button>
        </div>
      </div>
    </div>

    <!-- 新建分组对话框 -->
    <div v-if="showGroupDialog" class="dialog-overlay" @click.self="showGroupDialog = false">
      <div class="dialog" style="max-width: 380px;">
        <div class="dialog-header">
          <h2>新建分组</h2>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>分组名称</label>
            <input
              v-model="newGroupName"
              class="input"
              placeholder="输入分组名称"
              @keydown.enter="confirmAddGroup"
              ref="groupNameInput"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="showGroupDialog = false">取消</button>
          <button class="btn btn-primary" @click="confirmAddGroup" :disabled="!newGroupName.trim()">创建</button>
        </div>
      </div>
    </div>

    <!-- 重命名分组对话框 -->
    <div v-if="renamingGroupId" class="dialog-overlay" @click.self="renamingGroupId = null">
      <div class="dialog" style="max-width: 380px;">
        <div class="dialog-header">
          <h2>重命名分组</h2>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>分组名称</label>
            <input
              v-model="renameGroupName"
              class="input"
              placeholder="输入新名称"
              @keydown.enter="confirmRenameGroup"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="renamingGroupId = null">取消</button>
          <button class="btn btn-primary" @click="confirmRenameGroup" :disabled="!renameGroupName.trim()">保存</button>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      :items="contextMenu.items"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :visible="contextMenu.visible"
      @close="contextMenu.visible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { useSettingsStore } from '@/stores/settings'
import draggable from 'vuedraggable'
import ProjectCard from '@/components/ProjectCard.vue'
import ProjectDialog from '@/components/ProjectDialog.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import type { MenuItem, MenuChildItem } from '@/components/ContextMenu.vue'
import type { Project, ProjectInput, ScanCandidate } from '@/types'

const router = useRouter()
const projectStore = useProjectStore()
const settingsStore = useSettingsStore()

const showDialog = ref(false)
const editingProject = ref<Project | null>(null)
const deletingProject = ref<Project | null>(null)
const sortBy = ref<'sortOrder' | 'updatedAt' | 'name' | 'createdAt'>('sortOrder')

// 批量操作相关
const showBatchGroupMenu = ref(false)
const showBatchDeleteConfirm = ref(false)
let batchGroupMenuTimer: ReturnType<typeof setTimeout> | null = null

function onBatchGroupMouseEnter() {
  if (batchGroupMenuTimer) {
    clearTimeout(batchGroupMenuTimer)
    batchGroupMenuTimer = null
  }
  showBatchGroupMenu.value = true
}

function onBatchGroupMouseLeave() {
  batchGroupMenuTimer = setTimeout(() => {
    showBatchGroupMenu.value = false
  }, 150)
}

// 分组相关
const showGroupDialog = ref(false)
const newGroupName = ref('')
const renamingGroupId = ref<string | null>(null)
const renameGroupName = ref('')

// 扫描导入相关
const showScanImportDialog = ref(false)
const scanImportPath = ref('')
const scanImportLoading = ref(false)
const scanCandidates = ref<ScanCandidate[]>([])
const scanCheckedPaths = ref<Set<string>>(new Set())
const scanImportResult = ref<{ imported: number; skipped: number } | null>(null)

// 本地折叠状态（解决虚拟分组无法折叠的问题）
const collapsedGroups = ref<Set<string>>(new Set())

// 右键菜单状态
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  items: [] as MenuItem[],
  targetProject: null as Project | null
})

onMounted(async () => {
  await projectStore.loadProjects()
  await projectStore.loadGroups()
  await settingsStore.loadSettings()
  // 初始化折叠状态：从分组数据中读取
  for (const group of projectStore.groups) {
    if (group.collapsed) {
      collapsedGroups.value.add(group.id)
    }
  }
  // 键盘事件
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// ============ 扫描导入相关 ============

/** 已选中且非已存在的候选数量 */
const checkedNewCount = computed(() => {
  return scanCandidates.value.filter(c => !c.exists && scanCheckedPaths.value.has(c.path)).length
})

/** 是否全选了所有新项目 */
const allNewChecked = computed(() => {
  const newCandidates = scanCandidates.value.filter(c => !c.exists)
  return newCandidates.length > 0 && newCandidates.every(c => scanCheckedPaths.value.has(c.path))
})

/** 打开扫描导入对话框，默认填充工作区路径 */
function openScanImportDialog() {
  const workspace = settingsStore.settings.workspacePath
  if (workspace) {
    scanImportPath.value = workspace
    doScan()
  } else {
    scanImportPath.value = ''
    scanCandidates.value = []
  }
  scanImportResult.value = null
  scanCheckedPaths.value = new Set()
  showScanImportDialog.value = true
}

function closeScanImportDialog() {
  showScanImportDialog.value = false
  scanCandidates.value = []
  scanCheckedPaths.value = new Set()
  scanImportResult.value = null
}

/** 选择扫描目录 */
async function selectScanImportPath() {
  const path = await window.electronAPI.selectFolder()
  if (!path) return
  scanImportPath.value = path
  scanCandidates.value = []
  scanCheckedPaths.value = new Set()
  scanImportResult.value = null
  await doScan()
}

/** 执行预扫描 */
async function doScan() {
  if (!scanImportPath.value) return
  scanImportLoading.value = true
  scanImportResult.value = null
  try {
    const candidates = await window.electronAPI.scanProjectsPreview(scanImportPath.value)
    scanCandidates.value = candidates
    // 默认勾选所有新项目
    scanCheckedPaths.value = new Set(candidates.filter(c => !c.exists).map(c => c.path))
  } catch (e) {
    console.error('扫描失败:', e)
    alert('扫描失败: ' + (e as Error).message)
  } finally {
    scanImportLoading.value = false
  }
}

/** 切换单个候选的勾选状态 */
function toggleCheck(path: string) {
  const newSet = new Set(scanCheckedPaths.value)
  if (newSet.has(path)) {
    newSet.delete(path)
  } else {
    newSet.add(path)
  }
  scanCheckedPaths.value = newSet
}

/** 全选/取消全选新项目 */
function toggleCheckAll() {
  if (allNewChecked.value) {
    // 取消全选
    scanCheckedPaths.value = new Set()
  } else {
    // 全选新项目
    scanCheckedPaths.value = new Set(scanCandidates.value.filter(c => !c.exists).map(c => c.path))
  }
}

/** 确认导入选中的项目 */
async function confirmScanImport() {
  const paths = scanCandidates.value
    .filter(c => !c.exists && scanCheckedPaths.value.has(c.path))
    .map(c => c.path)
  if (paths.length === 0) return

  scanImportLoading.value = true
  try {
    const result = await window.electronAPI.batchImportProjects(paths)
    scanImportResult.value = result
    // 刷新项目列表
    await projectStore.loadProjects()
  } catch (e) {
    console.error('导入失败:', e)
    alert('导入失败: ' + (e as Error).message)
  } finally {
    scanImportLoading.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  // Esc 清除选择
  if (e.key === 'Escape' && projectStore.isSelectionMode) {
    projectStore.clearSelection()
    e.preventDefault()
  }
  // Ctrl+A 全选
  if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !isInputFocused()) {
    e.preventDefault()
    projectStore.selectAll()
  }
}

function isInputFocused(): boolean {
  const active = document.activeElement
  if (!active) return false
  return active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable
}

function goToProject(id: string) {
  // 如果处于多选模式，点击不进入详情
  if (projectStore.isSelectionMode) return
  router.push(`/project/${id}`)
}

function handleCardClick(project: Project) {
  if (projectStore.isSelectionMode) {
    // 多选模式下普通点击切换选中
    projectStore.toggleSelect(project.id)
  } else {
    goToProject(project.id)
  }
}

function handleToggleSelect(projectId: string) {
  projectStore.toggleSelect(projectId)
}

function handleRangeSelect(projectId: string) {
  projectStore.rangeSelect(projectId)
}

function handleDelete(project: Project) {
  deletingProject.value = project
}

function handleEdit(project: Project) {
  editingProject.value = project
  showDialog.value = true
}

async function handleOpenEditor(editorId: string, path: string) {
  await window.electronAPI.openInEditor(editorId, path)
}

async function handleOpenFolder(path: string) {
  await window.electronAPI.openFolder(path)
}

async function handleToggleStar(projectId: string) {
  await projectStore.toggleStar(projectId)
}

async function confirmDelete() {
  if (!deletingProject.value) return
  await projectStore.deleteProject(deletingProject.value.id)
  deletingProject.value = null
}

function closeDialog() {
  showDialog.value = false
  editingProject.value = null
}

async function handleSubmit(data: ProjectInput) {
  if (editingProject.value) {
    await projectStore.updateProject(editingProject.value.id, data)
  } else {
    await projectStore.addProject(data)
  }
  closeDialog()
}

function sortProjects() {
  // Reactivity handles it via computed
}

function toggleGroupCollapse(groupId: string) {
  const isCollapsed = collapsedGroups.value.has(groupId)
  if (isCollapsed) {
    collapsedGroups.value.delete(groupId)
  } else {
    collapsedGroups.value.add(groupId)
  }
  // 强制触发响应式更新
  collapsedGroups.value = new Set(collapsedGroups.value)
  // 对于自定义分组，持久化折叠状态
  if (groupId !== '__starred__' && groupId !== '__ungrouped__') {
    projectStore.updateGroup(groupId, { collapsed: !isCollapsed })
  }
}

async function confirmAddGroup() {
  const name = newGroupName.value.trim()
  if (!name) return
  await projectStore.addGroup(name)
  newGroupName.value = ''
  showGroupDialog.value = false
}

function startRenameGroup(groupId: string, currentName: string) {
  renamingGroupId.value = groupId
  renameGroupName.value = currentName
}

async function confirmRenameGroup() {
  if (!renamingGroupId.value || !renameGroupName.value.trim()) return
  await projectStore.updateGroup(renamingGroupId.value, { name: renameGroupName.value.trim() })
  renamingGroupId.value = null
  renameGroupName.value = ''
}

async function handleDeleteGroup(groupId: string) {
  await projectStore.deleteGroup(groupId)
}

async function onDragEnd(evt: any, fromGroupId: string) {
  const { oldIndex, newIndex, from, to } = evt
  if (oldIndex === undefined || newIndex === undefined) return
  if (oldIndex === newIndex && from === to) return

  // 找到源分组
  const sourceGroup = projectStore.groupedProjects.find(g => g.id === fromGroupId)
  if (!sourceGroup) return

  const draggedProject = sourceGroup.projects[oldIndex]
  if (!draggedProject) return

  // 确定目标分组
  let toGroupId = fromGroupId
  if (from !== to) {
    // 跨组拖拽：通过DOM查找目标分组
    const groupEl = to?.closest?.('.project-group')
    if (groupEl) {
      const allGroupEls = document.querySelectorAll('.project-group')
      const groupIndex = Array.from(allGroupEls).indexOf(groupEl)
      if (groupIndex >= 0 && projectStore.groupedProjects[groupIndex]) {
        toGroupId = projectStore.groupedProjects[groupIndex].id
      }
    }
  }

  // 如果跨组移动，更新groupId
  if (fromGroupId !== toGroupId && toGroupId !== '__starred__') {
    const realGroupId = toGroupId === '__ungrouped__' ? '' : toGroupId
    await projectStore.updateProject(draggedProject.id, { groupId: realGroupId } as any)
  }

  // 获取目标分组的当前项目列表
  const targetGroup = projectStore.groupedProjects.find(g => g.id === toGroupId)
  if (targetGroup) {
    const items = [...targetGroup.projects]
    if (fromGroupId === toGroupId) {
      // 同组内重排
      const [moved] = items.splice(oldIndex, 1)
      items.splice(newIndex, 0, moved)
    } else {
      // 跨组：在目标位置插入
      items.splice(newIndex, 0, draggedProject)
    }
    // 更新目标组内项目sortOrder
    for (let i = 0; i < items.length; i++) {
      const p = projectStore.projects.find(proj => proj.id === items[i].id)
      if (p) p.sortOrder = i
    }
  }

  // 持久化全局排序
  const allOrderedIds = projectStore.projects
    .slice()
    .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
    .map(p => p.id)
  await projectStore.reorderProjects(allOrderedIds)
  sortBy.value = 'sortOrder'
}

function showContextMenu(event: { x: number; y: number; project: Project }) {
  const project = event.project
  contextMenu.targetProject = project
  contextMenu.x = event.x
  contextMenu.y = event.y

  // 如果当前项目在选中列表中，显示多选菜单
  const isMultiSelected = projectStore.isSelectionMode && projectStore.isSelected(project.id)
  const selectedCount = projectStore.selectedIds.size

  // 构建菜单项
  const items: MenuItem[] = []

  if (isMultiSelected && selectedCount > 1) {
    // 多选模式菜单
    items.push({
      label: `对选中的 ${selectedCount} 个项目操作`,
      disabled: true
    } as any)
    items.push({ type: 'separator' })

    // 移至分组
    const groupChildren: MenuChildItem[] = [
      {
        label: '未分组',
        action: () => handleBatchMoveToGroup(null)
      },
      ...projectStore.groups.map(g => ({
        label: g.name,
        action: () => handleBatchMoveToGroup(g.id)
      }))
    ]
    items.push({ label: '移至分组', children: groupChildren })

    // 批量星标
    items.push({
      label: '批量切换星标',
      action: () => handleBatchToggleStar()
    })

    items.push({ type: 'separator' })

    // 批量删除
    items.push({
      label: '批量删除',
      danger: true,
      action: () => handleBatchDelete()
    })
  } else {
    // 单个项目菜单（原有行为）
    // 移至分组 → 子菜单
    const groupChildren: MenuChildItem[] = [
      {
        label: '未分组',
        active: !project.groupId,
        action: () => moveToGroup(project.id, '')
      },
      ...projectStore.groups.map(g => ({
        label: g.name,
        active: project.groupId === g.id,
        action: () => moveToGroup(project.id, g.id)
      }))
    ]
    items.push({ label: '移至分组', children: groupChildren })

    // 用编辑器打开 → 子菜单
    const installedEditors = settingsStore.settings.editors.filter(e => e.installed)
    if (installedEditors.length > 0) {
      const editorChildren: MenuChildItem[] = installedEditors.map(e => ({
        label: e.name,
        action: () => handleOpenEditor(e.id, getProjectCodePath(project))
      }))
      items.push({ label: '用编辑器打开', children: editorChildren })
    }

    // 打开文件夹
    items.push({
      label: '打开文件夹',
      action: () => handleOpenFolder(project.path)
    })

    // 复制路径
    items.push({
      label: '复制路径',
      action: () => navigator.clipboard.writeText(project.path)
    })

    // 星标
    items.push({
      label: project.starred ? '取消星标' : '设为星标',
      action: () => handleToggleStar(project.id)
    })

    // 分隔线
    items.push({ type: 'separator' })

    // 编辑
    items.push({
      label: '编辑项目',
      action: () => handleEdit(project)
    })

    // 删除
    items.push({
      label: '删除项目',
      danger: true,
      action: () => handleDelete(project)
    })
  }

  contextMenu.items = items
  contextMenu.visible = true
}

async function moveToGroup(projectId: string, groupId: string) {
  await projectStore.updateProject(projectId, { groupId: groupId || undefined } as any)
}

// 批量操作
async function handleBatchToggleStar() {
  const ids = Array.from(projectStore.selectedIds)
  await projectStore.batchToggleStar(ids)
}

async function handleBatchMoveToGroup(groupId: string | null) {
  const ids = Array.from(projectStore.selectedIds)
  await projectStore.batchMoveToGroup(ids, groupId)
  showBatchGroupMenu.value = false
  projectStore.clearSelection()
}

function handleBatchDelete() {
  showBatchDeleteConfirm.value = true
}

async function confirmBatchDelete() {
  const ids = Array.from(projectStore.selectedIds)
  await projectStore.batchDelete(ids)
  showBatchDeleteConfirm.value = false
}

function getProjectCodePath(project: Project): string {
  if (project.codeModules && project.codeModules.length > 0) {
    return project.codeModules[0].path
  }
  return project.path
}

// 分组全选相关
function getGroupSelectionState(groupProjects: Project[]): { all: boolean; indeterminate: boolean } {
  if (groupProjects.length === 0) return { all: false, indeterminate: false }
  const selectedCount = groupProjects.filter(p => projectStore.isSelected(p.id)).length
  const all = selectedCount === groupProjects.length
  const indeterminate = selectedCount > 0 && !all
  return { all, indeterminate }
}

function toggleGroupSelect(groupProjects: Project[]) {
  const { all } = getGroupSelectionState(groupProjects)
  const newSet = new Set(projectStore.selectedIds)
  if (all) {
    // 取消全选该组
    for (const p of groupProjects) {
      newSet.delete(p.id)
    }
  } else {
    // 全选该组
    for (const p of groupProjects) {
      newSet.add(p.id)
    }
  }
  projectStore.selectedIds = newSet
}
</script>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
}

/* ============ 扫描导入对话框 ============ */
.scan-import-dialog {
  max-width: 600px;
}

.scan-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  color: var(--text-secondary);
}

.scan-results-section {
  margin-top: 12px;
}

.scan-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 8px;
}

.scan-results-header label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.scan-summary {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

.scan-candidates-list {
  max-height: 320px;
  overflow-y: auto;
}

.candidate-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.candidate-item:hover {
  background: var(--bg-hover);
}

.candidate-item.candidate-exists {
  opacity: 0.5;
  cursor: not-allowed;
}

.candidate-name {
  flex: 1;
  font-size: var(--font-sm);
  color: var(--text-primary);
}

.candidate-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.badge-exists {
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
}

.badge-code {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.badge-docs {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.scan-import-result {
  padding: 12px;
  background: rgba(16, 185, 129, 0.08);
  border-radius: var(--radius-md);
  color: #10b981;
  font-size: var(--font-sm);
  margin-top: 12px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.header-left h1 {
  font-size: var(--font-xl);
  font-weight: 600;
  color: var(--text-primary);
}

.project-count {
  font-size: var(--font-sm);
  color: var(--text-tertiary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sort-select select {
  padding: 7px 32px 7px 12px;
  font-size: var(--font-sm);
}

/* 分组列表 */
.grouped-project-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: slideUp 0.3s ease;
}

.project-group {
  border-radius: 8px;
}

/* 分组头 */
.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-hover);
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease;
}

.group-header:hover {
  background: var(--bg-active);
}

.group-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-arrow {
  transition: transform 0.2s ease;
  color: var(--text-tertiary);
}

.collapse-arrow--collapsed {
  transform: rotate(-90deg);
}

.group-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.group-count {
  font-size: 11px;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  padding: 1px 6px;
  border-radius: 10px;
}

.group-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.group-header:hover .group-header-actions {
  opacity: 1;
}

.icon-btn-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-btn-sm:hover {
  background: var(--bg-secondary);
  color: var(--color-primary);
}

.icon-btn-sm-danger:hover {
  background: var(--color-danger-light, #fde8e8);
  color: var(--color-danger);
}

/* 分组内容 */
.group-content {
  overflow: hidden;
  max-height: 5000px;
  transition: max-height 0.3s ease, opacity 0.3s ease;
  opacity: 1;
}

.group-content--collapsed {
  max-height: 0;
  opacity: 0;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 4px;
}

.group-empty {
  padding: 12px 16px;
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
}

/* 拖拽占位符样式 */
.drag-ghost {
  opacity: 0.5;
  background: var(--bg-active, #f0f4ff) !important;
  border: 1px dashed var(--color-primary, #4f8cff) !important;
  border-radius: 8px;
}

/* 拖拽中的项 */
.drag-active {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: scale(1.02);
  opacity: 0.9;
  z-index: 100;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 20px;
  color: var(--text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 20px;
  text-align: center;
}

.empty-illustration {
  margin-bottom: 8px;
}

.empty-state h3 {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--text-primary);
}

.empty-state p {
  font-size: var(--font-base);
  color: var(--text-secondary);
  margin-bottom: 8px;
}

/* 批量操作工具栏 */
.batch-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(79, 140, 255, 0.08);
  border: 1px solid rgba(79, 140, 255, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
}

.batch-toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.batch-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary, #4f8cff);
}

.batch-link-btn {
  font-size: 12px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.batch-link-btn:hover {
  color: var(--color-primary, #4f8cff);
  background: rgba(79, 140, 255, 0.1);
}

.batch-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.15s ease;
}

.batch-action-btn:hover {
  background: var(--bg-hover);
  color: var(--color-primary, #4f8cff);
  border-color: var(--color-primary, #4f8cff);
}

.batch-action-btn--danger:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
  background: var(--color-danger-light, #fde8e8);
}

.batch-group-wrapper {
  position: relative;
}

.batch-group-dropdown {
  position: relative;
}

.batch-group-menu {
  position: absolute;
  top: 100%;
  right: 0;
  padding-top: 4px;
  min-width: 140px;
  z-index: 100;
}

.batch-group-menu::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.batch-group-menu > .batch-group-menu-item:first-child {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.batch-group-menu > .batch-group-menu-item:last-child {
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.batch-group-menu {
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 4px;
}

.batch-group-menu-item {
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-primary);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.batch-group-menu-item:hover {
  background: var(--bg-hover);
}

/* 分组全选复选框 */
.group-select-checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.group-select-checkbox input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.group-select-checkbox .checkbox-visual {
  width: 16px;
  height: 16px;
  border: 2px solid var(--text-tertiary);
  border-radius: 4px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-select-checkbox input:checked + .checkbox-visual {
  background: var(--color-primary, #4f8cff);
  border-color: var(--color-primary, #4f8cff);
}

.group-select-checkbox input:checked + .checkbox-visual::after {
  content: '';
  width: 8px;
  height: 5px;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(-45deg) translateY(-1px);
}

.group-select-checkbox input:indeterminate + .checkbox-visual {
  background: var(--color-primary, #4f8cff);
  border-color: var(--color-primary, #4f8cff);
}

.group-select-checkbox input:indeterminate + .checkbox-visual::after {
  content: '';
  width: 8px;
  height: 2px;
  background: #fff;
  border-radius: 1px;
}

.group-select-checkbox:hover .checkbox-visual {
  border-color: var(--color-primary, #4f8cff);
}

/* 批量工具栏动画 */
.batch-bar-enter-active,
.batch-bar-leave-active {
  transition: all 0.25s ease;
}

.batch-bar-enter-from,
.batch-bar-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
