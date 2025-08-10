const { app, BrowserWindow, Menu, ipcMain, dialog, protocol } = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')

let mainWindow
let dbExplorerWindow
let settingsWindow
let mediaBrowserWindow
let videoPlayerWindow

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

function createVideoPlayerWindow() {
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
		parent: mainWindow,
		modal: false,
		title: 'Video Player',
		backgroundColor: '#000000',
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

// IPC handler for playing videos
ipcMain.handle('play-video', async (event, videoPath) => {
	if (mainWindow) {
		// Convert the file path to a safe protocol URL with proper encoding
		// Use encodeURI to handle special characters including quotes
		const encodedPath = encodeURI(videoPath.replace(/\\/g, '/'))
		const safeUrl = 'safe-file://' + encodedPath

		console.log('Original path:', videoPath)
		console.log('Encoded safe URL:', safeUrl)

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

		return true
	}
	return false
})

// IPC handlers for video sync between main window and video player window
ipcMain.handle('video-control', async (event, action, data) => {
	const windows = [mainWindow, videoPlayerWindow].filter(w => w && !w.webContents.isDestroyed())

	// Send the control action to all video windows except the sender
	windows.forEach(window => {
		if (window.webContents !== event.sender) {
			window.webContents.send('video-control', action, data)
		}
	})

	return true
})

// IPC handler to get current video state from main window
ipcMain.handle('get-current-video-state', async (event) => {
	if (!mainWindow || mainWindow.webContents.isDestroyed()) {
		return null;
	}
	var requester = event.sender;

	// Request current video state from main window
	return new Promise((resolve) => {
		// Set up a one-time listener for the response
		const responseHandler = (event, state) => {
			mainWindow.webContents.removeListener('video-state-response', responseHandler)
			// If there's a current video, also send it to the requesting window
			if (state && state.currentVideo && event.sender) {
				console.log('Sending current video to requesting window:', state.currentVideo)
				requester.send('play-video', state.currentVideo)
			}

			resolve(state)
		}
		mainWindow.webContents.on('video-state-response', responseHandler)

		// Request the state from main window
		mainWindow.webContents.send('get-video-state')

		// Timeout after 5 seconds if no response
		setTimeout(() => {
			mainWindow.webContents.removeListener('video-state-response', responseHandler)
			resolve(null)
		}, 5000)
	});
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
}

app.whenReady().then(() => {
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
