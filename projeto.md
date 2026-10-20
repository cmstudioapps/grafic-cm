# Grafic-CM Studio: Propósito, Funcionalidades e Roadmap

O **Grafic-CM Studio** é uma ferramenta desktop inovadora que redefine a forma como desenvolvedores e criadores transformam projetos web em aplicativos desktop nativos.

---

## 🎯 Propósito do Grafic-CM

O propósito fundamental do **Grafic-CM** é simplificar e abstrair toda a complexidade de configuração do ecossistema **Electron** e **electron-builder**. 

Em vez de exigir que o desenvolvedor configure manualmente arquivos `package.json`, scripts de build, dependências do Node, ícones multiplataforma e lógica de janelas (`BrowserWindow`), o Grafic-CM funciona como um **Studio Desktop interativo**:
1. O usuário aponta para a pasta do seu projeto web (HTML, CSS, JS ou aplicações Node/Express).
2. Personaliza a identidade (Nome, Versão, **App ID**), o design, as animações de abertura (*splash screen*) e os botões da barra de título através de uma interface visual elegante.
3. Com poucos cliques, empacota e gera executáveis nativos profissionais (`.exe` para Windows, `.deb` para Linux, etc.) prontos para distribuição e atualizações.

---

## ✅ O que já temos (Funcionalidades Atuais)

- **Assistente Passo a Passo (Wizard):** Interface moderna em 5 etapas guiadas.
- **Análise Automática de Projetos:** Detecção de arquivos HTML, entradas de API (`server.js`) e ícones na pasta do usuário.
- **Identidade Completa:** Configuração de Nome do Aplicativo, Versão e **App ID** personalizado (essencial para atualizações e identificação no SO).
- **Prévia Instantânea (Live Preview):** Teste do app em tempo real, incluindo suporte automático a servidores Express/Node locais.
- **Gerador de Instaladores Nativos:** Suporte a build para Windows (`.exe` x64/ia32) e Linux (`.deb` x64/ia32).
- **Personalização Visual da Janela:**
  - Estilos de barra de título (Padrão Windows, macOS e Customizado).
  - Cores personalizáveis para os botões de fechar, minimizar e maximizar.
  - Botão de alternar tema (☀️/🌙) integrado na barra de título.
  - Animações de splash screen (*Cinemático, Fade In, Zoom In, Slide Up*).
- **Viewport Isolado:** Prevenção de barras de rolagem indesejadas no corpo do aplicativo.

---

## ⚠️ Preocupações Técnicas Cruciais (Desafios do Modelo)

Ao transformar projetos web em aplicativos desktop empacotados, existem três pontos críticos que exigem atenção redobrada no design e arquitetura do Grafic-CM:

### 1. O Grafic-CM reconhece quando o app precisa iniciar um servidor?
- **O desafio:** Muitas aplicações web modernas rodam com um backend em Node.js (Express, Fastify, etc.) que escuta em uma porta específica (ex: `localhost:3000`). Em um app desktop empacotado, o processo do servidor precisa ser iniciado corretamente junto com a janela do Electron e encerrado com segurança ao fechar o app.
- **Como o Grafic-CM lida hoje:** O scanner detecta se há uma entrada de API (`apiEntry` / `server.js`) na pasta do usuário e o motor de build injeta automaticamente um script principal (`electron-main.cjs`) que faz o `fork` do servidor em segundo plano, injetando variáveis de ambiente essenciais (`PORT` e `ETE_USER_DATA_PATH`).

### 2. Como o Grafic-CM lida com salvamento de dados locais (Sem engessar o código do usuário)?
- **A visão correta:** O usuário deve poder programar exatamente do jeito que quiser, usando caminhos relativos normais ou bibliotecas padrão (como SQLite, JSON, etc.), sem ser obrigado a alterar seu código para usar variáveis ou caminhos específicos do Grafic-CM. 
- **A solução transparente (Working Directory):** Para que o usuário não precise mudar nada no código dele, o Grafic-CM configura o diretório de trabalho (`cwd`) do processo do servidor backend (`server.js`) para apontar automaticamente para a pasta persistente do usuário (`app.getPath('userData')`). Assim, qualquer arquivo ou banco de dados salvo com caminho relativo vai parar na pasta segura do sistema operacional, **sem exigir nenhuma alteração no código do usuário.**

### 3. Como o Grafic-CM lida com dependências de terceiros no projeto do usuário?
- **A filosofia:** O Grafic-CM não tenta adivinhar nem pré-empacotar todas as bibliotecas do mundo (como SQLite, MySQL, etc.). O Studio vem apenas com o essencial (Electron e o esqueleto de execução).
- **Como funciona:** O Grafic-CM lê o `package.json` do projeto do usuário, preserva as dependências declaradas por ele e assegura que o ambiente de build (`electron-builder`) processe e inclua corretamente os módulos necessários (através de resolução de pacotes e symlinks/instalação interna), permitindo total liberdade criativa ao desenvolvedor.

### 4. O usuário final precisa instalar dependências (como o Electron) para rodar o app?
- **O desafio:** Usuários finais comuns de softwares desktop não possuem Node.js, npm ou Electron instalados em suas máquinas. O executável entregue precisa ser totalmente autossuficiente (*standalone*).
- **Como o Grafic-CM lida hoje:** Através do `electron-builder`, o Grafic-CM empacota o motor do Chromium, o interpretador Node.js e todas as dependências do projeto em um único instalador autocontido (`.exe` ou `.deb`). O usuário final apenas executa o instalador e usa o app nativamente.

---

## 🔧 O que precisa melhorar (Pontos de Atenção & Refinamento)

1. **Gestão de Dependências de Terceiros nos Apps Gerados:**
   - Atualmente injetamos `express` e `cors` automaticamente, mas projetos mais complexos podem precisar de outras dependências nativas (como `sqlite3` ou `bcrypt`). É preciso refinar o empacotador para lidar melhor com módulos nativos C++.
2. **Feedback Visual de Erros no Build:**
   - Se o `electron-builder` falhar por falta de alguma ferramenta de sistema ou dependência externa, o log bruto pode ser difícil de interpretar para usuários iniciantes. Precisamos de tradutores/amigabilizadores de erros de build.
3. **Gerenciamento de Assinatura de Código (Code Signing):**
   - Atualmente os executáveis são gerados sem assinatura digital (o que gera alertas do Windows Defender / SmartScreen). Precisamos adicionar suporte na interface para chaves de assinatura e certificados.

---

## 🚀 O que falta fazer (Roadmap / Próximos Passos)

1. **Suporte a macOS (`.dmg` e `.app`):**
   - Permitir que usuários no Linux/Windows ou macOS gerem pacotes DMG para computadores Apple.
2. **Sistema de Auto-Update Integrado:**
   - Gerar junto com o instalador a configuração pronta para atualizações automáticas via GitHub Releases (`electron-updater`).
3. **Templates de Projetos Iniciais (Scaffolding):**
   - Permitir que o usuário crie um projeto novo do zero diretamente no Studio (ex: template React, Vue, Vanilla JS ou Dashboard com banco SQLite).
4. **Gerenciador de Perfis de Build:**
   - Salvar as configurações de cada projeto em um arquivo de projeto do Grafic-CM para facilitar recompilações futuras com um clique.
