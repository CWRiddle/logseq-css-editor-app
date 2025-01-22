// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog, protocol, net, session } = require('electron')
const fs = require('fs').promises
const path = require('node:path')

// CSS parsing and generation utilities
const CSS_CELL_REGEX = /\/\* @CELL_START: (.*?) \*\/\n\/\* @TITLE: (.*?) \*\/\n([\s\S]*?)\/\* @CELL_END \*\//g;

function parseCssIntoCells(cssContent) {
  const cells = [];
  let match;
  
  while ((match = CSS_CELL_REGEX.exec(cssContent)) !== null) {
    cells.push({
      id: match[1],
      title: match[2],
      content: match[3].trim()
    });
  }
  
  return cells;
}

function generateCssFromCells(cells) {
  return cells.map(cell => {
    return `/* @CELL_START: ${cell.id} */\n/* @TITLE: ${cell.title} */\n${cell.content}\n/* @CELL_END */`;
  }).join('\n\n');
}

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
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

  // Configure session for Monaco Editor
  const ses = mainWindow.webContents.session;
  
  // Set security headers
  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';" +
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:;" + // needed for Monaco
          "style-src 'self' 'unsafe-inline';" +
          "font-src 'self' data:;" +
          "img-src 'self' data: blob:;" +
          "worker-src blob:;" +
          "child-src blob:;"
        ],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'X-XSS-Protection': ['1; mode=block']
      }
    });
  });

  // Configure protocol for serving local files
  protocol.handle('file', (request) => {
    let filePath = request.url.replace('file:///', '');
    filePath = decodeURIComponent(filePath);
    
    // Handle Monaco editor files
    if (filePath.includes('node_modules/monaco-editor')) {
      filePath = path.join(__dirname, filePath);
    }
    
    return net.fetch('file://' + filePath);
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Register secure protocol for file serving
  protocol.registerSchemesAsPrivileged([
    { scheme: 'file', privileges: { secure: true, standard: true } }
  ]);

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

let currentFilePath = null;

// Handle creating new CSS file
ipcMain.handle('new-file', async () => {
  currentFilePath = null;
  return { success: true };
});

// Handle opening CSS file
ipcMain.handle('open-css-file', async () => {
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
    
    // Parse CSS content into cells
    const cells = parseCssIntoCells(content);
    
    // If no cells found, create a single cell with all content
    if (cells.length === 0 && content.trim()) {
      cells.push({
        id: Date.now().toString(),
        title: 'Imported Styles',
        content: content.trim()
      });
    }
    
    return { success: true, cells };
  } catch (error) {
    currentFilePath = null;
    return { success: false, error: error.message };
  }
});

// Handle saving CSS file
ipcMain.handle('save-css-file', async (event, { cells }) => {
  try {
    // If no current file path, show save dialog
    if (!currentFilePath) {
      const result = await dialog.showSaveDialog({
        filters: [{ name: 'CSS Files', extensions: ['css'] }]
      });
      
      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Save operation cancelled' };
      }
      
      currentFilePath = result.filePath;
    }
    
    // Generate CSS content from cells
    const content = generateCssFromCells(cells);
    
    await fs.writeFile(currentFilePath, content, 'utf8');
    return { success: true, filePath: currentFilePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
