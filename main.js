import { app, BrowserWindow, ipcMain, dialog, nativeImage, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { analisarProjeto } from './engine/scanner.js';
import { iniciarPreview, pararPreview } from './engine/preview.js';
import { empacotarProjeto } from './engine/builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.name = 'grafic-cm-studio';

let mainWindow = null;

function enviarLog(texto) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app:log', texto);
  }
}

function criarJanela() {
  let appIcon;
  const iconPngPath = path.join(__dirname, 'ICONE.png');
  const iconRootPng = path.join(__dirname, 'icon.png');
  const iconIcoPath = path.join(__dirname, 'icon.ico');

  if (process.platform === 'win32') {
    appIcon = nativeImage.createFromPath(iconIcoPath);
    if (appIcon.isEmpty()) appIcon = nativeImage.createFromPath(iconPngPath);
  } else {
    appIcon = nativeImage.createFromPath(iconPngPath);
    if (appIcon.isEmpty()) appIcon = nativeImage.createFromPath(iconRootPng);
  }

  if (process.platform === 'darwin' && app.dock?.setIcon && !appIcon.isEmpty()) {
    app.dock.setIcon(appIcon);
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 650,
    frame: false,
    backgroundColor: '#f5f5f7',
    icon: appIcon.isEmpty() ? undefined : appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    pararPreview();
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('dialog:selecionar-pasta', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog:selecionar-icone', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'Imagens de Ícone', extensions: ['png', 'ico', 'jpg'] }]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('projeto:analisar', async (event, caminho) => {
  try {
    return { success: true, data: analisarProjeto(caminho) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('preview:iniciar', async (event, config) => {
  try {
    await iniciarPreview(config, (texto) => enviarLog(texto));
    return { success: true };
  } catch (err) {
    enviarLog(`[Erro Preview] ${err.message}\n`);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('preview:parar', async () => {
  pararPreview();
  return { success: true };
});

ipcMain.handle('app:empacotar', async (event, config) => {
  try {
    const outputPath = await empacotarProjeto(config, (texto) => enviarLog(texto));
    // Redirecionar e abrir a pasta onde o executável foi gerado automaticamente!
    shell.openPath(outputPath);
    return { success: true, outputPath };
  } catch (err) {
    enviarLog(`[Erro Builder] ${err.message}\n`);
    return { success: false, error: err.message };
  }
});

// Window controls robustos
ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow() || mainWindow;
  if (win) win.close();
});

ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow() || mainWindow;
  if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow() || mainWindow;
  if (win) {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }
});

app.whenReady().then(criarJanela);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
