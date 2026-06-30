<template>
  <div class="settings-view">
    <header class="page-header">
      <h1>设置</h1>
    </header>

    <div class="settings-sections">
      <!-- 外观设置 -->
      <section class="settings-section">
        <h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          外观
        </h2>
        <div class="setting-item">
          <div class="setting-info">
            <label>主题模式</label>
            <p>选择应用的外观主题</p>
          </div>
          <div class="theme-switcher">
            <button
              v-for="option in themeOptions"
              :key="option.value"
              :class="['theme-option', { active: theme === option.value }]"
              @click="setTheme(option.value)"
            >
              <span class="theme-icon">{{ option.icon }}</span>
              <span>{{ option.label }}</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 窗口行为 -->
      <section class="settings-section">
        <h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
          窗口行为
        </h2>
        <div class="setting-item">
          <div class="setting-info">
            <label>关闭按钮行为</label>
            <p>点击窗口关闭按钮时的操作</p>
          </div>
          <div class="theme-switcher">
            <button
              v-for="option in closeActionOptions"
              :key="option.value"
              :class="['theme-option', { active: closeAction === option.value }]"
              @click="setCloseAction(option.value)"
            >
              <span>{{ option.label }}</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 快捷键 -->
      <section class="settings-section">
        <h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
          </svg>
          快捷键
        </h2>
        <div class="setting-item">
          <div class="setting-info">
            <label>全局搜索快捷键</label>
            <p>在任何位置呼出搜索窗口（按 Esc 取消录制）</p>
          </div>
          <div class="hotkey-input-group">
            <button
              :class="['hotkey-record-badge', { recording: recordingHotkey === 'hotkey' }]"
              @click="startRecordHotkey('hotkey')"
            >
              {{ recordingHotkey === 'hotkey' ? '按下组合键...' : (settingsStore.settings.hotkey || '未设置') }}
            </button>
            <button class="hotkey-manual-link" @click="openManualHotkey('hotkey')">手动输入</button>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <label>应用内搜索</label>
            <p>在应用内打开快速搜索（按 Esc 取消录制）</p>
          </div>
          <div class="hotkey-input-group">
            <button
              :class="['hotkey-record-badge', { recording: recordingHotkey === 'appHotkey' }]"
              @click="startRecordHotkey('appHotkey')"
            >
              {{ recordingHotkey === 'appHotkey' ? '按下组合键...' : (settingsStore.settings.appHotkey || '未设置') }}
            </button>
            <button class="hotkey-manual-link" @click="openManualHotkey('appHotkey')">手动输入</button>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <label>打开主窗口</label>
            <p>从任意位置打开主窗口（按 Esc 取消录制）</p>
          </div>
          <div class="hotkey-input-group">
            <button
              :class="['hotkey-record-badge', { recording: recordingHotkey === 'mainWindowHotkey' }]"
              @click="startRecordHotkey('mainWindowHotkey')"
            >
              {{ recordingHotkey === 'mainWindowHotkey' ? '按下组合键...' : (settingsStore.settings.mainWindowHotkey || '未设置') }}
            </button>
            <button class="hotkey-manual-link" @click="openManualHotkey('mainWindowHotkey')">手动输入</button>
          </div>
        </div>
      </section>

      <!-- 工作区设置 -->
      <section class="settings-section">
        <h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          工作区
        </h2>
        <div class="setting-item">
          <div class="setting-info">
            <label>默认工作区路径</label>
            <p class="setting-path">{{ settingsStore.settings.workspacePath || '未设置' }}</p>
          </div>
          <button class="btn btn-sm" @click="selectWorkspace">选择文件夹</button>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <label>工具默认工作区</label>
            <p class="setting-path">{{ settingsStore.settings.toolWorkspacePath || '未设置' }}</p>
          </div>
          <button class="btn btn-sm" @click="selectToolWorkspace">选择文件夹</button>
        </div>
        <div v-if="settingsStore.settings.workspacePath" class="setting-item">
          <div class="setting-info">
            <label>扫描并导入项目</label>
            <p>扫描工作区目录下的一级子文件夹，自动导入为项目</p>
          </div>
          <button
            class="btn btn-sm btn-primary"
            :disabled="scanning"
            @click="handleScanImport"
          >
            {{ scanning ? '扫描中...' : '扫描并导入' }}
          </button>
        </div>
        <div v-if="scanResult" class="scan-result">
          <span class="scan-result-text">
            ✅ 已导入 {{ scanResult.imported }} 个项目，跳过 {{ scanResult.skipped }} 个已存在项目
          </span>
        </div>
        <div v-if="scanError" class="scan-result scan-error">
          <span class="scan-error-text">❌ {{ scanError }}</span>
        </div>
      </section>

      <!-- 编辑器管理 -->
      <section class="settings-section">
        <h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          编辑器管理
        </h2>

        <div class="editor-section-header">
          <p class="section-desc">已检测和自定义的编辑器列表</p>
          <button
            class="btn btn-sm"
            :disabled="rescanning"
            @click="handleRescanEditors"
          >
            {{ rescanning ? '扫描中...' : '重新扫描' }}
          </button>
        </div>

        <!-- 统一编辑器列表 -->
        <div class="editor-list">
          <div
            v-for="editor in installedEditors"
            :key="editor.id"
            class="editor-item"
          >
            <div class="editor-icon-wrap">
              <span class="editor-icon-badge">{{ getEditorIconText(editor) }}</span>
            </div>
            <div class="editor-info">
              <span class="editor-name">
                {{ editor.name }}
                <span v-if="editor.custom" class="editor-tag">自定义</span>
              </span>
              <span class="editor-path">{{ editor.path || '未检测到' }}</span>
              <span class="editor-args" v-if="editor.args">参数: {{ editor.args }}</span>
            </div>
            <div class="editor-item-actions">
              <span :class="['status-badge', editor.installed ? 'status-ok' : 'status-warn']">
                {{ editor.installed ? '已安装' : '未检测到' }}
              </span>
              <span
                v-if="settingsStore.settings.defaultEditorId === editor.id"
                class="status-badge status-default"
              >
                默认
              </span>
              <button
                v-else
                class="btn btn-sm"
                @click="setDefaultEditor(editor)"
                title="设为默认编辑器"
              >
                设为默认
              </button>
              <button
                v-if="editor.installed"
                class="btn btn-sm"
                @click="openFileWithEditor(editor)"
                title="选择文件并用该编辑器打开"
              >
                打开文件
              </button>
              <button
                v-if="editor.installed"
                class="btn btn-sm"
                @click="openFolderWithEditor(editor)"
                title="选择目录并用该编辑器打开"
              >
                打开目录
              </button>
              <button class="btn btn-sm" @click="openEditDialog(editor)" title="编辑">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                v-if="editor.custom"
                class="btn btn-sm btn-danger-ghost"
                @click="deleteCustomEditor(editor)"
                title="删除"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div v-if="installedEditors.length === 0" class="editor-empty">
            <div v-if="mergedEditors.length === 0" class="spinner" style="width: 16px; height: 16px;"></div>
            <span>{{ mergedEditors.length === 0 ? '正在检测编辑器...' : '暂无已安装的编辑器' }}</span>
          </div>
        </div>

        <!-- 添加编辑器按钮 -->
        <button class="btn btn-sm btn-add-editor" @click="showEditorForm = true" v-if="!showEditorForm">
          + 添加编辑器
        </button>

        <!-- 添加编辑器表单（仅用于新增自定义编辑器） -->
        <div v-if="showEditorForm" class="editor-form">
          <h4>添加编辑器</h4>
          <div class="form-row">
            <label>名称 <span class="required">*</span></label>
            <input v-model="editorForm.name" class="input input-sm" placeholder="编辑器名称" />
          </div>
          <div class="form-row">
            <label>可执行文件路径 <span class="required">*</span></label>
            <div class="input-with-btn">
              <input v-model="editorForm.path" class="input input-sm" placeholder="选择可执行文件" readonly />
              <button class="btn btn-sm" @click="selectEditorPath">选择</button>
            </div>
          </div>
          <div class="form-row">
            <label>启动参数</label>
            <input v-model="editorForm.args" class="input input-sm" placeholder="可选，如 --new-window" />
          </div>
          <div class="form-row">
            <label>图标</label>
            <div class="icon-selector">
              <button
                v-for="preset in iconPresets"
                :key="preset.value"
                :class="['icon-preset-btn', { active: editorForm.icon === preset.value }]"
                @click="editorForm.icon = preset.value"
                :title="preset.label"
              >
                {{ preset.display }}
              </button>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-sm" @click="cancelEditorForm">取消</button>
            <button class="btn btn-sm btn-primary" @click="saveEditorForm" :disabled="!editorForm.name || !editorForm.path">
              添加
            </button>
          </div>
        </div>
      </section>

      <!-- 自动更新 -->
      <section class="settings-section">
        <h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
          </svg>
          自动更新
        </h2>
        <div class="setting-item">
          <div class="setting-info">
            <label>启用自动检查更新</label>
            <p>启动时自动检查新版本</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" :checked="settingsStore.settings.autoUpdate" @change="toggleAutoUpdate" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <label>检查更新</label>
            <p v-if="updateStatus === 'idle'">手动检查是否有新版本</p>
            <p v-else-if="updateStatus === 'checking'">正在检查更新...</p>
            <p v-else-if="updateStatus === 'available'">发现新版本 {{ updateVersion }}</p>
            <p v-else-if="updateStatus === 'latest'">已是最新版本</p>
            <p v-else-if="updateStatus === 'downloading'">下载中... {{ downloadProgress.toFixed(0) }}%</p>
            <p v-else-if="updateStatus === 'downloaded'">下载完成，可以重启安装</p>
            <p v-else-if="updateStatus === 'error'">检查更新失败: {{ updateError }}</p>
          </div>
          <div class="update-actions">
            <button
              v-if="updateStatus === 'idle' || updateStatus === 'latest' || updateStatus === 'error'"
              class="btn btn-sm btn-primary"
              @click="checkForUpdates"
            >
              立即检查更新
            </button>
            <button
              v-if="updateStatus === 'available'"
              class="btn btn-sm btn-primary"
              @click="downloadUpdate"
            >
              下载更新
            </button>
            <button
              v-if="updateStatus === 'downloaded'"
              class="btn btn-sm btn-primary"
              @click="installUpdate"
            >
              重启并安装
            </button>
          </div>
        </div>
        <div v-if="updateStatus === 'downloading'" class="update-progress-bar">
          <div class="progress-bar-track">
            <div class="progress-bar-fill" :style="{ width: downloadProgress + '%' }"></div>
          </div>
        </div>
      </section>

      <!-- 数据管理 -->
      <section class="settings-section">
        <h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
          数据管理
        </h2>
        <div class="setting-item">
          <div class="setting-info">
            <label>数据存储位置</label>
            <p class="setting-path">{{ dataPath || '加载中...' }}</p>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <label>立即备份</label>
            <p>备份所有数据文件（项目、设置、工具等）</p>
          </div>
          <button class="btn btn-sm btn-primary" @click="handleBackup">立即备份</button>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <label>恢复默认设置</label>
            <p>重置所有设置为默认值（保留编辑器列表和项目数据）</p>
          </div>
          <button class="btn btn-sm btn-danger-ghost" @click="handleResetSettings">恢复默认</button>
        </div>
        <div v-if="backups.length > 0" class="backup-list">
          <p class="backup-list-title">备份记录（最多保留5个）</p>
          <div v-for="backup in backups" :key="backup.name" class="backup-item">
            <div class="backup-info">
              <span class="backup-name">{{ backup.name }}</span>
              <span class="backup-date">{{ backup.date }}</span>
              <span class="backup-files">{{ backup.files.length }} 个文件</span>
            </div>
            <div class="backup-actions">
              <button class="btn btn-sm" @click="handleRestore(backup.name)">恢复</button>
              <button class="btn btn-sm btn-danger-ghost" @click="handleDeleteBackup(backup.name)">删除</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 关于 -->
      <section class="settings-section">
        <h2>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          关于
        </h2>
        <div class="about-info">
          <div class="about-row">
            <span class="about-label">应用名称</span>
            <span>项目管理工具</span>
          </div>
          <div class="about-row">
            <span class="about-label">版本</span>
            <span>1.0.1.260629</span>
          </div>
          <div class="about-row">
            <span class="about-label">技术栈</span>
            <span>Electron + Vue 3 + TypeScript</span>
          </div>
        </div>
      </section>
    </div>

    <!-- 编辑编辑器对话框 -->
    <div v-if="showEditDialog" class="dialog-overlay" @click.self="closeEditDialog">
      <div class="dialog" style="max-width: 480px;">
        <div class="dialog-header">
          <h2>编辑编辑器</h2>
          <button class="btn btn-ghost btn-icon" @click="closeEditDialog">✕</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>名称</label>
            <input :value="editForm.name" class="input" readonly />
          </div>
          <div class="form-group">
            <label>可执行文件路径 <span class="required">*</span></label>
            <div class="input-with-btn">
              <input v-model="editForm.path" class="input" placeholder="选择可执行文件" readonly />
              <button class="btn" @click="selectEditPath">选择</button>
            </div>
          </div>
          <div class="form-group">
            <label>启动参数</label>
            <input v-model="editForm.args" class="input" placeholder="可选，如 --new-window" />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="closeEditDialog">取消</button>
          <button class="btn btn-primary" @click="saveEditDialog" :disabled="!editForm.path">保存</button>
        </div>
      </div>
    </div>

    <!-- 手动快捷键输入对话框（用于 Alt+Space 等系统拦截的组合） -->
    <div v-if="showManualHotkeyDialog" class="dialog-overlay" @click.self="showManualHotkeyDialog = false">
      <div class="dialog" style="max-width: 380px;">
        <div class="dialog-header">
          <h2>手动输入快捷键</h2>
          <button class="btn btn-ghost btn-icon" @click="showManualHotkeyDialog = false">✕</button>
        </div>
        <div class="dialog-body">
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
            输入快捷键组合（用于录制无法捕获的系统组合键，如 Alt+Space）
          </p>
          <input v-model="manualHotkeyValue" class="input" placeholder="如 Alt+Space" @keyup.enter="confirmManualHotkey" autofocus />
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="showManualHotkeyDialog = false">取消</button>
          <button class="btn btn-primary" @click="confirmManualHotkey" :disabled="!manualHotkeyValue.trim()">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, reactive, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import type { Editor, ScanResult } from '@/types'

