<template>
  <div class="tools-view" :class="'view-' + viewMode">
    <header class="page-header">
      <div class="header-left">
        <h1>工具管理</h1>
        <span class="tool-count" v-if="!loading">
          {{ tools.length }} 个工具
        </span>
      </div>
      <div class="header-actions">
        <!-- 管理模式才显示操作按钮 -->
        <template v-if="viewMode === 'manage'">
          <label class="select-all-label">
            <input
              type="checkbox"
              :checked="tools.length > 0 && selectedToolIds.size === tools.length"
              @change="toggleSelectAll"
            />
          全选
          </label>
          <button class="btn btn-danger-ghost" @click="batchDeleteTools" :disabled="selectedToolIds.size === 0" title="删除选中">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            删除选中 ({{ selectedToolIds.size }})
          </button>
          <button class="btn btn-ghost" @click="showScanDialog = true" title="扫描导入">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            扫描导入
          </button>
          <button class="btn btn-primary" @click="showAddDialog">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            添加工具
          </button>
        </template>
        <!-- 视图切换放最右侧：面板在前，管理在后 -->
        <div class="view-switcher">
          <button
            :class="['view-option', { active: viewMode === 'display' }]"
            @click="switchToDisplay"
            title="面板模式"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            面板
          </button>
          <button
            :class="['view-option', { active: viewMode === 'manage' }]"
            @click="viewMode = 'manage'"
            title="管理模式"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            管理
          </button>
        </div>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="tools.length === 0" class="empty-state">
      <div class="empty-illustration">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
      <h3>还没有工具</h3>
      <p>添加本地免安装工具或目录，方便快速启动</p>
      <button class="btn btn-primary" @click="showAddDialog">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        添加工具
      </button>
    </div>

    <!-- ============ 管理模式：工具列表 ============ -->
    <div v-else-if="viewMode === 'manage'" class="tools-list">
      <div
        v-for="tool in tools"
        :key="tool.id"
        class="tool-card"
      >
        <div class="tool-select">
          <input
            type="checkbox"
            :checked="selectedToolIds.has(tool.id)"
            @change="toggleSelectTool(tool.id)"
          />
        </div>
        <div class="tool-icon-wrap">
          <span class="tool-icon-badge" :style="{ background: tool.color || '#4f8cff' }">
            <img v-if="tool.iconPath" :src="toFileUrl(tool.iconPath)" class="badge-icon-img" @error="onIconError(tool)" />
            <svg v-else-if="tool.type === 'directory'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <svg v-else-if="tool.type === 'command'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="4,17 10,11 4,5"/><line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
            <span v-else class="badge-icon-text">{{ getToolIconText(tool) }}</span>
          </span>
        </div>
        <div class="tool-info">
          <h3 class="tool-name">{{ tool.name }}</h3>
          <span class="tool-path" :title="tool.path">{{ tool.path }}</span>
          <span class="tool-desc" v-if="tool.description">{{ tool.description }}</span>
          <div class="tool-meta-row">
            <span class="tool-type-badge" :class="'type-' + tool.type">
              {{ getTypeLabel(tool.type) }}
            </span>
            <span class="tool-workdir" v-if="tool.workDir" :title="'工作区: ' + tool.workDir">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              {{ tool.workDir }}
            </span>
          </div>
          <div class="tool-tags-row" v-if="tool.tags && tool.tags.length > 0">
            <span class="tool-tag" v-for="(tag, idx) in tool.tags" :key="idx">{{ tag }}</span>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn btn-sm btn-primary" @click="openTool(tool.id)" title="打开">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            打开
          </button>
          <button class="btn btn-sm" @click="editTool(tool)" title="编辑">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn btn-sm" @click="openToolDirectory(tool)" title="打开所在目录" v-if="tool.type !== 'command'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button class="btn btn-sm btn-danger-ghost" @click="deleteTool(tool.id)" title="删除">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ============ 展示模式：小方块网格 ============ -->
    <div v-else class="tools-grid">
      <div
        v-for="tool in tools"
        :key="tool.id"
        class="tool-block"
        :title="getTooltip(tool)"
        @click="openTool(tool.id)"
      >
        <div class="block-icon" :style="{ background: tool.color || '#4f8cff' }">
          <!-- 有图标文件：显示图片 -->
          <img v-if="tool.iconPath" :src="toFileUrl(tool.iconPath)" class="block-icon-img" @error="onIconError(tool)" />
          <!-- 无图标：显示首字母或类型图标 -->
          <template v-else>
            <svg v-if="tool.type === 'directory'" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <svg v-else-if="tool.type === 'command'" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="4,17 10,11 4,5"/><line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
            <span v-else class="block-icon-text">{{ getToolIconText(tool) }}</span>
          </template>
        </div>
        <span class="block-name">{{ tool.name }}</span>
        <span class="block-type-indicator" :class="'indicator-' + tool.type"></span>
      </div>
    </div>

    <!-- 添加/编辑工具对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h2>{{ isEditing ? '编辑工具' : '添加工具' }}</h2>
          <button class="btn btn-ghost btn-icon" @click="closeDialog">✕</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>工具名称 <span class="required">*</span></label>
            <input
              v-model="form.name"
              class="input"
              placeholder="输入工具名称"
            />
          </div>

          <div class="form-group">
            <label>类型</label>
            <div class="type-switcher">
              <button
                :class="['type-option', { active: form.type === 'executable' }]"
                @click="form.type = 'executable'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                可执行文件
              </button>
              <button
                :class="['type-option', { active: form.type === 'directory' }]"
                @click="form.type = 'directory'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                目录
              </button>
              <button
                :class="['type-option', { active: form.type === 'command' }]"
                @click="form.type = 'command'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="4,17 10,11 4,5"/><line x1="12" y1="19" x2="20" y2="19"/>
                </svg>
                命令
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>图标</label>
            <div class="icon-picker">
              <div class="icon-preview" v-if="form.iconPath">
                <img :src="toFileUrl(form.iconPath)" class="icon-preview-img" />
              </div>
              <div class="icon-preview icon-preview-letter" v-else-if="form.icon">
                <span>{{ form.icon.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="icon-preview icon-preview-placeholder" v-else>
                <span>无</span>
              </div>
              <input v-model="form.icon" class="input icon-letter-input" placeholder="字母" maxlength="2" />
              <button class="btn" @click="selectIcon">选择图标</button>
              <button class="btn btn-ghost" @click="clearIcon" v-if="form.iconPath || form.icon">清除</button>
            </div>
            <p class="text-muted text-sm" style="margin-top: 4px;">输入1-2个字母作为图标，或选择图标文件</p>
          </div>

          <div class="form-group">
            <label>{{ getPathLabel() }} <span class="required">*</span></label>
            <div class="input-with-btn" v-if="form.type !== 'command'">
              <input
                v-model="form.path"
                class="input"
                :placeholder="getPathPlaceholder()"
                readonly
              />
              <button class="btn" @click="selectPath">选择</button>
            </div>
            <input
              v-else
              v-model="form.path"
              class="input"
              placeholder="如: npm run dev, python script.py"
            />
          </div>

          <div class="form-group" v-if="form.type === 'executable' || form.type === 'command'">
            <label>启动参数</label>
            <input
              v-model="form.args"
              class="input"
              placeholder="可选，如 --port 8080"
            />
          </div>

          <div class="form-group" v-if="form.type !== 'directory'">
            <label>默认工作区</label>
            <div class="input-with-btn" v-if="form.type === 'executable'">
              <input
                v-model="form.workDir"
                class="input"
                placeholder="可选，工具启动时的工作目录"
                readonly
              />
              <button class="btn" @click="selectWorkDir">选择</button>
            </div>
            <input
              v-else
              v-model="form.workDir"
              class="input"
              placeholder="可选，命令执行时的工作目录"
            />
          </div>

          <div class="form-group">
            <label>描述</label>
            <input
              v-model="form.description"
              class="input"
              placeholder="可选，工具用途说明"
            />
          </div>

          <div class="form-group">
            <label>标签</label>
            <div class="tags-input">
              <div class="tags-list">
                <span class="tag-item" v-for="(tag, index) in form.tags" :key="index">
                  {{ tag }}
                  <button class="tag-remove" @click="removeTag(index)">✕</button>
                </span>
              </div>
              <input
                v-model="tagInput"
                class="input"
                placeholder="输入标签后按回车添加"
                @keydown.enter.prevent="addTag"
              />
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="closeDialog">取消</button>
          <button class="btn btn-primary" @click="saveTool" :disabled="!form.name || !form.path">
            {{ isEditing ? '保存' : '添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 扫描导入对话框 -->
    <div v-if="showScanDialog" class="dialog-overlay" @click.self="showScanDialog = false">
      <div class="dialog" style="max-width: 480px;">
        <div class="dialog-header">
          <h2>扫描导入工具</h2>
          <button class="btn btn-ghost btn-icon" @click="showScanDialog = false">✕</button>
        </div>
        <div class="dialog-body">
          <p class="text-muted text-sm" style="margin-bottom: 12px;">选择一个目录，自动扫描其中的可执行文件和子目录作为工具导入。</p>
          <div class="form-group">
            <label>扫描目录</label>
            <div class="input-with-btn">
              <input
                v-model="scanPath"
                class="input"
                placeholder="选择要扫描的目录"
                readonly
              />
              <button class="btn" @click="selectScanPath">选择</button>
            </div>
          </div>
          <div v-if="scanResult" class="scan-result">
            <span v-if="scanResult.imported > 0" class="scan-success">
              成功导入 {{ scanResult.imported }} 个工具
            </span>
            <span v-if="scanResult.skipped > 0" class="scan-skip">
              跳过 {{ scanResult.skipped }} 个已存在项
            </span>
            <span v-if="scanResult.imported === 0 && scanResult.skipped === 0" class="scan-empty">
              未发现可导入的工具
            </span>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="showScanDialog = false">关闭</button>
          <button class="btn btn-primary" @click="doScan" :disabled="!scanPath" v-if="!scanResult">
            开始扫描
          </button>
          <button class="btn btn-primary" @click="resetScan" v-else>
            继续扫描
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认 -->
    <div v-if="deletingToolId" class="dialog-overlay" @click.self="deletingToolId = null">
      <div class="dialog" style="max-width: 400px;">
        <div class="dialog-header">
          <h2>确认删除</h2>
        </div>
        <div class="dialog-body">
          <p>确定要删除此工具吗？</p>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="deletingToolId = null">取消</button>
          <button class="btn btn-danger" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>

    <!-- 批量删除确认 -->
    <div v-if="batchDeleting" class="dialog-overlay" @click.self="batchDeleting = false">
      <div class="dialog" style="max-width: 400px;">
        <div class="dialog-header">
          <h2>确认批量删除</h2>
        </div>
        <div class="dialog-body">
          <p>确定要删除选中的 {{ selectedToolIds.size }} 个工具吗？</p>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="batchDeleting = false">取消</button>
          <button class="btn btn-danger" @click="confirmBatchDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { ToolItem } from '@/types'

const tools = ref<ToolItem[]>([])
const loading = ref(false)
const showDialog = ref(false)
const isEditing = ref(false)
const editingToolId = ref<string | null>(null)
const deletingToolId = ref<string | null>(null)

// 视图模式：manage=管理列表，display=面板网格（默认面板）
const viewMode = ref<'manage' | 'display'>('display')
const selectedToolIds = ref<Set<string>>(new Set())
const batchDeleting = ref(false)

// 扫描相关
const showScanDialog = ref(false)
const scanPath = ref('')
const scanResult = ref<{ imported: number; skipped: number } | null>(null)

const form = reactive({
  name: '',
  type: 'executable' as 'executable' | 'directory' | 'command',
  path: '',
  args: '',
  workDir: '',
  description: '',
  icon: '',
  iconPath: '',
  tags: [] as string[]
})
const tagInput = ref('')

onMounted(async () => {
  await loadTools()
})

async function loadTools() {
  loading.value = true
  try {
    tools.value = await window.electronAPI.getTools()
  } catch (e) {
    console.error('加载工具列表失败:', e)
  } finally {
    loading.value = false
  }
}

function getToolIconText(tool: ToolItem): string {
  if (tool.icon) return tool.icon.charAt(0).toUpperCase()
  if (tool.type === 'directory') return 'D'
  if (tool.type === 'command') return '>'
  return tool.name.charAt(0).toUpperCase()
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    executable: '可执行文件',
    directory: '目录',
    command: '命令'
  }
  return labels[type] || type
}

function getPathLabel(): string {
  if (form.type === 'executable') return '可执行文件路径'
  if (form.type === 'directory') return '目录路径'
  return '命令'
}

function getPathPlaceholder(): string {
  if (form.type === 'executable') return '选择可执行文件'
  return '选择目录'
}

function showAddDialog() {
  isEditing.value = false
  editingToolId.value = null
  form.name = ''
  form.type = 'executable'
  form.path = ''
  form.args = ''
  form.workDir = ''
  form.description = ''
  form.icon = ''
  form.iconPath = ''
  form.tags = []
  tagInput.value = ''
  showDialog.value = true
}

function editTool(tool: ToolItem) {
  isEditing.value = true
  editingToolId.value = tool.id
  form.name = tool.name
  form.type = tool.type
  form.path = tool.path
  form.args = tool.args || ''
  form.workDir = tool.workDir || ''
  form.description = tool.description || ''
  form.icon = tool.icon || ''
  form.iconPath = tool.iconPath || ''
  form.tags = [...(tool.tags || [])]
  tagInput.value = ''
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingToolId.value = null
}

async function selectPath() {
  if (form.type === 'directory') {
    const path = await window.electronAPI.selectFolder()
    if (path) {
      form.path = path
      if (!form.name.trim()) {
        const parts = path.replace(/[\\/]+$/, '').split(/[\\/]/)
        form.name = parts[parts.length - 1] || ''
      }
    }
  } else {
    const path = await window.electronAPI.selectFile('选择可执行文件', [
      { name: '可执行文件', extensions: ['exe', 'bat', 'cmd', 'ps1'] },
      { name: '所有文件', extensions: ['*'] }
    ])
    if (path) {
      form.path = path
      if (!form.name.trim()) {
        const parts = path.replace(/[\\/]+$/, '').split(/[\\/]/)
        const fileName = parts[parts.length - 1] || ''
        form.name = fileName.replace(/\.exe$/i, '')
      }
    }
  }
}

async function selectWorkDir() {
  const path = await window.electronAPI.selectFolder()
  if (path) {
    form.workDir = path
  }
}

async function selectIcon() {
  const path = await window.electronAPI.selectFile('选择图标', [
    { name: '图片', extensions: ['ico', 'png', 'svg', 'jpg', 'bmp'] }
  ])
  if (path) {
    form.iconPath = path
  }
}

function clearIcon() {
  form.icon = ''
  form.iconPath = ''
}

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
  }
  tagInput.value = ''
}

function removeTag(index: number) {
  form.tags.splice(index, 1)
}

async function saveTool() {
  if (!form.name || !form.path) return

  const data: any = {
    name: form.name,
    type: form.type,
    path: form.path,
    args: form.args || undefined,
    workDir: form.workDir || undefined,
    description: form.description || undefined,
    icon: form.icon || undefined,
    iconPath: form.iconPath || undefined,
    tags: [...form.tags]
  }

  if (isEditing.value && editingToolId.value) {
    await window.electronAPI.updateTool(editingToolId.value, data)
  } else {
    await window.electronAPI.addTool({
      ...data,
      sortOrder: tools.value.length
    })
  }

  closeDialog()
  await loadTools()
}

function deleteTool(id: string) {
  deletingToolId.value = id
}

async function confirmDelete() {
  if (!deletingToolId.value) return
  await window.electronAPI.deleteTool(deletingToolId.value)
  deletingToolId.value = null
  await loadTools()
}

/** 切换工具选中状态 */
function toggleSelectTool(id: string) {
  const newSet = new Set(selectedToolIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  selectedToolIds.value = newSet
}

/** 全选/取消全选 */
function toggleSelectAll() {
  if (tools.value.length > 0 && selectedToolIds.value.size === tools.value.length) {
    selectedToolIds.value = new Set()
  } else {
    selectedToolIds.value = new Set(tools.value.map(t => t.id))
  }
}

/** 批量删除：打开确认对话框 */
function batchDeleteTools() {
  if (selectedToolIds.value.size === 0) return
  batchDeleting.value = true
}

/** 确认批量删除 */
async function confirmBatchDelete() {
  for (const id of selectedToolIds.value) {
    try {
      await window.electronAPI.deleteTool(id)
    } catch (e) {
      console.error('删除工具失败:', id, e)
    }
  }
  selectedToolIds.value = new Set()
  batchDeleting.value = false
  await loadTools()
}

async function openTool(id: string) {
  try {
    await window.electronAPI.openTool(id)
  } catch (e) {
    console.error('打开工具失败:', e)
  }
}

async function openToolDirectory(tool: ToolItem) {
  try {
    if (tool.type === 'directory') {
      await window.electronAPI.openFolder(tool.path)
    } else if (tool.type === 'executable') {
      // 打开可执行文件所在目录
      const dir = tool.path.replace(/[\\/][^\\/]+$/, '')
      if (dir) {
        await window.electronAPI.openFolder(dir)
      }
    }
  } catch (e) {
    console.error('打开所在目录失败:', e)
  }
}

/** 切换到展示模式 */
function switchToDisplay() {
  viewMode.value = 'display'
}

/** 图标加载失败时清除 iconPath，回退到文字图标 */
function onIconError(tool: ToolItem) {
  tool.iconPath = undefined
}

/** 展示模式 tooltip */
function getTooltip(tool: ToolItem): string {
  const parts = [tool.name, getTypeLabel(tool.type)]
  if (tool.description) parts.push(tool.description)
  if (tool.tags && tool.tags.length > 0) parts.push('标签: ' + tool.tags.join(', '))
  return parts.join('\n')
}

/** 将 Windows 路径转换为 file:// URL */
function toFileUrl(path: string): string {
  // 将反斜杠转为正斜杠，并确保 file:// 格式正确
  const normalized = path.replace(/\\/g, '/')
  return 'file:///' + normalized.replace(/^\/+/, '')
}

// 扫描相关
async function selectScanPath() {
  const path = await window.electronAPI.selectFolder()
  if (path) {
    scanPath.value = path
    scanResult.value = null
  }
}

async function doScan() {
  if (!scanPath.value) return
  try {
    scanResult.value = await window.electronAPI.scanAndImportTools(scanPath.value)
    await loadTools()
  } catch (e) {
    console.error('扫描失败:', e)
  }
}

function resetScan() {
  scanPath.value = ''
  scanResult.value = null
}
</script>

<style scoped>
.tools-view {
  max-width: 900px;
  margin: 0 auto;
}

/* 展示模式使用更宽的布局 */
.tools-view.view-display {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

/* 视图切换器 */
.view-switcher {
  display: flex;
  gap: 2px;
  background: var(--bg-tertiary);
  padding: 3px;
  border-radius: var(--radius-md);
}

.view-option {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.view-option:hover {
  color: var(--text-primary);
}

.view-option.active {
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
  font-weight: 500;
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

.tool-count {
  font-size: var(--font-sm);
  color: var(--text-tertiary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 20px;
  color: var(--text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
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

/* 工具列表 */
.tools-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: slideUp 0.3s ease;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: all 0.15s ease;
}

.tool-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.tool-icon-wrap {
  flex-shrink: 0;
}

.tool-icon-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
}

.tool-icon-badge svg {
  color: #fff;
  opacity: 0.9;
}

.badge-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-icon-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.tool-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tool-name {
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--text-primary);
}

.tool-path {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tool-desc {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.tool-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.tool-type-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 1px 8px;
  font-size: var(--font-xs);
  font-weight: 500;
  border-radius: var(--radius-full);
}

.type-executable {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.type-directory {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.type-command {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.tool-workdir {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.tool-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.tool-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 500;
}

.tool-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.btn-danger-ghost {
  color: var(--color-danger);
}

.btn-danger-ghost:hover {
  background: var(--color-danger-light, rgba(239, 68, 68, 0.1));
}

/* 类型切换 */
.type-switcher {
  display: flex;
  gap: 4px;
  background: var(--bg-tertiary);
  padding: 3px;
  border-radius: var(--radius-md);
}

.type-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.type-option:hover {
  color: var(--text-primary);
}

.type-option.active {
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
  font-weight: 500;
}

.required {
  color: var(--color-danger);
}

.input-with-btn {
  display: flex;
  gap: 8px;
}

.input-with-btn .input {
  flex: 1;
}

/* 标签输入 */
.tags-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  font-size: var(--font-sm);
}

.tag-remove {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 10px;
  cursor: pointer;
  padding: 0 2px;
  opacity: 0.7;
}

.tag-remove:hover {
  opacity: 1;
}

/* 扫描结果 */
.scan-result {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  font-size: var(--font-sm);
}

.scan-success {
  color: #10b981;
}

.scan-skip {
  color: var(--color-warning);
}

.scan-empty {
  color: var(--text-tertiary);
}

/* ============ 展示模式：网格布局 ============ */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  animation: slideUp 0.3s ease;
}

.tool-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 10px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.tool-block:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.tool-block:active {
  transform: translateY(0);
}

.block-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.block-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.block-icon-text {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.block-icon svg {
  color: #fff;
  opacity: 0.9;
}

.block-name {
  font-size: var(--font-xs);
  color: var(--text-primary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  font-weight: 500;
}

/* 类型指示器（右下角小圆点） */
.block-type-indicator {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.indicator-executable {
  background: #4f8cff;
}

.indicator-directory {
  background: #f59e0b;
}

.indicator-command {
  background: #10b981;
}

/* 全选标签 */
.select-all-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}

.select-all-label input {
  cursor: pointer;
}

/* 工具选择复选框 */
.tool-select {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.tool-select input {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

/* 图标选择器 */
.icon-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-preview {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--border-color);
}

.icon-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon-preview-placeholder {
  color: var(--text-tertiary);
  font-size: var(--font-sm);
}

.icon-preview-letter {
  background: var(--color-primary);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.icon-letter-input {
  width: 64px;
  flex-shrink: 0;
  text-align: center;
  text-transform: uppercase;
}
</style>
