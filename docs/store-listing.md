# Store listing — Tab Switcher

Copy/paste material for the Microsoft Edge Add-ons (Partner Center) and Chrome
Web Store submissions. English first, Portuguese after.

- **Category:** Productivity
- **Privacy policy URL:** host `PRIVACY.md` somewhere public (GitHub Pages, a
  gist, or any URL) and paste that link.
- **Screenshots:** 2–4 of the switcher open over a normal page — one without
  previews (favicons) and one with previews on. Edge accepts 1280×800 or
  640×480; Chrome wants 1280×800 (or 640×400).

---

## English

### Name
Tab Switcher

### Short description (limit 132 chars — this is 122)
Switch between your most recently used tabs. Hold the shortcut, tap to cycle, release to switch — like Arc/Zen's Ctrl+Tab.

### Search terms (Edge allows up to 7; keep each short, no competitor brands)
tab switcher, recent tabs, switch tabs, tab manager, quick tab switch, MRU tabs, ctrl tab

### Description
Tab Switcher brings the "hold and cycle" recent-tabs switcher from Arc and Zen to
Edge and Chrome.

• Press the shortcut (Cmd+E on macOS, Alt+Q on Windows/Linux) to open a centered
  row of your recently used tabs.
• Keep holding the modifier and tap again to move forward; release to jump to the
  selected tab. A quick tap toggles your two most recent tabs.
• Navigate with the cycle key, Tab/Shift+Tab, or the arrows. Press Esc (or click
  the dim background) to cancel without switching.
• Tabs are ordered by most recent use, per window — not by their position in the
  tab strip.
• Optional tab previews: turn them on to show a screenshot of each tab on its
  card (captured locally as you visit tabs).

Private by design: nothing is collected or sent anywhere. Tab info and preview
screenshots stay on your device. No accounts, no tracking, no ads.

Tip: set or change the shortcuts at edge://extensions/shortcuts
(chrome://extensions/shortcuts).

### Permission justifications (Partner Center asks per permission)
- **tabs** — Read each tab's title and favicon to draw the switcher cards, and
  activate the tab you pick.
- **storage** — Save your settings and the recent-tab order, and cache preview
  thumbnails locally (session only).
- **scripting + host access to all sites** — The switcher is an overlay drawn
  inside the current page, so the extension must run on the active page to
  display it and read the keyboard. When previews are enabled it captures a
  screenshot of the visible tab. It does not read page content or browsing data;
  nothing leaves the device.

### Single purpose (Chrome requires this)
A keyboard-driven switcher that lets you move between your most recently used tabs.

---

## Português

### Nome
Tab Switcher

### Descrição curta (limite 132 caracteres — esta tem 119)
Alterne entre suas abas usadas recentemente. Segure o atalho, toque para percorrer, solte para trocar — estilo Arc/Zen.

### Termos de busca (até 7 no Edge; curtos, sem marcas concorrentes)
trocador de abas, abas recentes, alternar abas, gerenciador de abas, troca rápida de abas, abas MRU, ctrl tab

### Descrição
O Tab Switcher traz o switcher de abas recentes "segura-e-percorre" do Arc e do
Zen para o Edge e o Chrome.

• Pressione o atalho (Cmd+E no macOS, Alt+Q no Windows/Linux) para abrir uma
  fileira central das suas abas usadas recentemente.
• Continue segurando o modificador e toque de novo para avançar; solte para ir à
  aba selecionada. Um toque rápido alterna as duas abas mais recentes.
• Navegue com a tecla de ciclo, Tab/Shift+Tab ou as setas. Aperte Esc (ou clique
  no fundo escuro) para cancelar sem trocar.
• As abas são ordenadas por uso mais recente, por janela — não pela posição na
  barra de abas.
• Prévias opcionais: ative para mostrar um screenshot de cada aba no card
  (capturado localmente conforme você visita as abas).

Privado por design: nada é coletado ou enviado. Informações de abas e screenshots
ficam no seu dispositivo. Sem contas, sem rastreamento, sem anúncios.

Dica: defina ou altere os atalhos em edge://extensions/shortcuts.

### Justificativa das permissões
- **tabs** — Ler título e favicon de cada aba para montar os cards e ativar a
  aba escolhida.
- **storage** — Salvar configurações e a ordem das abas recentes, e guardar as
  miniaturas de prévia localmente (apenas na sessão).
- **scripting + acesso a todos os sites** — O switcher é uma sobreposição
  desenhada dentro da página atual, então a extensão precisa rodar na página
  ativa para exibi-lo e capturar o teclado. Com prévias ligadas, captura um
  screenshot da aba visível. Não lê o conteúdo da página nem dados de navegação;
  nada sai do dispositivo.
