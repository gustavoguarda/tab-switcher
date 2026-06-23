# Changelog

All notable changes to Tab Switcher are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-06-22

### Fixed
- On the extensions gallery (`microsoftedge.microsoft.com/addons`,
  `chromewebstore.google.com`) the switcher silently jumped to another tab
  without showing the modal. The page is `https` but the browser hard-blocks
  content-script injection there, and the modal host fallback wrongly picked the
  blocked page itself as host. It now skips the active tab and shows the switcher
  on the most-recent other web tab, matching the behavior on `edge://` pages.

### Documentation
- Clarified that the arrow keys (`←` / `→`) are the reliable way to cycle
  backward, and that the `Cmd+Shift+E` "cycle back" force is optional.
- Documented that the add-ons store is a browser-restricted page where the
  in-page modal cannot appear.

## [1.0.0] - 2026-06-13

### Added
- Initial release: most-recently-used tab switcher with a hold-to-cycle,
  release-to-switch overlay inspired by Arc/Zen's `Ctrl+Tab`.
- Configurable card count (4–9) and optional tab previews (thumbnails cached in
  session storage).
- English and Portuguese (Brazil) localization.
