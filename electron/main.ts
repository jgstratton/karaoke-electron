import { app, BrowserWindow, Menu, ipcMain, dialog, protocol } from 'electron'
import * as path from 'path'
import * as url from 'url'
import * as fs from 'fs'
import type { MediaFile } from './preload-types'
import { EVENT_PAUSE_VIDEO, EVENT_SET_CURRENT_TIME, EVENT_SET_DURATION, EVENT_SET_STARTING_TIME, EVENT_SET_VOLUME, EVENT_UNPAUSE_VIDEO, EVENT_VIDEO_ENDED } from './contextBridge/VideoPlayerApi'
import { youTubeService } from './services/YouTubeService'
import { ffmpegService } from './services/FfmpegService'

let mainWindow: BrowserWindow | null = null
let dbExplorerWindow: BrowserWindow | null = null
let mediaBrowserWindow: BrowserWindow | null = null
let videoPlayerWindow: BrowserWindow | null = null

function createMenu(): void {
	const template: Electron.MenuItemConstructorOptions[] = [
		{
			label: 'File',
			submenu: [
				{
					label: 'Launch Video Player',
					click: () => {
						if (videoPlayerWindow) {
							videoPlayerWindow.focus()
							return
						}
						createVideoPlayerWindow()
					},
				},
				{ type: 'separator' },
				{
					label: 'Exit',
					accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
					click: () => {
						app.quit()
					},
				},
			],
		},
		{
			label: 'View',
			submenu: [
				{ role: 'reload' },
				{ role: 'forceReload' },
				{
					role: 'toggleDevTools',
					accelerator: 'F12'
				},
				{ type: 'separator' },
				{ role: 'togglefullscreen' },
			],
		},
	]

	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)
}

function setupContextMenu(window: BrowserWindow): void {
	window.webContents.on('context-menu', (event, params) => {
		const menu = Menu.buildFromTemplate([
			{
				label: 'Inspect Element',
				click: () => {
					window.webContents.inspectElement(params.x, params.y)
				}
			},
			{ type: 'separator' },
			{ role: 'cut' },
			{ role: 'copy' },
			{ role: 'paste' },
			{ type: 'separator' },
			{ role: 'selectAll' }
		])

		menu.popup({ window: window })
	})
}

function createDbExplorerWindow(): void {
	dbExplorerWindow = new BrowserWindow({
		width: 600,
		height: 500,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
		},
		parent: mainWindow || undefined,
		modal: false,
		title: 'Database Explorer',
	})

	const devServerURL = process.env.VITE_DEV_SERVER_URL
	if (devServerURL) {
		dbExplorerWindow.loadURL(devServerURL + '?view=dbexplorer')
	} else {
		const indexHtml =
			url.pathToFileURL(path.join(__dirname, '..', 'dist', 'index.html')).toString() +
			'?view=dbexplorer'
		dbExplorerWindow.loadURL(indexHtml)
	}

	dbExplorerWindow.on('closed', () => {
		dbExplorerWindow = null
	})

	// Setup context menu for right-click inspect
	setupContextMenu(dbExplorerWindow)
}

function createMediaBrowserWindow(): void {
	mediaBrowserWindow = new BrowserWindow({
		width: 900,
		height: 700,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
		},
		parent: mainWindow || undefined,
		modal: false,
		title: 'Media Browser',
	})

	const devServerURL = process.env.VITE_DEV_SERVER_URL
	if (devServerURL) {
		mediaBrowserWindow.loadURL(devServerURL + '?view=mediabrowser')
	} else {
		const indexHtml =
			url.pathToFileURL(path.join(__dirname, '..', 'dist', 'index.html')).toString() +
			'?view=mediabrowser'
		mediaBrowserWindow.loadURL(indexHtml)
	}

	mediaBrowserWindow.on('closed', () => {
		mediaBrowserWindow = null
	})

	setupContextMenu(mediaBrowserWindow)
}

function createVideoPlayerWindow(): void {
	videoPlayerWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
			webSecurity: false, // Allow loading of local resources through custom protocol
		},
		parent: mainWindow || undefined,
		modal: false,
		title: 'Video Player',
		backgroundColor: '#000000',
		autoHideMenuBar: false, // Hide the menu bar in the video player window
	})

	const devServerURL = process.env.VITE_DEV_SERVER_URL
	if (devServerURL) {
		videoPlayerWindow.loadURL(devServerURL + '?view=videoplayer')
	} else {
		const indexHtml =
			url.pathToFileURL(path.join(__dirname, '..', 'dist', 'index.html')).toString() +
			'?view=videoplayer'
		videoPlayerWindow.loadURL(indexHtml)
	}

	videoPlayerWindow.on('closed', () => {
		videoPlayerWindow = null
	})

	// Add fullscreen event listeners to handle menu bar visibility
	videoPlayerWindow.on('enter-full-screen', () => {
		videoPlayerWindow?.setMenuBarVisibility(false)
		videoPlayerWindow?.setAutoHideMenuBar(true)
	})

	videoPlayerWindow.on('leave-full-screen', () => {
		videoPlayerWindow?.setMenuBarVisibility(true)
		videoPlayerWindow?.setAutoHideMenuBar(false)
	})

	// Setup context menu for right-click inspect
	setupContextMenu(videoPlayerWindow)
}

