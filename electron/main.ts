import { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import { registerProjectHandlers } from './ipc/project'
import { registerEditorHandlers } from './ipc/editor'
import { registerFileHandlers } from './ipc/file'
import { registerSearchHandlers } from './ipc/search'
import { registerSettingsHandlers, getCurrentSettings, updateCurrentSettings } from './ipc/settings'
import { registerGroupHandlers } from './ipc/group'
import { registerToolHandlers } from './ipc/tool'
import { initStore } from './store'

// 数据存储路径：应用所在目录下的 ./data 文件夹（绿色便携）
const getDataPath = (): string => {
  if (app.isPackaged) {
    return join(process.resourcesPath, '..', 'data')
  }
  return join(app.getAppPath(), 'data')
}

let mainWindow: BrowserWindow | null = null
let searchWindow: BrowserWindow | null = null
let tray: Tray | null = null

// ==================== 单实例锁定 ====================
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // 已有实例在运行，退出
  app.quit()
} else {
  app.on('second-instance', () => {
    // 当第二个实例启动时，聚焦到主窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

// ==================== 窗口创建 ====================

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false, // frameless window，使用自定义标题栏
    show: false,  // 先隐藏，ready-to-show 时再显示，避免白屏
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // 窗口准备好后再显示，避免白屏闪烁
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // 开发模式加载 vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 关闭请求：按记忆行为直接执行，否则交由渲染进程弹窗确认
  mainWindow.on('close', (event) => {
    if ((app as any).isQuitting) {
      return // 允许真正退出
    }
    event.preventDefault()
    const closeAction = getCurrentSettings().closeAction
    if (closeAction === 'minimize') {
      mainWindow?.hide()
    } else if (closeAction === 'quit') {
      ;(app as any).isQuitting = true
      app.quit()
    } else {
      mainWindow?.webContents.send('window:close-requested')
    }
  })
}

function createSearchWindow(): void {
  if (searchWindow) {
    if (searchWindow.isVisible()) {
      searchWindow.hide()
    } else {
      searchWindow.show()
      searchWindow.focus()
      searchWindow.webContents.send('search-window:shown')
    }
    return
  }

  searchWindow = new BrowserWindow({
    width: 680,
    height: 500,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // 居中显示
  searchWindow.center()

  if (process.env.VITE_DEV_SERVER_URL) {
    searchWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/search.html`)
  } else {
    searchWindow.loadFile(join(__dirname, '../dist/search.html'))
  }

  searchWindow.once('ready-to-show', () => {
    searchWindow?.show()
    searchWindow?.focus()
  })

  searchWindow.on('blur', () => {
    searchWindow?.hide()
  })

  searchWindow.on('closed', () => {
    searchWindow = null
  })
}

// ==================== 全局快捷键 ====================

/** 将快捷键字符串转换为 Electron accelerator 格式 */
function toAccelerator(hotkey: string): string {
  return hotkey
    .split('+')
    .map(part => {
      const p = part.trim()
      if (p === 'Cmd') return 'CommandOrControl'
      return p
    })
    .join('+')
}

/** 比较语义化版本号，返回 >0 表示 a>b，<0 表示 a<b，0 表示相等 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(n => parseInt(n, 10) || 0)
  const partsB = b.split('.').map(n => parseInt(n, 10) || 0)
  const maxLen = Math.max(partsA.length, partsB.length)
  for (let i = 0; i < maxLen; i++) {
    const va = partsA[i] || 0
    const vb = partsB[i] || 0
    if (va > vb) return 1
    if (va < vb) return -1
  }
  return 0
}

function registerGlobalShortcuts(): void {
  const settings = getCurrentSettings()
  // 全局搜索快捷键
  const searchHotkey = settings.hotkey || 'Alt+Space'
  try {
    globalShortcut.register(toAccelerator(searchHotkey), () => {
      createSearchWindow()
    })
  } catch { /* ignore invalid accelerator */ }

  // 打开主窗口快捷键
  const mainWindowHotkey = settings.mainWindowHotkey || 'Alt+P'
  try {
    globalShortcut.register(toAccelerator(mainWindowHotkey), () => {
      if (mainWindow) {
        if (mainWindow.isVisible() && mainWindow.isFocused()) {
          mainWindow.hide()
        } else {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.show()
          mainWindow.focus()
        }
      } else {
        createMainWindow()
      }
    })
  } catch { /* ignore invalid accelerator */ }
}

/** 重新注册全局快捷键（设置变更后调用） */
function reregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll()
  registerGlobalShortcuts()
}

// ==================== 系统托盘 ====================

function createTray(): void {
  // 尝试加载图标文件，如果不存在则创建一个简单的默认图标
  let icon: Electron.NativeImage
  const iconPath = join(__dirname, '..', 'public', 'icon.png')
  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) {
      // 创建一个 16x16 的简单图标
      icon = createDefaultIcon()
    }
  } catch {
    icon = createDefaultIcon()
  }

  tray = new Tray(icon.resize({ width: 16, height: 16 }))

  const settings = getCurrentSettings()
  const mainWindowHotkey = settings.mainWindowHotkey || 'Alt+P'
  const searchHotkey = settings.hotkey || 'Alt+Space'
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `显示主窗口  ${mainWindowHotkey}`,
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    {
      label: `搜索  ${searchHotkey}`,
      click: () => {
        createSearchWindow()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        (app as any).isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('项目管理工具')
  tray.setContextMenu(contextMenu)

  // 左键单击也显示主窗口
  tray.on('click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

/** 创建一个简单的默认图标（16x16 蓝色方块） */
function createDefaultIcon(): Electron.NativeImage {
  const size = 16
  const canvas = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4
      // 简单的圆角方块图标
      const margin = 2
      const radius = 3
      const inBounds = x >= margin && x < size - margin && y >= margin && y < size - margin
      const cornerCheck = (() => {
        if (!inBounds) return false
        // 检查圆角
        const cx = x < margin + radius ? margin + radius : x >= size - margin - radius ? size - margin - radius - 1 : x
        const cy = y < margin + radius ? margin + radius : y >= size - margin - radius ? size - margin - radius - 1 : y
        if ((x < margin + radius || x >= size - margin - radius) &&
            (y < margin + radius || y >= size - margin - radius)) {
          const dx = x - cx
          const dy = y - cy
          return dx * dx + dy * dy <= radius * radius
        }
        return true
      })()

      if (cornerCheck) {
        // BGRA 格式：蓝色 #4f46e5
        canvas[offset] = 0xe5     // B
        canvas[offset + 1] = 0x46 // G
        canvas[offset + 2] = 0x4f // R
        canvas[offset + 3] = 0xff // A
      } else {
        canvas[offset] = 0
        canvas[offset + 1] = 0
        canvas[offset + 2] = 0
        canvas[offset + 3] = 0
      }
    }
  }
  return nativeImage.createFromBuffer(canvas, { width: size, height: size })
}

// ==================== 窗口控制 IPC ====================

function registerWindowHandlers(): void {
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })
  ipcMain.handle('window:executeClose', async (_event, action: string, remember: boolean) => {
    if (remember) {
      updateCurrentSettings({ closeAction: action })
    }
    if (action === 'minimize') {
      mainWindow?.hide()
    } else if (action === 'quit') {
      ;(app as any).isQuitting = true
      app.quit()
    }
  })
  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false
  })

  // 搜索窗口控制
  ipcMain.handle('searchWindow:hide', () => {
    searchWindow?.hide()
  })
  ipcMain.handle('searchWindow:openProjectInMain', (_event, projectId: string) => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('navigate-to-project', projectId)
    }
  })
}

// ==================== 自动更新 ====================
// 配置 autoUpdater
autoUpdater.autoDownload = false  // 不自动下载，由用户决定
autoUpdater.autoInstallOnAppQuit = false  // 不在退出时自动安装

// 检查更新
ipcMain.handle('updater:check', async () => {
  try {
    const result = await autoUpdater.checkForUpdates()
    if (!result?.updateInfo) {
      return { hasUpdate: false, version: null, releaseNotes: null }
    }
    const currentVersion = app.getVersion()
    const remoteVersion = result.updateInfo.version
    // 比较版本号：只有远程版本大于当前版本才算有更新
    const hasUpdate = compareVersions(remoteVersion, currentVersion) > 0
    return { hasUpdate, version: remoteVersion, releaseNotes: result.updateInfo.releaseNotes || null }
  } catch (e) {
    return { hasUpdate: false, version: null, error: (e as Error).message }
  }
})

// 下载更新
ipcMain.handle('updater:download', async () => {
  try {
    await autoUpdater.downloadUpdate()
    return true
  } catch (e) {
    return false
  }
})

// 安装更新并重启
ipcMain.handle('updater:install', async () => {
  autoUpdater.quitAndInstall()
})

// 获取自动更新设置
ipcMain.handle('updater:getAutoDownload', async () => {
  const settings = getCurrentSettings()
  return settings.autoUpdate !== false  // 默认为 true
})

// 设置自动下载
ipcMain.handle('updater:setAutoDownload', async (_event, enabled: boolean) => {
  autoUpdater.autoDownload = enabled
})

// 下载进度事件转发到渲染进程
autoUpdater.on('download-progress', (progress) => {
  if (mainWindow) {
    mainWindow.webContents.send('updater:download-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total
    })
  }
})

// 下载完成事件
autoUpdater.on('update-downloaded', () => {
  if (mainWindow) {
    mainWindow.webContents.send('updater:update-downloaded')
  }
})

// ==================== 应用启动 ====================

app.whenReady().then(() => {
  // 初始化数据存储
  const dataPath = getDataPath()
  initStore(dataPath)

  // 注册 IPC handlers
  registerWindowHandlers()
  registerProjectHandlers(ipcMain)
  registerEditorHandlers(ipcMain)
  registerFileHandlers(ipcMain)
  registerSearchHandlers(ipcMain)
  registerSettingsHandlers(ipcMain)
  registerGroupHandlers(ipcMain)
  registerToolHandlers(ipcMain)

  // 快捷键录制准备/恢复（暂时取消全局快捷键，录制完成后恢复）
  ipcMain.handle('settings:prepareRecord', async () => {
    globalShortcut.unregisterAll()
  })
  ipcMain.handle('settings:restoreRecord', async () => {
    reregisterGlobalShortcuts()
  })

  // 创建主窗口
  createMainWindow()

  // 注册全局快捷键
  registerGlobalShortcuts()

  // 创建系统托盘
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  tray?.destroy()
})
