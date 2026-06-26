<template>
  <Teleport to="body">
    <div v-if="visible" class="context-menu-backdrop" @click="close" @contextmenu.prevent="close">
      <div
        class="context-menu"
        :style="{ left: adjustedX + 'px', top: adjustedY + 'px' }"
        @click.stop
        @contextmenu.prevent.stop
      >
        <template v-for="(item, index) in items" :key="index">
          <div v-if="item.type === 'separator'" class="context-menu-separator"></div>
          <div
            v-else
            class="context-menu-item"
            :class="{ 'context-menu-item--disabled': item.disabled, 'context-menu-item--danger': item.danger }"
            @click="handleItemClick(item)"
            @mouseenter="handleMouseEnter(index)"
            @mouseleave="handleMouseLeave(index)"
          >
            <span class="context-menu-item-label">{{ item.label }}</span>
            <svg v-if="item.children" class="context-menu-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <!-- 子菜单 -->
            <div
              v-if="item.children && activeSubmenu === index"
              class="context-menu context-menu--sub"
              :class="submenuDirection === 'left' ? 'context-menu--sub-left' : ''"
            >
              <div
                v-for="(child, ci) in item.children"
                :key="ci"
                class="context-menu-item"
                :class="{ 'context-menu-item--active': child.active }"
                @click.stop="handleChildClick(child)"
              >
                <span class="context-menu-item-label">{{ child.label }}</span>
                <svg v-if="child.active" class="context-menu-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface MenuChildItem {
  label: string
  value?: any
  active?: boolean
  action?: () => void
}

export interface MenuItem {
  type?: 'separator'
  label?: string
  disabled?: boolean
  danger?: boolean
  children?: MenuChildItem[]
  action?: () => void
}

const props = defineProps<{
  items: MenuItem[]
  x: number
  y: number
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const activeSubmenu = ref<number | null>(null)
const submenuDirection = ref<'right' | 'left'>('right')

const adjustedX = computed(() => {
  if (typeof window === 'undefined') return props.x
  const menuWidth = 200
  const maxX = window.innerWidth - menuWidth - 8
  return Math.min(props.x, maxX)
})

const adjustedY = computed(() => {
  if (typeof window === 'undefined') return props.y
  const menuHeight = props.items.length * 34 + 16
  const maxY = window.innerHeight - menuHeight - 8
  return Math.min(props.y, maxY)
})

watch(() => props.visible, (val) => {
  if (!val) activeSubmenu.value = null
})

function handleMouseEnter(index: number) {
  const item = props.items[index]
  if (item.children) {
    activeSubmenu.value = index
    // Check if submenu would overflow right edge
    const menuRight = adjustedX.value + 200 + 200
    submenuDirection.value = menuRight > window.innerWidth ? 'left' : 'right'
  }
}

function handleMouseLeave(index: number) {
  // Delay to allow moving to submenu
  setTimeout(() => {
    if (activeSubmenu.value === index) {
      // Keep open - will close on next mouseenter or backdrop click
    }
  }, 100)
}

function handleItemClick(item: MenuItem) {
  if (item.disabled || item.children) return
  item.action?.()
  close()
}

function handleChildClick(child: MenuChildItem) {
  child.action?.()
  close()
}

function close() {
  activeSubmenu.value = null
  emit('close')
}
</script>

<style scoped>
.context-menu-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.context-menu {
  position: absolute;
  min-width: 180px;
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 10000;
}

.context-menu--sub {
  position: absolute;
  top: -4px;
  left: 100%;
  margin-left: 4px;
}

.context-menu--sub-left {
  left: auto;
  right: 100%;
  margin-left: 0;
  margin-right: 4px;
}

.context-menu-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 12px;
  border-radius: 5px;
  font-size: 13px;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  transition: background 0.1s ease;
  white-space: nowrap;
}

.context-menu-item:hover {
  background: var(--bg-hover, #f3f4f6);
}

.context-menu-item--active {
  color: var(--color-primary, #4f8cff);
  font-weight: 500;
}

.context-menu-item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.context-menu-item--disabled:hover {
  background: transparent;
}

.context-menu-item--danger {
  color: var(--color-danger, #ef4444);
}

.context-menu-item--danger:hover {
  background: var(--color-danger-light, #fef2f2);
}

.context-menu-item-label {
  flex: 1;
}

.context-menu-arrow {
  color: var(--text-tertiary, #9ca3af);
  flex-shrink: 0;
  margin-left: 8px;
}

.context-menu-check {
  color: var(--color-primary, #4f8cff);
  flex-shrink: 0;
  margin-left: 8px;
}

.context-menu-separator {
  height: 1px;
  background: var(--border-color, #e5e7eb);
  margin: 4px 8px;
}
</style>