// IPC Handlers
ipcMain.handle('select-folder', async (): Promise<string | null> => {
	if (!mainWindow) return null

	const result = await dialog.showOpenDialog(mainWindow, {
		properties: ['openDirectory'],
		title: 'Select Media Files Folder',
	})

	if (!result.canceled && result.filePaths.length > 0) {
		return result.filePaths[0]
	}
	return null
})

ipcMain.handle('validate-path', async (event: Electron.IpcMainInvokeEvent, folderPath: string): Promise<boolean> => {
	try {
		const stats = await fs.promises.stat(folderPath)
		return stats.isDirectory()
	} catch {
		return false
	}
})

ipcMain.handle('scan-media-files', async (event: Electron.IpcMainInvokeEvent, folderPath: string): Promise<MediaFile[]> => {
	if (!folderPath) {
		return []
	}

	try {
		// Common video file extensions
		const videoExtensions = [
			'.mp4',
			'.avi',
			'.mkv',
			'.mov',
			'.wmv',
			'.flv',
			'.webm',
			'.m4v',
			'.mpg',
			'.mpeg',
			'.3gp',
		]

		async function scanDirectory(dirPath: string, relativePath = ''): Promise<MediaFile[]> {
			const items: MediaFile[] = []
			const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })

			for (const entry of entries) {
				const fullPath = path.join(dirPath, entry.name)
				const relativeFilePath = path.join(relativePath, entry.name)

				if (entry.isDirectory()) {
					// Recursively scan subdirectories
					const subItems = await scanDirectory(fullPath, relativeFilePath)
					items.push(...subItems)
				} else if (entry.isFile()) {
					const ext = path.extname(entry.name).toLowerCase()
					if (videoExtensions.includes(ext)) {
						const stats = await fs.promises.stat(fullPath)
						items.push({
							name: entry.name,
							path: fullPath,
							relativePath: relativeFilePath,
							size: stats.size,
							modified: stats.mtime,
							extension: ext,
						})
					}
				}
			}

			return items
		}

		const files = await scanDirectory(folderPath)
		return files
	} catch (error) {
		console.error('Error scanning media files:', error)
		throw error
	}
})

// IPC handler for playing videos
ipcMain.on('play-video', (event: Electron.IpcMainEvent, videoPath: string) => {
	if (!mainWindow) {
		return;
	}

	// Convert the file path to a safe protocol URL with proper encoding
	// Use encodeURI to handle special characters including quotes
	const encodedPath = encodeURI(videoPath.replace(/\\/g, '/'))
	const safeUrl = 'safe-file://' + encodedPath

	// Send the safe URL to the main window
	mainWindow.webContents.send('play-video', safeUrl)

	// Also send to video player window if it's open
	if (videoPlayerWindow) {
		videoPlayerWindow.webContents.send('play-video', safeUrl)
	}

	// Close media browser window if it's open
	if (mediaBrowserWindow) {
		mediaBrowserWindow.close()
	}

	// Focus the main window
	mainWindow.focus()
})

// send events to the player from the main window
const sendPlayerEvents = (eventName:string, ...args: any[]) => {
	if (!mainWindow) {
		return;
	}

	// Also send to video player window if it's open
	if (videoPlayerWindow) {
		videoPlayerWindow.webContents.send(eventName, ...args)
	}
}

const receivePlayerEvents = (eventName:string, ...args: any[]) => {
	if (mainWindow && !mainWindow.webContents.isDestroyed()) {
		mainWindow.webContents.send(eventName, ...args)
	}
}

// send events from the main window to the player
ipcMain.on(EVENT_PAUSE_VIDEO, (event) => sendPlayerEvents(EVENT_PAUSE_VIDEO))
ipcMain.on(EVENT_UNPAUSE_VIDEO, (event) => sendPlayerEvents(EVENT_UNPAUSE_VIDEO))
ipcMain.on(EVENT_SET_VOLUME, (event, volume) => sendPlayerEvents(EVENT_SET_VOLUME, volume))
ipcMain.on(EVENT_SET_STARTING_TIME, (event, currentTime: number) => sendPlayerEvents(EVENT_SET_STARTING_TIME, currentTime))

// send events from the player to the main window
ipcMain.on(EVENT_VIDEO_ENDED, (event) => receivePlayerEvents(EVENT_VIDEO_ENDED))
ipcMain.on(EVENT_SET_CURRENT_TIME, (event, currentTime: number) => receivePlayerEvents(EVENT_SET_CURRENT_TIME, currentTime))
ipcMain.on(EVENT_SET_DURATION, (event, duration: number) => receivePlayerEvents(EVENT_SET_DURATION, duration))

// IPC handler for getting current video state
ipcMain.handle('get-current-video-state', async (event: Electron.IpcMainInvokeEvent): Promise<any> => {
	// This will be implemented when video state management is added
	// For now, return null to indicate no current state
	return null
})

