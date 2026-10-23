# Tickler 0.1.0 test report — 23 October 2026

**Status: ready for a pilot in a separate test vault.** The required browser-harness tests passed. The harness loads the real `src/view.ts` with a thin host stub; it is not a smoke test in the real Obsidian app.

## Automated checks

`npm run verify` finished at 18:31 local time with exit code **0**. It ran typecheck, lint, unit tests, integration tests, browser-harness tests, production build, and package validation. Node.js v24.13.0, npm 11.6.2, Playwright 1.64.1, and Chromium Headless Shell 156.0.8078.4 were used. Exact commands and exit codes are in `verify-runs.json`.

| Check | Result | Evidence |
|---|---:|---|
| TypeScript typecheck | exit 0 | `typecheck.log` |
| ESLint | exit 0 | `lint.log` |
| Vitest unit | 6 passed, 0 failed; exit 0 | `unit-results.json`, `unit.log` |
| Vitest integration with temporary files | 5 passed, 0 failed; exit 0 | `integration-results.json`, `integration.log` |
| Build browser harness from real view code | exit 0 | `harness.log` |
| Playwright Chromium with thin host stub | 5 passed, 0 failed; exit 0 | `ui-results.json`, `ui.log` |
| Production build | exit 0 | `build.log` |
| ZIP and manifest validation | exit 0 | `package-results.json`, `package.log` |

All **12 required acceptance categories** are `passed` in `acceptance-results.json`, including `folders-43`, `month-review`, `daily-rollover`, and `folder-counts`. Browser tests verify 31 consecutive day buttons aligned to seven weekday columns, 12 month buttons in two rows, a board under 450px tall in the 900px test viewport, dots for the combined count with a `+N` overflow marker, and a detail panel after the board. They simulate a theme that tries to fill every button and verify that all controls stay transparent, only active navigation and calendar selections have an accent border, inactive controls have no visible border, and a line separates days and months. Other scenarios cover next-month selection, drag and drop, month review, rollover, separate counts, completion, source navigation, and keyboard move action.

Screenshots: `screenshots/bord-licht.png`, `screenshots/bord-donker.png`, `screenshots/day-detail.png`, `screenshots/month-detail.png`, and `screenshots/maandverdeling.png`. The light and dark harness screenshots show readable labels, dots, and controls using theme variables. The detail screenshots show exact task and file counts and the two add actions below the board. This demonstrates theme adaptation in the harness; it does not guarantee compatibility with every community theme.

Release: `obsidian-tickler-0.1.0.zip` (514,654 bytes). Its SHA-256 is in `SHA256SUMS.txt`. The ZIP contains `main.js`, `manifest.json`, `styles.css`, the MIT license, and third-party license notices. Package validation checks ZIP integrity, manifest contents, and parseable build output.

## Hands-on checks, separate from automated tests

| Check | Status |
|---|---|
| Enable, disable, and reload in the real Obsidian app | Not run for the updated build |
| Finder drag and drop in the real app | Not run |
| Physical Linux laptop | Not run |
| Real two-device cloud sync, including online-only files | Not run |
| Direct drag from the actual mail app | Not run |
| Individual cloud providers and upload behavior | Not run |
| System notification after an autonomous build and delivery under Focus | Not run |

Temporary-file tests simulate host mappings and operating-system opening through an adapter. They do not prove real synchronization or OS integration. The short test-vault checklist is in `INSTALL.md`.