const settingsStore = useSettingsStore()
const theme = ref(settingsStore.settings.theme)
const mergedEditors = ref<Editor[]>([])
const installedEditors = computed(() => mergedEditors.value.filter(e => e.installed))
const scanning = ref(false)
const scanResult = ref<ScanResult | null>(null)
const scanError = ref('')
const rescanning = ref(false)

// 自动更新状态
const updateStatus = ref<'idle' | 'checking' | 'available' | 'latest' | 'downloading' | 'downloaded' | 'error'>('idle')
const updateVersion = ref('')
const updateError = ref('')
const downloadProgress = ref(0)

// 数据管理
const dataPath = ref('')
const backups = ref<Array<{ name: string; date: string; files: string[] }>>([])

// 手动快捷键输入
const showManualHotkeyDialog = ref(false)
const manualHotkeyValue = ref('')
const manualHotkeyTarget = ref<'hotkey' | 'appHotkey' | 'mainWindowHotkey' | null>(null)

// 添加编辑器表单状态
const showEditorForm = ref(false)
const editorForm = reactive({
  name: '',
  path: '',
  args: '',
  icon: 'custom'
})

// 编辑编辑器对话框状态
const showEditDialog = ref(false)
const editingEditor = ref<Editor | null>(null)
const editForm = reactive({
  name: '',
  path: '',
  args: ''
})

