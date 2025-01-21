const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    openCssFile: () => 
      ipcRenderer.invoke('open-css-file'),
    saveCssFile: (content) => 
      ipcRenderer.invoke('save-css-file', { content })
  }
)
