# Privacy Policy — Tab Switcher

_Last updated: 2026-06-13_

**Tab Switcher does not collect, transmit, or sell any data. Everything stays on
your device.**

## What the extension accesses and why

- **Open tabs (titles, favicons, and active-tab screenshots).** Used only to
  render the switcher and to switch between tabs. Titles and favicons are read in
  memory to draw the cards. When **Tab previews** is enabled, the extension takes
  a screenshot of the tab you are currently viewing so its card can show a
  thumbnail.
- **Local storage.** The recent-tab order and your settings are stored locally
  (`chrome.storage`). When previews are on, recent screenshots are cached in
  **session storage** (cleared when the browser closes or when you turn previews
  off). Stored only on your device.
- **All websites (`<all_urls>`).** The switcher is an in-page overlay, so the
  extension must run on the page you are viewing to draw it and read keyboard
  input. It does **not** read page content, form data, or browsing history.

## What the extension does NOT do

- No data is sent to any server. There is no backend, no analytics, no tracking,
  no ads.
- Screenshots and tab information never leave your device and are never shared
  with the developer or any third party.
- No personal information is collected.

## Permissions summary

| Permission | Why |
|---|---|
| `tabs` | Read tab title/favicon and switch the active tab. |
| `storage` | Save settings and the recent-tab order; cache preview thumbnails locally. |
| `scripting` + host access (`<all_urls>`) | Render the in-page switcher overlay and (if previews are on) capture the visible tab. |

## Contact

Questions about this policy: open an issue on the project's repository.

---

# Política de Privacidade — Tab Switcher (Português)

_Última atualização: 2026-06-13_

**O Tab Switcher não coleta, não transmite e não vende nenhum dado. Tudo
permanece no seu dispositivo.**

## O que a extensão acessa e por quê

- **Abas abertas (títulos, favicons e screenshot da aba ativa).** Usados apenas
  para montar o switcher e trocar de aba. Quando **Prévias das abas** está
  ligado, a extensão tira um screenshot da aba que você está vendo para mostrar a
  miniatura no card.
- **Armazenamento local.** A ordem das abas recentes e suas configurações ficam
  no dispositivo (`chrome.storage`). Com prévias ligadas, os screenshots recentes
  ficam em **armazenamento de sessão** (apagados ao fechar o navegador ou
  desligar as prévias).
- **Todos os sites (`<all_urls>`).** O switcher é uma sobreposição dentro da
  página, então a extensão precisa rodar na página que você está vendo para
  desenhá-la e capturar o teclado. Ela **não** lê o conteúdo da página, dados de
  formulário nem histórico.

## O que a extensão NÃO faz

- Nenhum dado é enviado a servidores. Não há backend, analytics, rastreamento ou
  anúncios.
- Screenshots e informações de abas nunca saem do seu dispositivo nem são
  compartilhados com o desenvolvedor ou terceiros.
- Nenhuma informação pessoal é coletada.
