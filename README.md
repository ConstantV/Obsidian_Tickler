# Tickler 0.1.0

An Obsidian Desktop plugin with 31 rolling day folders (today plus the next 30 days) and 12 month folders (next month plus the following 11 months). The current month never appears in the month row. Days use a compact Sunday–Saturday calendar with item dots; months form two rows of six. Click a day or month to open its detail panel *below* the board, where separate task/file counts and **Add task** / **Upload file** actions appear. You can also drag files or your own Tickler tasks onto the calendar.

Open day items roll forward to Today without changing their original date or deadline. Month items stay in Month review until you assign a day.

## Build and test

Use Node.js 24 and npm. Run `npm ci --cache .npm-cache` to install local dependencies, then `npm run verify` for typecheck, lint, unit tests, integration tests with temporary files, Playwright browser harness tests, production build, and ZIP validation. The browser harness loads the real `src/view.ts` with a thin host stub; it is not a test inside Obsidian.

## Install and use

Install the three plugin files from `delivery/obsidian-tickler-0.1.0.zip` in a separate test vault first. Tickler reads ordinary Markdown checkboxes with `⏳ YYYY-MM-DD` and/or `📅 YYYY-MM-DD`, stores its own cards in `Tickler/Items`, and copies external documents into a device-specific document folder. See `delivery/INSTALL.md` and `delivery/LIMITATIONS.md`.

The interface uses Obsidian theme variables for text, backgrounds, borders, accents, and focus. Buttons and calendar cells have transparent backgrounds. Only the active navigation button and active day/month selection have a thin accent border; inactive controls have no visible border. Clickable text uses the theme's normal text colour, while static labels are muted. A horizontal line separates days from months. The board fits within roughly half the 900px browser-harness viewport. Light and dark screenshots plus day/month detail screenshots are included. Other community themes and the real Obsidian app still need hands-on testing.

## Sources and distribution

Built against the [official sample plugin](https://github.com/obsidianmd/obsidian-sample-plugin), [public API](https://github.com/obsidianmd/obsidian-api), and [manifest documentation](https://docs.obsidian.md/Reference/Manifest). The contract ID `obsidian-tickler` does not meet the current ID rule for new community catalog plugins; this package is for manual installation. The code is MIT licensed; the ZIP includes that license and notices for bundled runtime dependencies.
