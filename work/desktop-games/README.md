# XboxBlades desktop games

1. Install the updated **XboxBlades** theme from the release using the [theme installation guide](https://github.com/amauryca/Spotify-Xbox-Theme#2-install-xboxblades).
2. Install Node.js if needed. Open Terminal on macOS or Linux, or PowerShell on Windows, in the **desktop-games** folder.
3. Run:

   ```sh
   node refresh.cjs --background
   ```

4. Once you see **Game companion is running**, you can close the terminal. In Spotify, open **Games → Played Games → My Games**, select a game, and choose **Open game**. You can also double-click the row or press Enter or controller A on the focused row.

Use `node refresh.cjs --folder "/path/to/Games" --background` to include another folder. Use a folder dedicated to games, since its immediate subfolders are treated as game titles. Repeat `--folder` for additional locations.

- **After rebooting or signing out**, run the background command again before opening a game. The companion is started on demand.
- **To stop or refresh the companion**, run `node refresh.cjs --stop`. Run the background command again to pick up newly installed games. If you were using the old foreground command, press **Ctrl+C** in its terminal first.
- **For a list only**, stop the companion and use `node refresh.cjs --apply`. Use `--serve` in place of `--background` to see diagnostics in the terminal.

The scanner reads Steam libraries on all three systems, macOS Applications folders, Epic manifests and recognized installed titles on Windows, and Game-category desktop entries on Linux. Some games or launchers may need the extra folder option. The game list stays on the computer and contains display names and any matched cover references. The theme looks for installed artwork when there is no Xbox match, including macOS app icons, cached Steam covers, and Linux desktop entries with a local image path. It uses a generic Xbox tile if no art is available.

The companion downloads and caches the [x360db Xbox 360 catalog](https://github.com/xenia-manager/x360db) and matches by exact normalized title or a verified edition alias. It uses a 360 cover first, then known modern Xbox cover entries such as Roblox from the [Xbox Store](https://www.xbox.com/en-us/games/store/roblox-xbox/bq1tn1t79v9k), then installed art. Ambiguous matches are skipped. Modern Xbox cover coverage is limited to the entries in `covers.json`.

The launch companion listens only on this computer. It opens supported Steam games, macOS app bundles, Linux desktop entries, Windows Epic executables, and recognized executable files from extra folders. Some games open their launcher first. Entries with no launch target remain visible. Windows and Linux launch paths have not been verified on live systems.
