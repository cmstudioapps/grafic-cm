export interface JanelaOptions {
  tela_cheia?: boolean;
  menu_Padrao?: boolean;
  altura?: number;
  largura?: number;
  app?: string;
  app_nome?: string;
  icone?: string;
}

export interface Grafic {
  janela(options?: JanelaOptions): void;
  electron: typeof import('electron');
}

export declare function janela(options?: JanelaOptions): void;
export declare const electron: typeof import('electron');

declare const grafic: Grafic;
export default grafic;