// IPC handlers for video sync between main window and video player window
ipcMain.handle('video-control', async (event: Electron.IpcMainInvokeEvent, action: string, data?: any): Promise<boolean> => {
	const windows = [mainWindow, videoPlayerWindow].filter((w): w is BrowserWindow =>
		w !== null && !w.webContents.isDestroyed()
	)

	// Send the control action to all video windows except the sender
	windows.forEach(window => {
		if (window.webContents !== event.sender) {
			window.webContents.send('video-control', action, data)
		}
	})

	return true
})

// IPC handlers for video pause/unpause
ipcMain.handle('pause-video', async (event: Electron.IpcMainInvokeEvent): Promise<boolean> => {
	const windows = [mainWindow, videoPlayerWindow].filter((w): w is BrowserWindow =>
		w !== null && !w.webContents.isDestroyed()
	)

	// Send the pause command to all video windows except the sender
	windows.forEach(window => {
		if (window.webContents !== event.sender) {
			window.webContents.send('pause-video')
		}
	})

	return true
})

// IPC handlers for YouTube
ipcMain.handle('check-yt-dlp-installed', async () => {
	return youTubeService.isInstalled()
})

ipcMain.handle('install-yt-dlp', async () => {
	try {
		if (youTubeService.isInstalled()) {
			return { success: true, message: 'yt-dlp is already installed.' }
		}

		await youTubeService.installBinary()
		return { success: true, message: 'yt-dlp installed successfully!' }
	} catch (error) {
		console.error('Failed to install yt-dlp:', error)
		return { success: false, message: `Failed to install yt-dlp: ${error}` }
	}
})

// IPC handlers for FFmpeg
ipcMain.handle('check-ffmpeg-installed', async () => {
	return ffmpegService.isInstalled()
})

ipcMain.handle('install-ffmpeg', async () => {
	try {
		if (ffmpegService.isInstalled()) {
			return { success: true, message: 'ffmpeg is already installed.' }
		}

		await ffmpegService.installBinary()
		return { success: true, message: 'ffmpeg installed successfully!' }
	} catch (error) {
		console.error('Failed to install ffmpeg:', error)
		return { success: false, message: `Failed to install ffmpeg: ${error}` }
	}
})

ipcMain.handle('unpause-video', async (event: Electron.IpcMainInvokeEvent): Promise<boolean> => {
	const windows = [mainWindow, videoPlayerWindow].filter((w): w is BrowserWindow =>
		w !== null && !w.webContents.isDestroyed()
	)

	// Send the unpause command to all video windows except the sender
	windows.forEach(window => {
		if (window.webContents !== event.sender) {
			window.webContents.send('unpause-video')
		}
	})

	return true
})

// IPC handler for toggling fullscreen
ipcMain.handle('toggle-fullscreen', async (event: Electron.IpcMainInvokeEvent): Promise<void> => {
	const senderWindow = BrowserWindow.fromWebContents(event.sender)
	if (senderWindow) {
		senderWindow.setFullScreen(!senderWindow.isFullScreen())
	}
})

function createWindow(): void {
	mainWindow = new BrowserWindow({
		width: 1000,
		height: 700,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false, // Disable sandbox for compatibility with preload in most setups
			webSecurity: false, // Allow loading of local resources through custom protocol
		},
	})

	const devServerURL = process.env.VITE_DEV_SERVER_URL
	if (devServerURL) {
		mainWindow.loadURL(devServerURL)
		mainWindow.webContents.openDevTools()
	} else {
		const indexHtml = url
			.pathToFileURL(path.join(__dirname, '..', 'dist', 'index.html'))
			.toString()
		mainWindow.loadURL(indexHtml)
	}

	mainWindow.on('closed', () => {
		mainWindow = null
	})

	// Add fullscreen event listeners to handle menu bar visibility
	mainWindow.on('enter-full-screen', () => {
		mainWindow?.setMenuBarVisibility(false)
		mainWindow?.setAutoHideMenuBar(true)
	})

	mainWindow.on('leave-full-screen', () => {
		mainWindow?.setMenuBarVisibility(true)
		mainWindow?.setAutoHideMenuBar(false)
	})

	// Setup context menu for right-click inspect
	setupContextMenu(mainWindow)
}

app.whenReady().then(async () => {
	// Initialize Services
	try {
		await youTubeService.initialize()
		await ffmpegService.initialize()
	} catch (error) {
		console.error('Failed to initialize services:', error)
	}

	// Register a custom protocol to serve local video files
	protocol.registerFileProtocol('safe-file', (request, callback) => {
		try {
			// Decode the URL to handle special characters
			const encodedPath = request.url.replace('safe-file://', '')
			const filePath = decodeURI(encodedPath).replace(/\//g, '\\')

			console.log('Protocol handler - Request URL:', request.url)
			console.log('Protocol handler - Decoded path:', filePath)

			callback({ path: filePath })
		} catch (error) {
			console.error('Error in protocol handler:', error)
			callback({ error: -2 }) // FILE_NOT_FOUND
		}
	})

	createWindow()
	createMenu()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})
