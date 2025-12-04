# Tana Tweaks for macOS Desktop App

Inject Tana Tweaks into the native macOS Electron app to enable video embeds from Kinescope, Loom, VK Video, and more.

## One-Button Launch (Recommended)

### Option A: Double-Click the App

1. Navigate to `macos-app/launcher/`
2. Double-click **Tana Tweaks.app**
3. Grant permissions if prompted (first run only)
4. Tana launches with tweaks running in the background

To install system-wide, drag `Tana Tweaks.app` to your `/Applications` folder.

### Option B: Double-Click the Command File

1. Navigate to `macos-app/`
2. Double-click **run-tana-tweaks.command**
3. A Terminal window will open and run everything automatically

## Prerequisites

- **Node.js** - Install from [nodejs.org](https://nodejs.org/) or via Homebrew: `brew install node`
- **Tana Desktop App** - Must be installed at `/Applications/Tana.app`

## What Happens When You Launch

1. Any existing Tana instance is closed
2. Tana is relaunched with remote debugging enabled
3. The Tweaks runner connects and enables CSP bypass
4. Content script is injected to handle video embeds
5. Auto re-injection occurs on page navigation

## Stopping Tana Tweaks

```bash
cd macos-app
make stop
```

Or double-click `stop-tana-tweaks.command`.

## Check Status

```bash
make status
```

## Logs

Logs are written to `~/Library/Logs/TanaTweaks.log` for troubleshooting.

View logs:
```bash
cat ~/Library/Logs/TanaTweaks.log
# or follow in real-time:
tail -f ~/Library/Logs/TanaTweaks.log
```

## Troubleshooting

### "Node.js not found"

Install Node.js:
```bash
brew install node
# or download from https://nodejs.org/
```

### Security prompt on first run

macOS may block the app. Go to **System Preferences → Security & Privacy → General** and click "Open Anyway".

### Videos still show as links

Make sure:
1. The Terminal window shows `[+] CSP bypass enabled` and `[+] Injected content script`
2. Navigate away and back to the page with video links
3. Check that the video platform is in your rules (Kinescope, Loom, VK Video are enabled by default)

### Tana won't start

If Tana fails to launch:
```bash
# Kill any stuck processes
pkill -f "Tana.app"
pkill -f "node run.js"

# Try launching manually
/Applications/Tana.app/Contents/MacOS/Tana --remote-debugging-port=9222
```

---

## Advanced Usage

### Manual Command Line

```bash
cd macos-app
npm install   # First time only
node run.js   # Start the runner (Tana must already be running with --remote-debugging-port=9222)
```

### Launch Tana Separately

```bash
/Applications/Tana.app/Contents/MacOS/Tana --remote-debugging-port=9222
```

Then in another terminal:
```bash
cd macos-app && node run.js
```

### Shell Alias

Add to `~/.zshrc` for quick access:
```bash
alias tana-tweaks='/Volumes/storage/01_Projects/tana-extension/macos-app/run-tana-tweaks.command'
```

## Files

| File | Description |
|------|-------------|
| `Makefile` | Build/run commands (`make help`) |
| `run.js` | Main runner (CSP bypass + auto-inject) |
| `content-script-electron.js` | Video embed logic for Electron |
| `run-tana-tweaks.command` | Launcher (Terminal visible) |
| `run-tana-tweaks-background.command` | Launcher (background) |
| `stop-tana-tweaks.command` | Stop all processes |
| `launcher/Tana Tweaks.app` | macOS app wrapper |
| `launcher/TanaTweaks.applescript` | Source for the app |

## Configuring Video Rules

Default rules include Kinescope, Loom, and VK Video. To add custom rules:

```javascript
// In Tana DevTools console (chrome://inspect → inspect Tana):
const settings = JSON.parse(localStorage.getItem('tana-tweaks-settings'));
settings.customRules.push({
  id: "my-rule",
  name: "My Video Platform",
  enabled: true,
  pattern: "example\\.com/video/(\\d+)",
  embedTemplate: '<iframe src="https://example.com/embed/{{match1}}" allowfullscreen></iframe>'
});
localStorage.setItem('tana-tweaks-settings', JSON.stringify(settings));
// Navigate away and back to apply
```

## How It Works

1. Tana is an Electron app (Chromium-based)
2. Launching with `--remote-debugging-port` enables Chrome DevTools Protocol
3. The runner connects via CDP and calls `Page.setBypassCSP(true)` to disable Content Security Policy
4. Content script is injected to find video links and replace them with embedded players
5. On page navigation, the runner automatically re-injects the script

## Limitations

- **Re-launch required**: Must run the launcher each time you start Tana
- **No popup UI**: Unlike the browser extension, rules are managed via localStorage
- **Some platforms may block**: Video platforms with strict `X-Frame-Options` headers won't embed