// 快捷键录制状态
const recordingHotkey = ref<'hotkey' | 'appHotkey' | 'mainWindowHotkey' | null>(null)

const iconPresets = [
  { value: 'vscode', label: 'VS Code', display: 'VS' },
  { value: 'idea', label: 'IntelliJ IDEA', display: 'IJ' },
  { value: 'terminal', label: '终端', display: '>' },
  { value: 'code', label: '代码', display: '</>' },
  { value: 'custom', label: '首字母', display: 'A' }
]

const themeOptions = [
  { value: 'light' as const, label: '浅色', icon: '☀️' },
  { value: 'dark' as const, label: '深色', icon: '🌙' },
  { value: 'system' as const, label: '系统', icon: '💻' }
]

const closeActionOptions = [
  { value: '', label: '询问' },
  { value: 'minimize', label: '最小化到托盘' },
  { value: 'quit', label: '直接退出' }
]
const closeAction = ref('')

onMounted(async () => {
  await settingsStore.loadSettings()
  theme.value = settingsStore.settings.theme
  closeAction.value = settingsStore.settings.closeAction || ''
  await refreshEditors()

  // 从主进程获取当前更新状态（跨页面持久化）
  try {
    const state = await window.electronAPI.getUpdateState()
    updateStatus.value = state.status as any
    updateVersion.value = state.version || ''
    updateError.value = state.error || ''
    downloadProgress.value = state.progress || 0
  } catch { /* ignore */ }

  // 监听更新状态变化（实时同步）
  window.electronAPI.onUpdateStateChanged((state) => {
    updateStatus.value = state.status as any
    updateVersion.value = state.version || ''
    updateError.value = state.error || ''
    downloadProgress.value = state.progress || 0
  })

  // 下载进度和完成事件
  window.electronAPI.onDownloadProgress((progress) => {
    downloadProgress.value = progress.percent
  })
  window.electronAPI.onUpdateDownloaded(() => {
    updateStatus.value = 'downloaded'
  })

  // 加载数据路径和备份列表
  try {
    dataPath.value = await window.electronAPI.getDataPath()
    await loadBackups()
  } catch { /* ignore */ }
})

