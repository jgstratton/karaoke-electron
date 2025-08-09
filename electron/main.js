const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;
let dbExplorerWindow;

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Database Explorer',
                    click: () => {
                        if (dbExplorerWindow) {
                            dbExplorerWindow.focus();
                            return;
                        }
                        createDbExplorerWindow();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
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
                { role: 'togglefullscreen' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
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
        title: 'Database Explorer'
    });

    const devServerURL = process.env.VITE_DEV_SERVER_URL;
    if (devServerURL) {
        dbExplorerWindow.loadURL(devServerURL + '?view=dbexplorer');
    } else {
        const indexHtml = url.pathToFileURL(path.join(__dirname, '..', 'dist', 'index.html')).toString() + '?view=dbexplorer';
        dbExplorerWindow.loadURL(indexHtml);
    }

    dbExplorerWindow.on('closed', () => {
        dbExplorerWindow = null;
    });
}

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
    });

    const devServerURL = process.env.VITE_DEV_SERVER_URL;
    if (devServerURL) {
        mainWindow.loadURL(devServerURL);
        mainWindow.webContents.openDevTools();
    } else {
        const indexHtml = url.pathToFileURL(path.join(__dirname, '..', 'dist', 'index.html')).toString();
        mainWindow.loadURL(indexHtml);
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();
    createMenu();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
}); app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
