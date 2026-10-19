const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('graficAPI', {
  selecionarPasta: () => ipcRenderer.invoke('dialog:selecionar-pasta'),
  selecionarIcone: () => ipcRenderer.invoke('dialog:selecionar-icone'),
  analisarProjeto: (caminho) => ipcRenderer.invoke('projeto:analisar', caminho),
  iniciarPreview: (config) => ipcRenderer.invoke('preview:iniciar', config),
  pararPreview: () => ipcRenderer.invoke('preview:parar'),
  empacotar: (config) => ipcRenderer.invoke('app:empacotar', config),
  onLog: (callback) => ipcRenderer.on('app:log', (event, text) => callback(text)),
  
  // Controles de janela customizada
  minimizar: () => ipcRenderer.send('window-minimize'),
  maximizar: () => ipcRenderer.send('window-maximize'),
  fechar: () => ipcRenderer.send('window-close')
});