onBeforeUnmount(() => {
  stopRecordHotkey()
})

function getEditorIconText(editor: Editor): string {
  if (editor.icon === 'vscode') return 'VS'
  if (editor.icon === 'idea') return 'IJ'
  if (editor.icon === 'terminal') return '>'
  if (editor.icon === 'code') return '</>'
  if (editor.icon === 'trae') return 'T'
  if (editor.icon === 'qoder') return 'Q'
  // custom: 显示名称首字母
  return editor.name.charAt(0).toUpperCase()
}

async function setTheme(value: 'light' | 'dark' | 'system') {
  theme.value = value
  await settingsStore.updateSettings({ theme: value })
}

async function setCloseAction(value: string) {
  closeAction.value = value
  await settingsStore.updateSettings({ closeAction: value })
}

async function selectWorkspace() {
  const path = await window.electronAPI.selectFolder()
  if (path) {
    await settingsStore.updateSettings({ workspacePath: path })
    scanResult.value = null
    scanError.value = ''
  }
}

async function selectToolWorkspace() {
  const path = await window.electronAPI.selectFolder()
  if (path) {
    await settingsStore.updateSettings({ toolWorkspacePath: path })
  }
}

async function handleScanImport() {
  const workspacePath = settingsStore.settings.workspacePath
  if (!workspacePath) return

  scanning.value = true
  scanResult.value = null
  scanError.value = ''

  try {
    const result = await window.electronAPI.scanAndImportProjects(workspacePath)
    scanResult.value = result
  } catch (error: any) {
    scanError.value = error.message || '扫描失败，请检查目录是否存在或是否有访问权限'
  } finally {
    scanning.value = false
  }
}

