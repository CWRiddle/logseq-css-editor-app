const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    newFile: () => 
      ipcRenderer.invoke('new-file'),
    openCssFile: () => 
      ipcRenderer.invoke('open-css-file'),
    saveCssFile: (cells) => 
      ipcRenderer.invoke('save-css-file', { cells })
  }
)
