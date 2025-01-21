// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs').promises
const path = require('node:path')

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableRemoteModule: false
    },
    // Enable native file dialogs
    properties: ['openFile', 'saveFile']
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const { dialog } = require('electron')
let currentFilePath = null;

// Handle opening CSS file
ipcMain.handle('open-css-file', async (event) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'CSS Files', extensions: ['css'] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'No file selected' };
    }

    const filePath = result.filePaths[0];
    currentFilePath = filePath;
    const content = await fs.readFile(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    currentFilePath = null;
    return { success: false, error: error.message };
  }
});

// Handle saving CSS file
ipcMain.handle('save-css-file', async (event, { content }) => {
  if (!currentFilePath) {
    return { success: false, error: 'No file is currently loaded' };
  }
  try {
    await fs.writeFile(currentFilePath, content, 'utf8')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