// ========== 编辑器管理 ==========

async function refreshEditors() {
  try {
    mergedEditors.value = await window.electronAPI.getAvailableEditors()
  } catch (e) {
    console.error('加载编辑器失败:', e)
  }
}

async function handleRescanEditors() {
  rescanning.value = true
  try {
    mergedEditors.value = await window.electronAPI.rescanEditors()
  } catch (e) {
    console.error('重新扫描失败:', e)
  } finally {
    rescanning.value = false
  }
}

async function openFileWithEditor(editor: Editor) {
  const path = await window.electronAPI.selectFile('选择要用编辑器打开的文件')
  if (!path) return
  try {
    await window.electronAPI.openInEditor(editor.id, path)
  } catch (e: any) {
    alert('打开失败: ' + (e?.message || e))
  }
}

async function openFolderWithEditor(editor: Editor) {
  const path = await window.electronAPI.selectFolder()
  if (!path) return
  try {
    await window.electronAPI.openInEditor(editor.id, path)
  } catch (e: any) {
    alert('打开失败: ' + (e?.message || e))
  }
}

async function setDefaultEditor(editor: Editor) {
  await settingsStore.updateSettings({ defaultEditorId: editor.id })
}

function openEditDialog(editor: Editor) {
  editingEditor.value = editor
  editForm.name = editor.name
  editForm.path = editor.path
  editForm.args = editor.args || ''
  showEditDialog.value = true
}

function closeEditDialog() {
  showEditDialog.value = false
  editingEditor.value = null
  editForm.name = ''
  editForm.path = ''
  editForm.args = ''
}

async function selectEditPath() {
  const path = await window.electronAPI.selectFile('选择编辑器可执行文件', [
    { name: '可执行文件', extensions: ['exe'] },
    { name: '所有文件', extensions: ['*'] }
  ])
  if (path) {
    editForm.path = path
  }
}

async function saveEditDialog() {
  const editor = editingEditor.value
  if (!editor || !editForm.path) return

  if (!editor.custom) {
    // 内置编辑器：保存到 settings.editors 数组（按 id 匹配，覆盖 path 和 args）
    const existing = settingsStore.settings.editors || []
    let updatedEditors: Editor[]
    if (existing.find(e => e.id === editor.id)) {
      updatedEditors = existing.map(e =>
        e.id === editor.id
          ? { ...e, path: editForm.path, args: editForm.args || undefined }
          : { ...e }
      )
    } else {
      updatedEditors = [
        ...existing.map(e => ({ ...e })),
        { ...editor, path: editForm.path, args: editForm.args || undefined }
      ]
    }
    await settingsStore.updateSettings({ editors: updatedEditors })
  } else {
    // 自定义编辑器：保存到 settings.customEditors 数组
    const updated = (settingsStore.settings.customEditors || []).map(e =>
      e.id === editor.id
        ? { ...e, path: editForm.path, args: editForm.args || undefined }
        : { ...e }
    )
    await settingsStore.updateSettings({ customEditors: updated })
  }

  closeEditDialog()
  await refreshEditors()
}

