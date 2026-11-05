# XboxBlades for Spicetify

[Follow the macOS, Windows, or Linux install guide](https://github.com/amauryca/Spotify-Xbox-Theme#1-install-spicetify).

## 1. Install Spicetify

Install [Spotify desktop](https://www.spotify.com/download/), open it, and sign in. On a fresh install, leave Spotify open for about a minute so it can create its preferences. Then choose your operating system below. If `spicetify --version` already works, skip to [Install XboxBlades](#2-install-xboxblades).

### macOS

Open **Terminal** and run the official installer.

```sh
curl -fsSL https://raw.githubusercontent.com/spicetify/cli/main/install.sh | sh
```

If you already use Homebrew, you can install with `brew install spicetify-cli`. For Spotify in your Applications folder, set its path with `spicetify config spotify_path "/Applications/Spotify.app/Contents/Resources"`. [Spicetify macOS instructions](https://spicetify.app/docs/getting-started#macos)

### Windows

Open **PowerShell** and run the official installer.

```powershell
iwr -useb https://raw.githubusercontent.com/spicetify/cli/main/install.ps1 | iex
```

If you use WinGet, you can run `winget install Spicetify.Spicetify` instead. [Spicetify Windows instructions](https://spicetify.app/docs/getting-started#windows)

### Linux

Open your **terminal** and run the official installer.

```sh
curl -fsSL https://raw.githubusercontent.com/spicetify/cli/main/install.sh | sh
```

Follow the package-specific setup for your copy of Spotify. APT may need write permissions. Flatpak may need its Spotify install and preferences paths set in Spicetify. If you use Snap Spotify, switch to a supported package such as APT before applying the theme. [Spicetify Linux package setup](https://spicetify.app/docs/getting-started#linux-specific-setup)

Marketplace is optional. Open a fresh terminal after installation if `spicetify` is missing, then run `spicetify --version` to check the install.

## 2. Install XboxBlades

1. Open the [XboxBlades v0.1.6-beta release](https://github.com/amauryca/Spotify-Xbox-Theme/releases/tag/v0.1.6-beta). Under **Assets**, download **XboxBlades-v0.1.6-beta.zip** and extract it.
2. Run `spicetify config-dir` in Terminal or PowerShell. Open **Themes** inside the directory it opens, creating it if needed. If the file manager does not open, `spicetify -c` prints the config file path. Open its parent folder.
3. Copy the extracted **XboxBlades** folder into **Themes**. Check that `theme.js`, `user.css`, and `color.ini` are directly inside `Themes/XboxBlades/`.
4. Run these commands in the same terminal.

   ```text
   spicetify config current_theme XboxBlades color_scheme Blades inject_css 1 inject_theme_js 1
   spicetify backup apply
   ```

5. Open or restart Spotify. The Xbox dashboard opens automatically. Use **Search Spotify** to return to the regular Spotify interface and **Xbox Dashboard** to switch back.

### Update or restore

- **Update XboxBlades.** Replace the files in `Themes/XboxBlades/` with the files from the new release and run `spicetify apply`.
- **After a Spotify update.** Run `spicetify backup apply`. If Spotify and Spicetify versions are incompatible, update Spicetify through the same method you used to install it. [Spicetify update guide](https://spicetify.app/docs/getting-started#updating)
- **Restore Spotify.** Run `spicetify restore` and reopen Spotify.

For the desktop game scanner and launcher, see the README in the desktop-games folder included beside XboxBlades.
