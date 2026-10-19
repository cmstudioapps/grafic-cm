import { BrowserWindow } from 'electron';
import path from 'path';
import { fork } from 'child_process';
import fs from 'fs';

let previewWindow = null;
let serverProcess = null;

export async function iniciarPreview(options, onLog) {
  pararPreview();

  const {
    projetoPath,
    indexHtml,
    apiEntry,
    appNome,
    largura,
    altura,
    temaApp,
    estiloJanela,
    estadoJanela,
    tipoAnimacao,
    botaoTema,
    corFechar,
    corMinimizar,
    corMaximizar
  } = options;

  // 1. Iniciar servidor backend se houver
  if (apiEntry && fs.existsSync(apiEntry)) {
    onLog(`[Preview] Iniciando servidor backend: ${apiEntry}\n`);
    
    const userDataDir = path.join(projetoPath, '.grafic-data');
    if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

    serverProcess = fork(apiEntry, [], {
      cwd: path.dirname(apiEntry),
      env: {
        ...process.env,
        PORT: '3000',
        ETE_USER_DATA_PATH: userDataDir,
        ETE_DB_PATH: path.join(userDataDir, 'banco')
      },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    serverProcess.stdout?.on('data', (data) => {
      onLog(`[Backend] ${data.toString()}`);
    });

    serverProcess.stderr?.on('data', (data) => {
      onLog(`[Backend Error] ${data.toString()}`);
    });
  }

  const bgCor = temaApp === 'dark' ? '#0b0f19' : '#f5f5f7';

  // 2. Criar Janela de Prévia
  previewWindow = new BrowserWindow({
    width: largura || 1080,
    height: altura || 720,
    title: `${appNome || 'App Preview'} (Modo Teste)`,
    autoHideMenuBar: true,
    frame: false,
    show: false,
    backgroundColor: bgCor,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (estadoJanela === 'maximized') {
    previewWindow.maximize();
  }

  previewWindow.show();

  if (indexHtml && fs.existsSync(indexHtml)) {
    previewWindow.loadFile(indexHtml);
  } else {
    previewWindow.loadURL('data:text/html,<h1>Erro: index.html nao encontrado no projeto.</h1>');
  }

  // Injetar script de barra de título, tema, sem scroll na janela nativa e controles de maximizar/minimizar funcionando
  previewWindow.webContents.on('did-finish-load', () => {
    previewWindow.webContents.executeJavaScript(`
      (function() {
        const animType = '${tipoAnimacao || 'cinematic'}';
        let isDark = '${temaApp || 'light'}' === 'dark';
        const comBotaoTema = ${botaoTema ? 'true' : 'false'};

        // 1. Splash Screen com Múltiplos Tipos de Animação
        if (animType !== 'nenhuma' && !document.getElementById('grafic-intro-splash')) {
          const splash = document.createElement('div');
          splash.id = 'grafic-intro-splash';
          
          let animStyle = 'transition: opacity 0.5s ease;';
          if (animType === 'zoom') animStyle = 'transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); transform: scale(1.05);';
          if (animType === 'slide') animStyle = 'transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); transform: translateY(0);';

          splash.innerHTML = \`
            <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:\${isDark ? '#0b0f19' : '#f5f5f7'};color:\${isDark ? '#f3f4f6' : '#1d1d1f'};z-index:999999999;display:flex;flex-direction:column;align-items:center;justify-content:center; \${animStyle}">
              <div style="font-size:36px;font-weight:700;margin-bottom:8px;font-family:-apple-system,sans-serif;">\${ '${appNome || 'App'}' }</div>
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

        // 2. Travar totalmente scroll de janela nativa
        const style = document.createElement('style');
        style.id = 'grafic-theme-styles';
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
        titleSpan.innerHTML = \`<span>\${ '${appNome || 'App'}' }</span>\`;

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
    `);
  });

  previewWindow.on('closed', () => {
    previewWindow = null;
    pararPreview();
    onLog('[Preview] Janela de teste fechada.\n');
  });

  onLog('[Preview] Janela de teste aberta com sucesso!\n');
  return true;
}

export function pararPreview() {
  if (previewWindow && !previewWindow.isDestroyed()) {
    previewWindow.close();
    previewWindow = null;
  }

  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {}
    serverProcess = null;
  }
}
