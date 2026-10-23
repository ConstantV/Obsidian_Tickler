# Tickler 0.1.0 build result

**Updated package ready for a pilot in a separate test vault.** No button or calendar cell has a fill. Only the active navigation button and active day/month cell have a thin theme-coloured border. Other clickable text stays bright, static labels are muted, and a horizontal line separates the days from the two-row month grid. The compact 31-day calendar, item dots, and detail panel beneath the board remain in place.

`npm run verify` passes: typecheck, lint, 6 unit tests, 5 integration tests, 5 browser-harness tests, production build, and package validation. All 12 required acceptance categories pass. Light and dark screenshots are in `screenshots/`.

The updated plugin has not yet been retested inside the real Obsidian app. Finder dragging, the physical Linux laptop, cloud sync, and direct mail-app dragging remain untested. Keep using a separate test vault. Disable Tickler, replace its three plugin files from `obsidian-tickler-0.1.0.zip`, restart Obsidian, and follow the short check in [INSTALL.md](INSTALL.md). See [TEST_REPORT.md](TEST_REPORT.md) and [LIMITATIONS.md](LIMITATIONS.md).
