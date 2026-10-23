# Install and pilot Tickler 0.1.0

**Status: ready for a pilot in a separate test vault.** The required browser-harness tests pass. The updated plugin has not yet been retested inside the real Obsidian app. Use copies of non-critical files until that hands-on check is complete.

## Install in a test vault

1. Open a separate test vault in Obsidian Desktop. Do not use your personal vault yet.
2. Extract `obsidian-tickler-0.1.0.zip`. Copy the `obsidian-tickler` folder into `<testvault>/.obsidian/plugins/`. Its `manifest.json`, `main.js`, and `styles.css` must be directly inside that folder.
3. Restart Obsidian. Under **Settings → Community plugins**, allow community plugins if needed and enable **Tickler**.
4. Open Tickler using the calendar ribbon icon or the **Open 43 folders** command.
5. In Tickler settings, choose a **Document folder on this device** outside the vault. Tickler copies files into `objects/<id>/...` there. Set a separate root on each device.
6. The default card folder is `Tickler/Items`. The task tag filter is blank by default; you can optionally limit the scanned folders or set a tag such as `#todo`.

## Use

- The 31 day folders start with today and continue across month and year boundaries. The 12 month folders start with **next month** and continue for eleven more months. The current month is never a month tile.
- Days are arranged under Sunday–Saturday headings, with blank alignment cells before today when needed. Small dots beneath a date show the combined number of tasks and files. More than five items appear as five dots plus `+N`. The 12 month folders occupy two rows of six.
- Buttons and day/month cells have no fill. Only active navigation and the active day/month selection have a thin theme-accent border. Other clickable controls have no visible border and use the theme's bright text colour; static labels are muted. A horizontal line separates days and months.
- Click a day or month tile. Its detail panel has **Add task** and **Upload file**. All 43 tiles stay visible. You can also drag files and your own Tickler tasks onto a tile.
- Dropping a file on a month stores `YYYY-MM` without choosing a day. Dropping on a day stores `YYYY-MM-DD`. The original file is copied, not moved.
- Once a month begins, its open month items appear in **Month review**. Choose a day yourself; Tickler does not guess one. Items left in the current or older month remain visible in Month review even though that month has no tile.
- Open day items move into **Today** after their scheduled date. Their original date and deadline remain recorded. Complete imported Markdown tasks in their source note.
- Use **Move to…** if dragging is unavailable. Enter `YYYY-MM-DD`, `YYYY-MM`, or `Inbox`.

## Ten-minute test-vault check

1. Check that the first day tile is today, the 31st is 30 days later, and the first month tile is next month. There should be 31 day and 12 month tiles with separate counts.
2. Click a day and a month. Check that all tiles remain visible and that both folders offer **Add task** and **Upload file**.
3. Drop a copy of a PDF from Finder on a month tile. Its file count should rise without changing a day count.
4. When that month begins, open **Month review**, choose a day, and check that the counts move to the day tile.
5. Drop another file on a day and try **Move to…** as the keyboard alternative.
6. Add a synthetic `- [ ] Test ⏳ 2026-11-12 📅 2026-11-20` to a test note, open its source, and complete it there.
7. Open the copied PDF and verify that the original remains where it was.
8. Import a synthetic `.eml` and check its plain-text preview.
9. Disable and re-enable Tickler; cards and counts should not duplicate.
10. Record any error before trying real data. A second-device sync check should use only copied test data and a device-specific document root.

## Update or remove

Back up both the test vault and external `objects` folder before updating. Disable Tickler, replace `main.js`, `manifest.json`, and `styles.css` in `<testvault>/.obsidian/plugins/obsidian-tickler/` with the files from the new ZIP, restart Obsidian, and enable Tickler again. Removing the plugin does not delete cards or documents. Cloud sync is not a backup, and the plugin does not merge simultaneous edits from different devices.
