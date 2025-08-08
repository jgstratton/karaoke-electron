const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

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

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
