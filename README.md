# Grafic-CM Studio v2.0

> ⚠️ **IMPORTANTE:** Antes de utilizar ou contribuir com o projeto, **leia o arquivo [projeto.md](./projeto.md)**. Ele detalha o propósito fundamental do Grafic-CM, as funcionalidades atuais, o roadmap e as **preocupações técnicas cruciais** (como gerenciamento de servidores backend, persistência de dados locais via `userData` e independência de dependências para o usuário final).

O **Grafic-CM Studio** é um aplicativo desktop moderno para Linux e Windows desenvolvido para transformar projetos web (HTML/JS/Node) em aplicativos desktop nativos prontos para distribuição (`.exe` e `.deb`), sem complicação e sem exigir conhecimentos avançados de Electron.

---

## 🚀 Funcionalidades Principais

1. **Assistente Passo a Passo (Wizard Interativo):**
   - Interface inspirada em design moderno (Apple Light), guiando o usuário por etapas claras: Seleção de Projeto, Identidade, Design, Ícone e Ações.
2. **Prévia Instantânea (Live Preview):**
   - Teste seu aplicativo na hora (incluindo suporte automático a servidores backend Express na pasta `api/`) sem precisar compilar.
3. **Gerador de Instaladores Nativos:**
   - Crie instaladores para **Windows (`.exe`)** e **Linux (`.deb`)** com suporte a arquiteturas `x64` e `ia32`.
4. **Personalização Visual Avançada:**
   - **Estilo da Barra de Título:** Escolha entre Padrão Windows (direita), Estilo macOS (bolinhas coloridas à esquerda) ou Linux.
   - **Botão de Alternar Tema (☀️/🌙):** Adicione um botão na barra de título para alternar instantaneamente entre Modo Claro e Escuro.
   - **Animações de Abertura (Splash Screen):** Escolha entre *Cinemático (Aurora Glow)*, *Fade In*, *Zoom In*, *Slide Up* ou *Nenhuma animação*.
   - **Estado Inicial da Janela:** Janela Normal ou Maximizada em Tela Cheia.
5. **Viewport Isolado sem Scroll Indesejado:**
   - O conteúdo do app é encapsulado em um container dedicado, eliminando qualquer barra de rolagem indesejada na janela nativa do Electron.

---

## 🛠️ Como Iniciar e Rodar o Studio

Clone ou acesse a pasta do projeto no terminal e instale as dependências:

```bash
cd grafic-cm
npm install
```

Para abrir o **Grafic-CM Studio**:

```bash
npm start
```

---

## 📦 Como Empacotar Apps Pelo Studio

1. Abra o **Grafic-CM Studio**.
2. No **Passo 1**, selecione a pasta do seu projeto web/HTML/Node.
3. No **Passo 2**, defina o nome e a versão do app.
4. No **Passo 3**, personalize o tema, o estilo da janela, as cores dos botões e a animação de abertura.
5. No **Passo 4**, escolha o ícone personalizado.
6. No **Passo 5**, escolha a arquitetura (`x64` ou `ia32`) e clique em **Gerar .exe** ou **Gerar .deb**.

Os instaladores serão gerados na pasta `dist-output` dentro do seu projeto!

---

## 📄 Licença

MIT
