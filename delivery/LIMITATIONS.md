# Tickler 0.1.0 limitations

The Chromium browser harness passes with the real view code and synthetic data, including light and dark theme screenshots. The updated plugin has not yet been retested inside the real Obsidian app. Community themes have not been individually checked.

- Obsidian Desktop only. The plugin uses Node.js/Electron and does not support mobile. Installation is manual; the contract ID `obsidian-tickler` does not meet the current rule for new community catalog IDs.
- Imported tasks support ordinary Markdown checkboxes `[ ]`, `[x]`/`[X]`, `⏳ YYYY-MM-DD` for scheduling, and `📅 YYYY-MM-DD` for deadlines. A deadline without a scheduled date appears on its deadline with no preparation time. Unknown checkbox states and invalid dates are diagnostic. Undated source tasks are not copied to Inbox. Imported tasks are read-only and cannot be dragged to a month; own Tickler tasks can. Recurrences are not generated.
- The 31 day tiles cover today plus 30 days. Items scheduled further ahead remain stored and appear when their day enters the window. The 12 month tiles cover next month plus eleven months. Current and older month pools remain in Month review, not in a month tile.
- Dots under a day represent the combined task and file count. The display caps at five dots and shows `+N` for any remainder. The detail panel below the board gives the separate exact counts.
- Files are copied to an external document root selected per device. Host-specific paths live in synced plugin settings, but one device never uses another host's root. Unsafe paths and symlinks are rejected. A local copy is not proof of cloud upload. Missing attachments still count and show a warning. There is no cloud provider API or online-only download.
- Cloud links are entered manually and must use HTTP(S). Availability and permissions are not guaranteed. A local file takes precedence; the cloud link is a fallback.
- `.eml` is stored intact. MIME headers and plain text are parsed; HTML is neither rendered nor executed. Embedded attachments remain in the original `.eml`. A `.msg` is only a generic attachment. Direct dragging from a mail app works only when Electron supplies a usable file path; otherwise save the message as `.eml` first.
- Simultaneous edits from two devices are not merged. Local version checks reject overwriting a card that changed since it was loaded. Back up both the vault and external documents.
- Cards are created only after file copies complete. If the card save then fails, the copied file remains as a recoverable orphan with a diagnostic entry; cleanup is manual.
- No background notifications while Obsidian is closed, mobile app, CAD preview, OCR, AI, or automatic day choice for month items.
- No license has been chosen for publishing the original code. The ZIP includes third-party license notices.
