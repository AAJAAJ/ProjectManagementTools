<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog">
      <div class="dialog-header">
        <h2>{{ isEdit ? '编辑项目' : '新建项目' }}</h2>
        <button class="btn btn-ghost btn-icon" @click="$emit('close')">✕</button>
      </div>
      <div class="dialog-body">
        <div class="form-group">
          <label>项目名称 <span class="required">*</span></label>
          <input
            v-model="form.name"
            class="input"
            placeholder="输入项目名称"
            @keydown.enter="handleSubmit"
          />
          <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label>项目描述</label>
          <textarea
            v-model="form.description"
            class="input"
            placeholder="简短描述项目用途"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label>项目根目录 <span class="required">*</span></label>
          <div class="input-with-btn">
            <input
              v-model="form.path"
              class="input"
              placeholder="选择项目根目录"
              readonly
            />
            <button class="btn" @click="selectRootPath">选择</button>
            <button class="btn btn-copy-path" @click="copyPath" :disabled="!form.path" :title="copied ? '已复制' : '复制路径'">
              <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>
          <span v-if="errors.path" class="error-text">{{ errors.path }}</span>
        </div>

        <!-- 代码模块列表 -->
        <div class="form-group">
          <label>代码模块</label>
          <div class="code-modules-list">
            <div class="module-item" v-for="(mod, index) in form.codeModules" :key="index">
              <input
                v-model="mod.label"
                class="module-label-input"
                placeholder="模块名称"
                @click.stop
              />
              <span class="module-path" :title="mod.path">{{ mod.path }}</span>
              <button class="btn btn-sm btn-change-path" @click="changeModulePath(index)" title="修改路径">修改</button>
              <select
                class="module-editor-select"
                :value="mod.editorId || ''"
                @change="setModuleEditor(index, ($event.target as HTMLSelectElement).value)"
                @click.stop
              >
                <option value="">{{ defaultEditorLabel }}</option>
                <option v-for="editor in editors" :key="editor.id" :value="editor.id">
                  {{ editor.name }}
                </option>
              </select>
              <button
                class="pin-btn-sm"
                :class="{ 'pin-btn-sm--active': mod.pinned }"
                :title="mod.pinned ? '取消置顶' : '置顶'"
                @click="toggleModulePin(index)"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" :fill="mod.pinned ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
              <button class="btn-remove" @click="removeModule(index)" title="删除模块">✕</button>
            </div>
          </div>
          <div v-if="showAddModule" class="add-module-form">
            <div class="add-module-row">
              <input
                v-model="newModule.label"
                class="input input-sm"
                placeholder="默认：后端"
                style="width: 120px; flex-shrink: 0;"
              />
              <div class="input-with-btn" style="flex: 1;">
                <input
                  v-model="newModule.path"
                  class="input input-sm"
                  placeholder="选择代码目录"
                  readonly
                />
                <button class="btn btn-sm" @click="selectModulePath">选择</button>
              </div>
              <button class="btn btn-sm btn-primary" @click="confirmAddModule" :disabled="!newModule.path">确认</button>
              <button class="btn btn-sm" @click="cancelAddModule">取消</button>
            </div>
          </div>
          <button v-if="!showAddModule" class="btn btn-sm btn-add-module" @click="showAddModule = true">
            + 添加代码模块
          </button>
          <button v-if="!showAddModule" class="btn btn-sm btn-scan-module" @click="autoScanModules" :disabled="scanning">
            {{ scanning ? '扫描中...' : '🔍 自动扫描代码' }}
          </button>
        </div>

        <div class="form-group">
          <label>文档目录</label>
          <div class="input-with-btn">
            <input
              v-model="form.docsPath"
              class="input"
              placeholder="可选，文档位置"
              readonly
            />
            <button class="btn" @click="selectDocsPath">选择</button>
          </div>
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

        <div class="form-group">
          <label>所属分组</label>
          <select v-model="form.groupId" class="input">
            <option value="">未分组</option>
            <option v-for="group in projectStore.groups" :key="group.id" :value="group.id">
              {{ group.name }}
            </option>
          </select>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSubmit" :disabled="submitting">
          {{ submitting ? '保存中...' : (isEdit ? '保存' : '创建') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import type { Project, ProjectInput, CodeModule, Editor } from '@/types'
import { useSettingsStore } from '@/stores/settings'
import { useProjectStore } from '@/stores/project'

const props = defineProps<{
  project?: Project | null
}>()

const emit = defineEmits<{
  close: []
  submit: [data: ProjectInput]
}>()

const isEdit = !!props.project
const settingsStore = useSettingsStore()
const projectStore = useProjectStore()
const editors = ref<Editor[]>([])

/** 默认编辑器显示文本（含默认编辑器名称） */
const defaultEditorLabel = computed(() => {
  const id = settingsStore.settings.defaultEditorId
  if (!id) return '默认编辑器'
  const found = editors.value.find(e => e.id === id)
  return found ? `默认编辑器 (${found.name})` : '默认编辑器'
})

const form = reactive({
  name: '',
  description: '',
  path: '',
  codeModules: [] as CodeModule[],
  docsPath: '',
  tags: [] as string[],
  groupId: '' as string
})

const errors = reactive({
  name: '',
  path: ''
})

const tagInput = ref('')
const submitting = ref(false)
const showAddModule = ref(false)
const scanning = ref(false)
const copied = ref(false)
const newModule = reactive({
  label: '',
  path: ''
})

onMounted(async () => {
  if (props.project) {
    form.name = props.project.name
    form.description = props.project.description
    form.path = props.project.path
    form.codeModules = props.project.codeModules ? [...props.project.codeModules.map(m => ({ ...m }))] : []
    form.docsPath = props.project.docs || ''
    form.tags = [...props.project.tags]
    form.groupId = props.project.groupId || ''
  } else {
    // 新建模式：自动填入工作区路径作为默认根目录
    if (settingsStore.settings.workspacePath) {
      form.path = settingsStore.settings.workspacePath
    }
  }
  // 加载可用编辑器列表
  try {
    const all = await window.electronAPI.getAvailableEditors()
    editors.value = all.filter(e => e.installed)
  } catch (e) {
    console.error('加载编辑器列表失败:', e)
  }
})

async function selectRootPath() {
  const path = await window.electronAPI.selectFolder()
  if (!path) return
  form.path = path
  // 自动填充项目名称：如果名称字段为空，提取文件夹名
  if (!form.name.trim()) {
    const parts = path.replace(/[\\/]+$/, '').split(/[\\/]/)
    form.name = parts[parts.length - 1] || ''
  }
}

async function copyPath() {
  if (!form.path) return
  try {
    await navigator.clipboard.writeText(form.path)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch (e) {
    console.error('复制失败:', e)
  }
}

async function selectDocsPath() {
  const path = await window.electronAPI.selectFolder()
  if (path) form.docsPath = path
}

async function selectModulePath() {
  const path = await window.electronAPI.selectFolder()
  if (path) newModule.path = path
}

/** 修改已添加代码模块的路径 */
async function changeModulePath(index: number) {
  const path = await window.electronAPI.selectFolder()
  if (path) form.codeModules[index].path = path
}

function confirmAddModule() {
  if (!newModule.path) return
  const label = newModule.label.trim() || '后端'
  form.codeModules.push({
    label,
    path: newModule.path
  })
  cancelAddModule()
}

function cancelAddModule() {
  showAddModule.value = false
  newModule.label = ''
  newModule.path = ''
}

function removeModule(index: number) {
  form.codeModules.splice(index, 1)
}

function setModuleEditor(index: number, editorId: string) {
  form.codeModules[index].editorId = editorId || undefined
}

function toggleModulePin(index: number) {
  form.codeModules[index].pinned = !form.codeModules[index].pinned
}

/** 自动扫描项目目录下的代码模块 */
async function autoScanModules() {
  if (!form.path) return
  scanning.value = true
  try {
    const scanned = await window.electronAPI.scanCodeModules(form.path)
    if (scanned.length === 0) {
      alert('未在项目目录中识别到代码模块')
      return
    }
    // 合并扫描结果：不覆盖已有的同路径模块
    const existingPaths = new Set(form.codeModules.map(m => m.path))
    for (const mod of scanned) {
      if (!existingPaths.has(mod.path)) {
        form.codeModules.push({ ...mod })
        existingPaths.add(mod.path)
      }
    }
    // 自动置顶：如果当前没有置顶的模块，置顶第一个
    if (form.codeModules.length > 0 && !form.codeModules.some(m => m.pinned)) {
      form.codeModules[0].pinned = true
    }
  } catch (e) {
    console.error('扫描代码模块失败:', e)
    alert('扫描失败: ' + (e as Error).message)
  } finally {
    scanning.value = false
  }
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

function validate(): boolean {
  errors.name = ''
  errors.path = ''
  if (!form.name.trim()) {
    errors.name = '请输入项目名称'
    return false
  }
  if (!form.path.trim()) {
    errors.path = '请选择项目根目录'
    return false
  }
  return true
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const data: ProjectInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      path: form.path,
      codeModules: form.codeModules.map(m => ({
        path: m.path,
        label: m.label || '后端',
        language: m.language,
        framework: m.framework,
        editorId: m.editorId || undefined,
        pinned: m.pinned || undefined
      })),
      tags: [...form.tags]
    }
    if (form.docsPath) {
      data.docs = form.docsPath
    }
    ;(data as any).groupId = form.groupId || undefined
    emit('submit', data)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.required {
  color: var(--color-danger);
}

.error-text {
  display: block;
  font-size: var(--font-xs);
  color: var(--color-danger);
  margin-top: 4px;
}

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

.input-with-btn {
  display: flex;
  gap: 8px;
}

.input-with-btn .input {
  flex: 1;
}

.code-modules-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.module-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  flex-wrap: wrap;
}

.module-editor-select {
  padding: 3px 6px;
  font-size: 11px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  max-width: 120px;
}

.module-label {
  font-weight: 600;
  color: var(--color-primary);
  white-space: nowrap;
}

.module-path {
  flex: 1;
  color: var(--text-secondary);
  font-family: monospace;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-label-input {
  font-weight: 600;
  color: var(--color-primary);
  white-space: nowrap;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  padding: 2px 6px;
  font-size: var(--font-sm);
  width: 100px;
  flex-shrink: 0;
}

.module-label-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn-change-path {
  flex-shrink: 0;
}

.btn-remove {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.btn-remove:hover {
  background: var(--color-danger-light, #fde8e8);
  color: var(--color-danger);
}

.pin-btn-sm {
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

.pin-btn-sm:hover {
  color: var(--color-warning);
  background: var(--color-warning-light);
}

.pin-btn-sm--active {
  color: var(--color-warning);
}

.add-module-form {
  margin-bottom: 8px;
}

.add-module-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-sm {
  padding: 5px 8px;
  font-size: var(--font-sm);
}

.btn-sm {
  padding: 5px 10px;
  font-size: var(--font-sm);
}

.btn-add-module {
  color: var(--color-primary);
  border: 1px dashed var(--border-color);
  background: transparent;
  width: 100%;
  padding: 8px;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.btn-add-module:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.btn-scan-module {
  color: var(--color-warning);
  border: 1px dashed var(--color-warning);
  background: transparent;
  width: 100%;
  padding: 8px;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.2s;
  margin-top: 6px;
}

.btn-scan-module:hover:not(:disabled) {
  background: var(--color-warning-light);
}

.btn-scan-module:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