async function deleteCustomEditor(editor: Editor) {
  const updated = (settingsStore.settings.customEditors || []).filter(e => e.id !== editor.id)
  await settingsStore.updateSettings({ customEditors: updated.map(e => ({ ...e })) })
  await refreshEditors()
}

async function selectEditorPath() {
  const path = await window.electronAPI.selectFile('选择编辑器可执行文件', [
    { name: '可执行文件', extensions: ['exe'] },
    { name: '所有文件', extensions: ['*'] }
  ])
  if (path) {
    editorForm.path = path
    // 自动填充名称：如果名称为空，提取文件名（去掉.exe）
    if (!editorForm.name.trim()) {
      const parts = path.replace(/[\\/]+$/, '').split(/[\\/]/)
      const fileName = parts[parts.length - 1] || ''
      editorForm.name = fileName.replace(/\.exe$/i, '')
    }
  }
}

function cancelEditorForm() {
  showEditorForm.value = false
  editorForm.name = ''
  editorForm.path = ''
  editorForm.args = ''
  editorForm.icon = 'custom'
}

async function saveEditorForm() {
  if (!editorForm.name || !editorForm.path) return
  // 添加新的自定义编辑器
  const newEditor: Editor = {
    id: 'custom-' + Date.now(),
    name: editorForm.name,
    path: editorForm.path,
    args: editorForm.args || undefined,
    icon: editorForm.icon,
    installed: true,
    custom: true
  }
  const updated = [...(settingsStore.settings.customEditors || []), newEditor]
  await settingsStore.updateSettings({ customEditors: updated.map(e => ({ ...e })) })

  cancelEditorForm()
  await refreshEditors()
}

// ========== 快捷键录制 ==========

async function startRecordHotkey(key: 'hotkey' | 'appHotkey' | 'mainWindowHotkey') {
  if (recordingHotkey.value) return
  recordingHotkey.value = key
  try {
    await window.electronAPI.prepareHotkeyRecord()
  } catch (e) {
    console.warn('prepareHotkeyRecord 失败:', e)
  }
  window.addEventListener('keydown', onHotkeyKeyDown, true)
}

async function stopRecordHotkey() {
  if (!recordingHotkey.value) return
  recordingHotkey.value = null
  window.removeEventListener('keydown', onHotkeyKeyDown, true)
  try {
    await window.electronAPI.restoreHotkeyRecord()
  } catch (e) {
    console.warn('restoreHotkeyRecord 失败:', e)
  }
}

async function onHotkeyKeyDown(e: KeyboardEvent) {
  e.preventDefault()
  e.stopPropagation()
  e.returnValue = false
  // 按 Escape 取消录制
  if (e.key === 'Escape') {
    await stopRecordHotkey()
    return
  }
  // 仅按下修饰键时不结束录制
  const modifierKeys = ['Control', 'Shift', 'Alt', 'Meta']
  if (modifierKeys.includes(e.key)) return

  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.metaKey) parts.push('Cmd')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')

  let keyName = e.key
  // 兼容 Alt+Space 等场景：同时检查 e.key 和 e.code
  if (keyName === ' ' || e.code === 'Space') keyName = 'Space'
  else if (keyName.length === 1) keyName = keyName.toUpperCase()
  else if (keyName === 'ArrowUp') keyName = 'Up'
  else if (keyName === 'ArrowDown') keyName = 'Down'
  else if (keyName === 'ArrowLeft') keyName = 'Left'
  else if (keyName === 'ArrowRight') keyName = 'Right'
  parts.push(keyName)

  const combo = parts.join('+')
  const targetKey = recordingHotkey.value
  // 先移除监听和停止录制 UI 状态
  recordingHotkey.value = null
  window.removeEventListener('keydown', onHotkeyKeyDown, true)
  // 先保存新快捷键到设置
  if (targetKey) {
    await settingsStore.updateSettings({ [targetKey]: combo } as any)
  }
  // 保存完成后再恢复全局快捷键注册（此时读取的是最新设置）
  try {
    await window.electronAPI.restoreHotkeyRecord()
  } catch (e) {
    console.warn('restoreHotkeyRecord 失败:', e)
  }
}

// ========== 自动更新 ==========

async function toggleAutoUpdate() {
  const enabled = !settingsStore.settings.autoUpdate
  await settingsStore.updateSettings({ autoUpdate: enabled })
}

