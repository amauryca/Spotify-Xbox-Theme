# XboxBlades for Spicetify

An unofficial Xbox 360-style dashboard for Spotify desktop. Browse Spotify songs and playlists, switch between visualizers, read synced lyrics when available, and navigate with a controller that Spotify detects with the standard gamepad layout.

## Install the macOS beta

1. Install [Spicetify](https://spicetify.app/docs/getting-started) for Spotify desktop.
2. Download and extract `XboxBlades-v0.1.0-beta-macOS.zip` from the GitHub release.
3. Move the extracted `XboxBlades` folder into your Spicetify `Themes` folder. Run `spicetify config-dir` to open your Spicetify configuration folder.
4. Run:

   ```sh
   spicetify config current_theme XboxBlades color_scheme Blades inject_css 1 inject_theme_js 1
   spicetify apply
   ```

To restore stock Spotify, run `spicetify restore` and reopen Spotify. If you had a previous Spicetify theme, restore its settings before applying again.

## Controls

- **Find music** searches Spotify and opens playlists. Choose a song to open its visualizer.
- **Visual settings** contains styles, performance controls, and color adjustments. **Song only** leaves the song label visible. **Fullscreen** hides it. Press Escape to return.
- **Lyrics** displays Spotify lyrics where available.
- **Media → Pictures** imports up to eight local photos as a rotating dashboard background.
- **System → Console Settings** links to Spotify settings and provides live playback controls.
- For compatible controllers, use the D-pad or left stick to move, A to select, and B to go back. LB focuses the toolbar and RB focuses screen controls. Text entry and file selection may need a keyboard or mouse.

## Compatibility

The local theme was developed on macOS with Spotify 1.3.6.1921 and Spicetify 2.46.4. The release bundle has passed build and bridge checks. Clean installations, other operating systems, and physical controllers still need beta testing. Spotify updates can affect search, lyrics, and settings shortcuts.

Visualizers use Spotify track analysis when available. For live audio, choose an existing audio input. The beta ships without a startup video.

## Build

From this repository root, with Node.js and npm:

```sh
npm ci --prefix work/xbox-build
work/xbox-build/node_modules/.bin/tailwindcss -i work/actual-port/input.css -o work/actual-port/site.css --minify
node work/actual-port/build.cjs
node work/actual-port/test-parent.cjs
node work/actual-port/test-startup.cjs
```

The build writes `outputs/XboxBlades/theme.js`. To include a video in your own build, place a WebM clip you have permission to use at `work/actual-port/media/startup.webm` before building.

## Credits

Dashboard adapted from [Audio-Visualizer by David Lázaro Fernández](https://github.com/David-Lazaro-Fernandez/Audio-Visualizer). The upstream project license is included with the source and theme. Visualizer presets and rendering use [Butterchurn](https://github.com/jberg/butterchurn). License notices are included in the theme folder. Xbox and Spotify belong to their respective owners. This project is unaffiliated with Microsoft and Spotify.
