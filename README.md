# XboxBlades for Spicetify

An unofficial Xbox 360-style dashboard for Spotify desktop. Browse Spotify songs and playlists, switch between visualizers, read synced lyrics when available, and navigate with a controller that Spotify detects with the standard gamepad layout.

**Start here:** [Windows](#windows) · [macOS](#macos) · [Linux](#linux) · [I already have Spicetify](#2-install-xboxblades) · [Uninstall XboxBlades](#uninstall-xboxblades)

## 1. Install Spicetify

Open [Spotify desktop](https://www.spotify.com/download/) and sign in. If you just installed Spotify, leave it open for about a minute. Then run the command for your operating system.

### Windows

Open **PowerShell** and paste this command.

```powershell
iwr -useb https://raw.githubusercontent.com/spicetify/cli/main/install.ps1 | iex
```

### macOS

Open **Terminal** and paste this command.

```sh
curl -fsSL https://raw.githubusercontent.com/spicetify/cli/main/install.sh | sh
```

### Linux

Open **Terminal** and paste this command.

```sh
curl -fsSL https://raw.githubusercontent.com/spicetify/cli/main/install.sh | sh
```

Follow the setup for your Spotify package before continuing. Look for **Spotify from APT** or **Spotify from Flatpak**. If you installed Spotify from Snap, follow the steps to switch packages. [Spicetify’s Linux setup guide](https://spicetify.app/docs/getting-started#linux-specific-setup)

After the installer finishes, open a fresh Terminal or PowerShell window and run `spicetify --version`. If you see a version number, continue below. Marketplace is optional.

## 2. Install XboxBlades

1. **Download and unzip** [XboxBlades-v0.1.7-beta.zip](https://github.com/amauryca/Spotify-Xbox-Theme/releases/download/v0.1.7-beta/XboxBlades-v0.1.7-beta.zip).
2. **Open your themes folder.** Run `spicetify config-dir` in Terminal or PowerShell. In the folder it opens, open **Themes**. Create **Themes** if it’s missing.
3. **Copy the XboxBlades folder** from the ZIP into **Themes**. Open it and check that the files are arranged like this.

   ```text
   Themes/
   └── XboxBlades/
       ├── theme.js
       ├── user.css
       └── color.ini
   ```

4. **Apply the theme.** Paste these two commands into Terminal or PowerShell.

   ```sh
   spicetify config current_theme XboxBlades color_scheme Blades inject_css 1 inject_theme_js 1
   spicetify backup apply
   ```

5. **Open Spotify.** Restart it if it was already open. The Xbox dashboard appears automatically. Use **Search Spotify** to switch to Spotify’s regular interface and **Xbox Dashboard** to switch back.

### Use Marketplace with XboxBlades

If you already installed Marketplace, click **Marketplace** in the Xbox toolbar. It opens the store in Spotify, and **Xbox Dashboard** takes you back. You can also reach the store from Spotify’s sidebar after clicking **Search Spotify**.

If Marketplace is missing, follow the [official Marketplace install steps for your operating system](https://spicetify.app/docs/customization/marketplace#installation), then apply XboxBlades using step 4 above. Marketplace extensions and snippets can be managed in the store. For best results, keep one visual theme active at a time. If another theme applies its own styles, disable it from Marketplace’s **Installed** tab.

### Optional: Xbox 360 startup intro

Download the [intro-enabled XboxBlades ZIP](https://github.com/amauryca/Spotify-Xbox-Theme/releases/download/v0.1.7-beta/XboxBlades-v0.1.7-beta-intro.zip) and use its **XboxBlades** folder in the install steps above. If you already have XboxBlades, replace its files and run `spicetify apply`, then restart Spotify.

### Optional: Install Adblockify

After XboxBlades is running, you can add rxri’s Adblockify extension. This method works without Marketplace. [Adblockify documentation](https://github.com/rxri/spicetify-extensions/blob/main/adblock/README.md)

1. Open [adblock.js on GitHub](https://github.com/rxri/spicetify-extensions/blob/main/adblock/adblock.js) and click **Download raw file**. Keep the filename `adblock.js`.
2. Run `spicetify config-dir`. Copy the file into **Extensions** inside the folder that opens. Create **Extensions** if it’s missing.
3. Run these commands, then restart Spotify.

   ```sh
   spicetify config extensions adblock.js
   spicetify apply
   ```

To turn off Adblockify, run `spicetify config extensions adblock.js-`, then `spicetify apply` and restart Spotify.

### If you get stuck

| What happened | What to do |
| --- | --- |
| `spicetify` command is missing | Open a new terminal window. If it’s still missing, check the [Spicetify install guide](https://spicetify.app/docs/getting-started). |
| `spicetify config-dir` didn’t open a folder | Run `spicetify -c` and open the folder containing the config file it prints. |
| Spicetify can’t find Spotify on macOS | If Spotify is in Applications, run `spicetify config spotify_path "/Applications/Spotify.app/Contents/Resources"` and try applying again. |
| XboxBlades disappeared after a Spotify update | Run `spicetify backup apply`. If it fails, check the [Spicetify update guide](https://spicetify.app/docs/getting-started#updating). |

### Update XboxBlades

Replace the files inside `Themes/XboxBlades/` with the files from the new theme ZIP, then run `spicetify apply`.

### Uninstall XboxBlades

1. Open Terminal or PowerShell and run:

   ```sh
   spicetify restore
   ```

2. Fully quit Spotify and reopen it. On macOS, use **⌘Q** to quit. Spotify will open with its original interface, and Spicetify will still be installed.
3. To remove the theme files too, run `spicetify config-dir`, open **Themes**, and move the **XboxBlades** folder to the Trash or Recycle Bin.

## Screenshots

**MilkDrop visualizer in Spotify**

![XboxBlades visualizer with playback and style controls](screenshots/visualizer.png)

**Fullscreen visualizer from an earlier beta**

![Fullscreen XboxBlades visualization with the controls hidden](screenshots/fullscreen.png)

## Controls

- **Find music** searches Spotify and opens playlists. Choose a song to open its visualizer.
- **Visual settings** contains styles, performance controls, and color adjustments. Set **Auto-change** to an interval to rotate built-in effects during playback, or to rotate presets if MilkDrop is selected. **Off** keeps manual control. **Song only** leaves the song label visible. **Fullscreen** hides it. Press Escape to return.
- **Lyrics** displays Spotify lyrics where available.
- **Media → Pictures** imports up to eight local photos as a rotating dashboard background.
- **System → Console Settings** links to Spotify settings and provides live playback controls. Use the arrow keys or a controller to navigate the menu.
- For compatible controllers, use the D-pad or left stick to move, A to select, and B to go back. LB focuses the toolbar and RB focuses screen controls. Text entry and file selection may need a keyboard or mouse.

## Desktop games preview

The [desktop games companion](work/desktop-games/README.md) scans supported game locations on macOS, Windows, and Linux and populates **Games → Played Games → My Games**. It searches the Xbox 360 archive for matching box art, then checks the modern Xbox entries and falls back to available installed artwork. Both release ZIPs include the companion. Run `node refresh.cjs --background` in the **desktop-games** folder to enable launching. The companion keeps running when you close the terminal.

## Compatibility

The local theme was developed on macOS with Spotify 1.3.6.1921 and Spicetify 2.46.4. The release bundle has passed build and bridge checks. Windows and Linux are beta targets. Platform-specific layout logic was checked with simulated browser platform values. Live Spotify installations on Windows and Linux and physical controllers still need testing. Spotify updates can affect search, lyrics, and settings shortcuts.

XboxBlades uses the standard physical layout that Spotify reports for Xbox, DualShock 4, and Switch controllers. Use the D-pad or left stick to move, the bottom face button to confirm (Xbox A, PS4 Cross, Switch B), and the right face button to go back. The PowerA Core (Plus) Wired Controller also has a fallback for its raw layout.

Visualizers use Spotify track analysis when available. For live audio, choose an existing audio input. The standard beta ZIP ships without a startup video. The separate intro build includes the Xbox 360 startup clip.

## Build

From this repository root, with Node.js and npm:

```sh
npm ci --prefix work/xbox-build
npm exec --prefix work/xbox-build -- tailwindcss -i work/actual-port/input.css -o work/actual-port/site.css --minify
node work/actual-port/build.cjs
node work/actual-port/test-parent.cjs
node work/actual-port/test-startup.cjs
```

The build writes `outputs/XboxBlades/theme.js`. To include a video in your own build, place a WebM clip you have permission to use at `work/actual-port/media/startup.webm` before building.

## Credits

Thanks to [@jay0nline_ on Instagram](https://www.instagram.com/jay0nline_) for the desktop games idea.

Dashboard adapted from [Audio-Visualizer by David Lázaro Fernández](https://github.com/David-Lazaro-Fernandez/Audio-Visualizer). The upstream project license is included with the source and theme. Visualizer presets and rendering use [Butterchurn](https://github.com/jberg/butterchurn). License notices are included in the theme folder. Xbox and Spotify belong to their respective owners. This project is unaffiliated with Microsoft and Spotify.
