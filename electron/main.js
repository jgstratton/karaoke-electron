const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const path = require('path')
const url = require('url')

let mainWindow
let dbExplorerWindow
let settingsWindow
let mediaBrowserWindow

function createMenu() {
	const template = [
		{
			label: 'File',
			submenu: [
				{
					label: 'Database Explorer',
					click: () => {
						if (dbExplorerWindow) {
							dbExplorerWindow.focus()
							return
						}
						createDbExplorerWindow()
					},
				},
				{
					label: 'Settings',
					click: () => {
						if (settingsWindow) {
							settingsWindow.focus()
							return
						}
						createSettingsWindow()
					},
				},
				{
					label: 'Media Browser',
					click: () => {
						if (mediaBrowserWindow) {
							mediaBrowserWindow.focus()
							return
						}
						createMediaBrowserWindow()
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
				{ role: 'toggleDevTools' },
				{ type: 'separator' },
				{ role: 'resetZoom' },
				{ role: 'zoomIn' },
				{ role: 'zoomOut' },
				{ type: 'separator' },
				{ role: 'togglefullscreen' },
			],
		},
	]

	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)
}

function createDbExplorerWindow() {
	dbExplorerWindow = new BrowserWindow({
		width: 600,
		height: 500,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
		},
		parent: mainWindow,
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
}

function createSettingsWindow() {
	settingsWindow = new BrowserWindow({
		width: 500,
		height: 400,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
		},
		parent: mainWindow,
		modal: true,
		title: 'Settings',
		resizable: false,
	})

	const devServerURL = process.env.VITE_DEV_SERVER_URL
	if (devServerURL) {
		settingsWindow.loadURL(devServerURL + '?view=settings')
	} else {
		const indexHtml =
			url.pathToFileURL(path.join(__dirname, '..', 'dist', 'index.html')).toString() +
			'?view=settings'
		settingsWindow.loadURL(indexHtml)
	}

	settingsWindow.on('closed', () => {
		settingsWindow = null
	})
}

function createMediaBrowserWindow() {
	mediaBrowserWindow = new BrowserWindow({
		width: 900,
		height: 700,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
		},
		parent: mainWindow,
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
}

// IPC Handlers
ipcMain.handle('select-folder', async () => {
	const result = await dialog.showOpenDialog(mainWindow, {
		properties: ['openDirectory'],
		title: 'Select Media Files Folder',
	})

	if (!result.canceled && result.filePaths.length > 0) {
		return result.filePaths[0]
	}
	return null
})

ipcMain.handle('validate-path', async (event, folderPath) => {
	const fs = require('fs')
	try {
		const stats = await fs.promises.stat(folderPath)
		return stats.isDirectory()
	} catch {
		return false
	}
})

ipcMain.handle('scan-media-files', async (event, folderPath) => {
	const fs = require('fs')
	const path = require('path')

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

		async function scanDirectory(dirPath, relativePath = '') {
			const items = []
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

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1000,
		height: 700,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false, // Disable sandbox for compatibility with preload in most setups
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
}

app.whenReady().then(() => {
	createWindow()
	createMenu()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})
