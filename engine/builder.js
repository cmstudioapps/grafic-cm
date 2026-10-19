import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function empacotarProjeto(config, onLog) {
  const {
    projetoPath,
    appNome,
    versao,
    iconePath,
    plataforma, // 'win', 'linux', 'all'
    arch, // 'x64', 'ia32', 'both'
    temaApp,
    estiloJanela,
    estadoJanela,
    tipoAnimacao,
    botaoTema,
    corFechar,
    corMinimizar,
    corMaximizar
  } = config;

  if (!projetoPath || !fs.existsSync(projetoPath)) {
    throw new Error('Caminho do projeto não especificado.');
  }

  const arquitetura = arch || 'x64';
  onLog(`[Builder] Preparando empacotamento para "${appNome}" (v${versao}) [Arch: ${arquitetura}, Tema: ${temaApp || 'light'}]...\n`);

  // Criar diretório temporário de build
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grafic-build-'));
  onLog(`[Builder] Diretório temporário criado: ${tmpDir}\n`);

  // Copiar arquivos do projeto para o tempDir
  onLog(`[Builder] Copiando arquivos do projeto...\n`);
  copyRecursiveSync(projetoPath, tmpDir);

  // Garantir package.json correto no tempDir com autor e dependências do Electron essenciais
  const pkgPath = path.join(tmpDir, 'package.json');
  let pkgData = {};
  if (fs.existsSync(pkgPath)) {
    try {
      pkgData = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch (e) {}
  }

  pkgData.name = appNome.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  pkgData.productName = appNome;
  pkgData.version = versao || '1.0.0';
  pkgData.main = pkgData.main || 'electron-main.cjs';
  pkgData.homepage = pkgData.homepage || 'https://graficcm.dev';
  pkgData.author = {
    name: "Caio Multiversando",
    email: "contato@graficcm.dev"
  };

  pkgData.dependencies = {
    ...(pkgData.dependencies || {}),
    "express": "^4.19.2",
    "cors": "^2.8.5"
  };

  // O electron-builder exige o electron nas dependências/devDependencies para calcular a versão do motor
  pkgData.devDependencies = {
    ...(pkgData.devDependencies || {}),
    "electron": "^32.0.0"
  };

  const bgCor = temaApp === 'dark' ? '#0b0f19' : '#f5f5f7';

  // Gerar electron-main.cjs com carregamento de ícone multiplataforma robusto
  const mainScriptPath = path.join(tmpDir, pkgData.main);
  onLog(`[Builder] Gerando script principal do Electron com ícone robusto...\n`);
  const mainContent = `
const { app, BrowserWindow, ipcMain, nativeImage } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

app.name = '${pkgData.name}';

let mainWindow;
let serverProcess;

function iniciarServidor() {
  try {
    const userDataDir = app.getPath('userData');
    const serverPath = path.join(__dirname, 'api', 'server.js');
    if (fs.existsSync(serverPath)) {
      console.log('[Electron] Iniciando servidor em:', serverPath);
      serverProcess = fork(serverPath, [], {
        env: {
          ...process.env,
          PORT: '3000',
          ETE_USER_DATA_PATH: userDataDir,
          ETE_DB_PATH: path.join(userDataDir, 'banco')
        },
        stdio: 'inherit'
      });
    }
  } catch (err) {
    console.error('[Electron] Erro ao iniciar servidor:', err);
  }
}

app.whenReady().then(() => {
  iniciarServidor();

  let appIcon;
  const iconPngPath = path.join(__dirname, 'icon.png');
  const iconIcoPath = path.join(__dirname, 'icon.ico');
  const iconLinuxDir = path.join(__dirname, 'build', 'icons', '512x512.png');

  if (process.platform === 'win32') {
    appIcon = nativeImage.createFromPath(iconIcoPath);
    if (appIcon.isEmpty()) appIcon = nativeImage.createFromPath(iconPngPath);
  } else {
    appIcon = nativeImage.createFromPath(iconLinuxDir);
    if (appIcon.isEmpty()) appIcon = nativeImage.createFromPath(iconPngPath);
  }

  if (process.platform === 'darwin' && app.dock?.setIcon && !appIcon.isEmpty()) {
    app.dock.setIcon(appIcon);
  }

  mainWindow = new BrowserWindow({
    width: 1080,
    height: 768,
    autoHideMenuBar: true,
    title: "${appNome}",
    frame: false,
    show: false,
    backgroundColor: "${bgCor}",
    icon: appIcon.isEmpty() ? undefined : appIcon,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if ("${estadoJanela || 'normal'}" === "maximized") {
    mainWindow.maximize();
  }

  mainWindow.show();

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(\`
      (function() {
        const animType = '${tipoAnimacao || 'cinematic'}';
        let isDark = '${temaApp || 'light'}' === 'dark';
        const comBotaoTema = ${botaoTema ? 'true' : 'false'};

        if (animType !== 'nenhuma' && !document.getElementById('grafic-intro-splash')) {
          const splash = document.createElement('div');
          splash.id = 'grafic-intro-splash';
          
          let animStyle = 'transition: opacity 0.5s ease;';
          if (animType === 'zoom') animStyle = 'transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); transform: scale(1.05);';
          if (animType === 'slide') animStyle = 'transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); transform: translateY(0);';

          splash.innerHTML = \`
            <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:\${isDark ? '#0b0f19' : '#f5f5f7'};color:\${isDark ? '#f3f4f6' : '#1d1d1f'};z-index:999999999;display:flex;flex-direction:column;align-items:center;justify-content:center; \${animStyle}">
              <div style="font-size:36px;font-weight:700;margin-bottom:8px;font-family:-apple-system,sans-serif;">\${ '${appNome}' }</div>
              <div style="opacity:0.6;font-size:14px;font-family:-apple-system,sans-serif;margin-bottom:28px;">Carregando sistema...</div>
              \${ animType === 'cinematic' ? \`
                <div style="width:220px;height:4px;background:rgba(0,0,0,0.1);border-radius:2px;overflow:hidden;">
                  <div id="grafic-splash-bar" style="width:0%;height:100%;background:#0071e3;transition:width 1.8s ease;"></div>
                </div>
              \` : '' }
            </div>
          \`;
          document.body.appendChild(splash);

          if (animType === 'cinematic') {
            setTimeout(() => {
              const bar = document.getElementById('grafic-splash-bar');
              if (bar) bar.style.width = '100%';
            }, 100);
          }

          setTimeout(() => {
            if (splash) {
              splash.style.opacity = '0';
              if (animType === 'zoom') splash.style.transform = 'scale(0.95)';
              if (animType === 'slide') splash.style.transform = 'translateY(-20px)';
              setTimeout(() => splash.remove(), 500);
            }
          }, 1800);
        }

        if (document.getElementById('grafic-custom-titlebar')) return;

        const style = document.createElement('style');
        style.innerHTML = \`
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            overflow: hidden !important;
            background: \${isDark ? '#0b0f19' : '#f5f5f7'} !important;
            color: \${isDark ? '#f3f4f6' : '#1d1d1f'} !important;
            transition: background 0.3s ease, color 0.3s ease;
          }
          html::-webkit-scrollbar, body::-webkit-scrollbar, #grafic-app-wrapper::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          #grafic-app-wrapper {
            position: absolute;
            top: 36px;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
            box-sizing: border-box;
          }
          .grafic-titlebar {
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 36px;
            background: \${isDark ? '#111827' : '#e5e5ea'};
            display: flex;
            align-items: center;
            justify-content: \${ '${estiloJanela || 'windows'}' === 'macos' ? 'flex-start' : 'space-between' };
            padding: 0 12px;
            z-index: 999999;
            -webkit-app-region: drag;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 13px;
            color: \${isDark ? '#f3f4f6' : '#1d1d1f'};
            border-bottom: 1px solid rgba(0,0,0,0.1);
            transition: background 0.3s ease, color 0.3s ease;
          }
          .grafic-titlebar-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
          }
          .grafic-controls {
            display: flex;
            align-items: center;
            gap: 8px;
            -webkit-app-region: no-drag;
          }
          .grafic-btn {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            color: rgba(0,0,0,0.6);
            font-weight: bold;
          }
          .grafic-btn-win {
            width: 36px;
            height: 36px;
            border-radius: 0;
            background: transparent;
            color: \${isDark ? '#fff' : '#000'};
          }
          .grafic-btn-win:hover { background: rgba(0,0,0,0.1); }
          .grafic-btn-close-win:hover { background: \${ '${corFechar || '#ff3b30'}' } !important; color: #fff !important; }
          .grafic-btn-theme-toggle {
            background: transparent;
            border: none;
            cursor: pointer;
            font-size: 14px;
            padding: 4px 8px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-app-region: no-drag;
          }
          .grafic-btn-theme-toggle:hover {
            background: rgba(0,0,0,0.1);
          }
        \`;
        document.head.appendChild(style);

        const wrapper = document.createElement('div');
        wrapper.id = 'grafic-app-wrapper';
        
        while (document.body.firstChild) {
          wrapper.appendChild(document.body.firstChild);
        }
        document.body.appendChild(wrapper);

        const titlebar = document.createElement('div');
        titlebar.id = 'grafic-custom-titlebar';
        titlebar.className = 'grafic-titlebar';

        const isMac = '${estiloJanela || 'windows'}' === 'macos';

        const titleSpan = document.createElement('div');
        titleSpan.className = 'grafic-titlebar-title';
        titleSpan.innerHTML = \`<span>\${ '${appNome}' }</span>\`;

        const controls = document.createElement('div');
        controls.className = 'grafic-controls';

        let btnTheme = null;
        if (comBotaoTema) {
          btnTheme = document.createElement('button');
          btnTheme.className = 'grafic-btn-theme-toggle';
          btnTheme.innerHTML = isDark ? '🌙' : '☀️';
          btnTheme.title = 'Alternar Modo Claro / Escuro';
          btnTheme.onclick = () => {
            isDark = !isDark;
            btnTheme.innerHTML = isDark ? '🌙' : '☀️';
            titlebar.style.background = isDark ? '#111827' : '#e5e5ea';
            titlebar.style.color = isDark ? '#f3f4f6' : '#1d1d1f';
            document.body.style.background = isDark ? '#0b0f19' : '#f5f5f7';
            document.body.style.color = isDark ? '#f3f4f6' : '#1d1d1f';
          };
        }

        const btnMin = document.createElement('button');
        const btnMax = document.createElement('button');
        const btnClose = document.createElement('button');

        const { ipcRenderer } = require('electron');

        btnClose.onclick = () => ipcRenderer.send('window-close');
        btnMin.onclick = () => ipcRenderer.send('window-minimize');
        btnMax.onclick = () => ipcRenderer.send('window-maximize');

        if (isMac) {
          btnClose.style.background = '${corFechar || '#ff3b30'}';
          btnMin.style.background = '${corMinimizar || '#ff9500'}';
          btnMax.style.background = '${corMaximizar || '#34c759'}';
          [btnClose, btnMin, btnMax].forEach(b => {
            b.className = 'grafic-btn';
            controls.appendChild(b);
          });
          if (btnTheme) controls.appendChild(btnTheme);
          titlebar.appendChild(controls);
          titlebar.appendChild(titleSpan);
        } else {
          if (btnTheme) controls.appendChild(btnTheme);

          btnClose.className = 'grafic-btn grafic-btn-win grafic-btn-close-win';
          btnClose.innerHTML = '✕';
          btnMin.className = 'grafic-btn grafic-btn-win';
          btnMin.innerHTML = '🗕';
          btnMax.className = 'grafic-btn grafic-btn-win';
          btnMax.innerHTML = '🗖';

          controls.appendChild(btnMin);
          controls.appendChild(btnMax);
          controls.appendChild(btnClose);

          titlebar.appendChild(titleSpan);
          titlebar.appendChild(controls);
        }

        document.body.prepend(titlebar);
      })();
    \`);
  });

  mainWindow.on('closed', () => {
    if (serverProcess) serverProcess.kill();
    mainWindow = null;
  });
});

ipcMain.on('window-close', () => mainWindow?.close());
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;
  fs.writeFileSync(mainScriptPath, mainContent);

  // Criar pasta build/icons e popular com o ícone escolhido (ou fallback ICONE.png)
  const iconsDir = path.join(tmpDir, 'build', 'icons');
  fs.mkdirSync(iconsDir, { recursive: true });

  let sourceIcon = null;
  if (iconePath && fs.existsSync(iconePath)) {
    sourceIcon = iconePath;
  } else {
    const defaultIcon = path.resolve(__dirname, '..', 'ICONE.png');
    if (fs.existsSync(defaultIcon)) {
      sourceIcon = defaultIcon;
    }
  }

  if (sourceIcon) {
    const ext = path.extname(sourceIcon).toLowerCase();
    if (ext === '.ico') {
      fs.copyFileSync(sourceIcon, path.join(tmpDir, 'icon.ico'));
    }
    const tamanhos = ['16x16', '24x24', '32x32', '48x48', '64x64', '128x128', '256x256', '512x512'];
    tamanhos.forEach(tam => {
      fs.copyFileSync(sourceIcon, path.join(iconsDir, `${tam}.png`));
    });
    fs.copyFileSync(sourceIcon, path.join(tmpDir, 'icon.png'));
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2));

  onLog(`[Builder] Configurando dependências para o build...\n`);
  
  // Symlink de node_modules e npm bin locais
  const nodeModulesSrc = path.resolve(process.cwd(), 'node_modules');
  const nodeModulesDest = path.join(tmpDir, 'node_modules');
  if (fs.existsSync(nodeModulesSrc) && !fs.existsSync(nodeModulesDest)) {
    try {
      fs.symlinkSync(nodeModulesSrc, nodeModulesDest, 'junction');
    } catch (e) {}
  }

  // Localizar o binário do electron-builder localmente
  const builderCliLocal = path.resolve(process.cwd(), 'node_modules', 'electron-builder', 'cli.js');

  onLog(`[Builder] Executando electron-builder local...\n`);

  const builderArgs = [builderCliLocal];
  if (plataforma === 'win') {
    builderArgs.push('--win');
    if (arquitetura === 'x64') builderArgs.push('--x64');
    else if (arquitetura === 'ia32') builderArgs.push('--ia32');
    else if (arquitetura === 'both') { builderArgs.push('--x64'); builderArgs.push('--ia32'); }
  } else if (plataforma === 'linux') {
    builderArgs.push('--linux');
    if (arquitetura === 'x64') args.push('--x64');
    else if (arquitetura === 'ia32') args.push('--ia32');
    else if (arquitetura === 'both') { args.push('--x64'); args.push('--ia32'); }
  } else {
    builderArgs.push('--dir');
  }

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, builderArgs, {
      cwd: tmpDir,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (data) => {
      onLog(data.toString());
    });

    child.stderr.on('data', (data) => {
      onLog(`[Error] ${data.toString()}`);
    });

    child.on('close', (code) => {
      if (code === 0) {
        onLog(`\n[Builder] Sucesso! Instalador gerado em: ${path.join(projetoPath, 'dist-output')}\n`);
        resolve(path.join(projetoPath, 'dist-output'));
      } else {
        reject(new Error(`electron-builder encerrou com código ${code}`));
      }
    });
  });
}

function copyRecursiveSync(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      if (childItemName === 'node_modules' || childItemName === 'dist-output' || childItemName === '.grafic-data' || childItemName === 'engine') {
        return;
      }
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}
