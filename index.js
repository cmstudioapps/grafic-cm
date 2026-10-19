import electron from 'electron';
import path from 'path';

const { app, BrowserWindow } = electron;

export function janela(options = {}) {
  const iconPath = options.icone
    ? path.isAbsolute(options.icone)
      ? options.icone
      : path.resolve(process.cwd(), options.icone)
    : undefined;

  const opts = {
    width: options.largura || 800,
    height: options.altura || 600,
    fullscreen: options.tela_cheia || false,
    show: false,
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  };

  if (options.app_nome) {
    app.setName(options.app_nome);
  }

  app.whenReady().then(() => {
    if (iconPath && process.platform === 'darwin' && app.dock?.setIcon) {
      app.dock.setIcon(iconPath);
    }

    const win = new BrowserWindow(opts);

    if (!options.menu_Padrao) {
      win.setMenu(null);
    }

    if (options.app) {
      win.loadFile(options.app);
    } else {
      win.loadURL('data:text/html,<h1>Grafic-CM Demo</h1>');
    }

    if (options.app_nome) {
      win.setTitle(options.app_nome);
    }

    win.once('ready-to-show', () => {
      win.show();
    });

    win.on('closed', () => {
      app.quit();
    });
  });
}

const grafic = {
  janela,
  electron
};

export { electron };
export default grafic;