async function checkForUpdates() {
  updateStatus.value = 'checking'
  updateError.value = ''
  try {
    const result = await window.electronAPI.checkForUpdates()
    if (result.hasUpdate) {
      updateStatus.value = 'available'
      updateVersion.value = result.version || ''
    } else if (result.error) {
      updateStatus.value = 'error'
      updateError.value = result.error
    } else {
      updateStatus.value = 'latest'
    }
  } catch (e: any) {
    updateStatus.value = 'error'
    updateError.value = e?.message || String(e)
  }
}

async function downloadUpdate() {
  updateStatus.value = 'downloading'
  downloadProgress.value = 0
  const success = await window.electronAPI.downloadUpdate()
  if (!success) {
    updateStatus.value = 'error'
    updateError.value = '下载失败'
  }
}

async function installUpdate() {
  await window.electronAPI.installUpdate()
}

// ========== 数据备份与恢复 ==========

async function loadBackups() {
  try {
    const result = await window.electronAPI.listBackups()
    if (result.success) {
      backups.value = result.backups
    }
  } catch (e) {
    console.error('加载备份列表失败:', e)
  }
}

async function handleBackup() {
  try {
    const result = await window.electronAPI.backupData()
    if (result.success) {
      alert(`备份成功: ${result.name}`)
      await loadBackups()
    } else {
      alert('备份失败: ' + result.error)
    }
  } catch (e: any) {
    alert('备份失败: ' + (e?.message || e))
  }
}

async function handleRestore(backupName: string) {
  if (!confirm(`确定要从备份 ${backupName} 恢复数据吗？当前数据将被覆盖。`)) return
  try {
    const result = await window.electronAPI.restoreBackup(backupName)
    if (result.success) {
      alert('恢复成功，请重新加载页面')
      await settingsStore.loadSettings()
      await refreshEditors()
    } else {
      alert('恢复失败: ' + result.error)
    }
  } catch (e: any) {
    alert('恢复失败: ' + (e?.message || e))
  }
}

async function handleDeleteBackup(backupName: string) {
  if (!confirm(`确定要删除备份 ${backupName} 吗？`)) return
  try {
    const result = await window.electronAPI.deleteBackup(backupName)
    if (result.success) {
      await loadBackups()
    } else {
      alert('删除失败: ' + result.error)
    }
  } catch (e: any) {
    alert('删除失败: ' + (e?.message || e))
  }
}

// ========== 恢复默认设置 ==========

async function handleResetSettings() {
  if (!confirm('确定要恢复所有设置为默认值吗？\n（编辑器列表和项目数据不会被清除）')) return
  try {
    const defaults = await window.electronAPI.resetSettings()
    // 更新本地状态
    theme.value = defaults.theme
    closeAction.value = defaults.closeAction || ''
    await settingsStore.loadSettings()
    await refreshEditors()
    alert('已恢复默认设置')
  } catch (e: any) {
    alert('恢复失败: ' + (e?.message || e))
  }
}

// ========== 手动快捷键输入（用于 Alt+Space 等系统拦截的组合） ==========

function openManualHotkey(target: 'hotkey' | 'appHotkey' | 'mainWindowHotkey') {
  manualHotkeyTarget.value = target
  manualHotkeyValue.value = settingsStore.settings[target] || ''
  showManualHotkeyDialog.value = true
}

async function confirmManualHotkey() {
  if (!manualHotkeyTarget.value || !manualHotkeyValue.value.trim()) {
    showManualHotkeyDialog.value = false
    return
  }
  const combo = manualHotkeyValue.value.trim()
  const target = manualHotkeyTarget.value
  showManualHotkeyDialog.value = false
  manualHotkeyTarget.value = null
  manualHotkeyValue.value = ''
  // 保存并重新注册快捷键
  await settingsStore.updateSettings({ [target]: combo } as any)
  try {
    await window.electronAPI.restoreHotkeyRecord()
  } catch (e) {
    console.warn('restoreHotkeyRecord 失败:', e)
  }
}
</script>

<style scoped>
.settings-view {
  max-width: 700px;
  margin: 0 auto;
}

.page-header h1 {
  font-size: var(--font-xl);
  font-weight: 600;
  margin-bottom: 28px;
  color: var(--text-primary);
}

.settings-section {
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.settings-section:last-child {
  border-bottom: none;
}

.settings-section h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-md);
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.settings-section h2 svg {
  color: var(--text-secondary);
}

.section-desc {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-bottom: 12px;
  margin-top: -4px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.setting-info label {
  font-size: var(--font-base);
  font-weight: 500;
  color: var(--text-primary);
  display: block;
}

.setting-info p {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-top: 2px;
}

.setting-path {
  font-family: monospace;
  font-size: var(--font-sm) !important;
}

.theme-switcher {
  display: flex;
  gap: 4px;
  background: var(--bg-tertiary);
  padding: 3px;
  border-radius: var(--radius-md);
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.theme-option:hover {
  color: var(--text-primary);
}

.theme-option.active {
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
  font-weight: 500;
}

.theme-icon {
  font-size: 14px;
}

.hotkey-badge {
  padding: 4px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  font-family: monospace;
  color: var(--text-primary);
}

.hotkey-record-badge {
  padding: 6px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  font-family: monospace;
  color: var(--text-primary);
  cursor: pointer;
  min-width: 120px;
  text-align: center;
  transition: all var(--transition-fast);
}

.hotkey-record-badge:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.hotkey-record-badge.recording {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 编辑器管理样式 */
.editor-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.editor-section-header .section-desc {
  margin: 0;
}

.editor-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.editor-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.editor-icon-wrap {
  flex-shrink: 0;
}

.editor-icon-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
}

.editor-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.editor-name {
  font-size: var(--font-base);
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.editor-tag {
  font-size: var(--font-xs);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-weight: 400;
}

.editor-path {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-args {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  font-style: italic;
}

.editor-item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.status-badge {
  font-size: var(--font-xs);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.status-ok {
  background: var(--color-success-light);
  color: var(--color-success);
}

.status-warn {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.status-default {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.editor-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: var(--text-secondary);
  font-size: var(--font-sm);
}

.editor-empty-hint {
  font-size: var(--font-sm);
  color: var(--text-tertiary);
  padding: 12px 0;
}

.btn-add-editor {
  color: var(--color-primary);
  border: 1px dashed var(--border-color);
  background: transparent;
  width: 100%;
  padding: 8px;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.2s;
  margin-top: 8px;
}

.btn-add-editor:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.btn-danger-ghost {
  color: var(--color-danger);
}

.btn-danger-ghost:hover {
  background: var(--color-danger-light, rgba(239, 68, 68, 0.1));
}

/* 编辑器表单 */
.editor-form {
  margin-top: 12px;
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.editor-form h4 {
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.form-row {
  margin-bottom: 12px;
}

.form-row label {
  display: block;
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.form-row .required {
  color: var(--color-danger);
}

.form-row .input {
  width: 100%;
}

.input-with-btn {
  display: flex;
  gap: 8px;
}

.input-with-btn .input {
  flex: 1;
}

.icon-selector {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.icon-preset-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.icon-preset-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.icon-preset-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 14px;
}

.about-info {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.about-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-size: var(--font-sm);
}

.about-row:not(:last-child) {
  border-bottom: 1px solid var(--border-color);
}

.about-label {
  color: var(--text-secondary);
}

.scan-result {
  padding: 10px 14px;
  background: var(--color-success-light);
  border-radius: var(--radius-md);
  margin-top: 8px;
}

.scan-result-text {
  font-size: var(--font-sm);
  color: var(--color-success);
}

.scan-error {
  background: var(--color-danger-light, rgba(239, 68, 68, 0.1));
}

.scan-error-text {
  font-size: var(--font-sm);
  color: var(--color-danger);
}

/* 自动更新 - 开关样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 22px;
  transition: all var(--transition-fast);
}

.toggle-slider::before {
  content: '';
  position: absolute;
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background: var(--text-secondary);
  border-radius: 50%;
  transition: all var(--transition-fast);
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(18px);
  background: #fff;
}

/* 自动更新 - 进度条样式 */
.update-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.update-progress-bar {
  margin-top: 8px;
}

.progress-bar-track {
  width: 100%;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 0.2s ease;
}

/* 快捷键输入组 */
.hotkey-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hotkey-manual-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: var(--font-xs);
  cursor: pointer;
  text-decoration: underline;
  padding: 2px 4px;
  white-space: nowrap;
}

.hotkey-manual-link:hover {
  color: var(--color-primary);
}

/* 数据备份列表 */
.backup-list {
  margin-top: 12px;
}

.backup-list-title {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  margin-bottom: 6px;
}

.backup-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.backup-name {
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--text-primary);
  font-family: monospace;
}

.backup-date {
  font-size: var(--font-xs);
  color: var(--text-secondary);
}

.backup-files {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

.backup-actions {
  display: flex;
  gap: 6px;
}
</style>
