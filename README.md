# Tana Tweaks

Chrome extension that enhances [Tana.inc](https://tana.inc) and [Tana.pub](https://tana.pub) with useful tweaks — video embeds, UI improvements, and more.

## Features

- **Preset Rules** — Built-in support for Kinescope, VK Video, and Wistia (disabled by default)
- **Custom Rules** — Define your own embed rules for any video platform
- **Easy Toggle** — Enable/disable any rule with a single click
- Responsive 16:9 aspect ratio that fills the content width
- Hides the original link text for a clean look
- Works with Tana's SPA navigation via MutationObserver
- Modifies CSP headers to allow iframe embedding

## Preset Rules

The extension ships with these presets (all disabled by default):

| Preset | Platforms | Pattern |
|--------|-----------|---------|
| Kinescope | kinescope.io | `kinescope\.io/(?:embed/)?([a-zA-Z0-9_-]+)` |
| VK Video | vkvideo.ru | `vkvideo\.ru/video(\d+)_(\d+)` |
| Wistia | wistia.com | `wistia\.com/medias/([a-zA-Z0-9]+)` |

To enable a preset:
1. Click the Tana Tweaks icon
2. Toggle the switch next to the preset name

## Custom Rules

Create your own embed rules for any video platform! Each rule consists of:

- **Name** — A friendly name for the rule
- **URL Pattern** — A regex pattern to match URLs (use capture groups to extract IDs)
- **Embed Template** — HTML template with placeholders for matched values

### Placeholders

- `{{match}}` — The full regex match
- `{{match1}}`, `{{match2}}`, etc. — Capture group values

### Example: Loom Videos

| Field | Value |
|-------|-------|
| Name | Loom Videos |
| URL Pattern | `loom\.com/share/([a-zA-Z0-9]+)` |
| Embed Template | `<iframe src="https://www.loom.com/embed/{{match1}}" allowfullscreen></iframe>` |

### Example: Vimeo Videos

| Field | Value |
|-------|-------|
| Name | Vimeo Videos |
| URL Pattern | `vimeo\.com/(\d+)` |
| Embed Template | `<iframe src="https://player.vimeo.com/video/{{match1}}" allowfullscreen></iframe>` |

### Example: YouTube Videos

| Field | Value |
|-------|-------|
| Name | YouTube Videos |
| URL Pattern | `youtube\.com/watch\?v=([a-zA-Z0-9_-]+)` |
| Embed Template | `<iframe src="https://www.youtube.com/embed/{{match1}}" allowfullscreen></iframe>` |

### Tips for Creating Rules

1. **Test your regex** — Use [regex101.com](https://regex101.com) to test patterns
2. **Escape special characters** — Use `\.` for dots, `\/` for slashes
3. **Use capture groups** — Wrap the ID portion in parentheses `()` to use in template
4. **Check embed URLs** — Most platforms have a different URL for embedding vs viewing

## Architecture

The extension consists of three main components:

### 1. Background Service Worker (`background.js`)

Uses `declarativeNetRequest` to modify Tana's Content-Security-Policy headers, allowing iframes to load. This runs once on extension install and sets up a dynamic rule that:
- Intercepts responses from `app.tana.inc` (tana.pub doesn't need CSP modification)
- Adds permissive frame-src to allow embedding

### 2. Content Script (`content-script.js`)

Injected into Tana pages (`app.tana.inc` and `tana.pub`) to:
- Load and compile all enabled rules from storage
- Scan for links matching rule patterns
- Replace links with responsive iframe embeds
- Adapt DOM insertion based on the platform (app vs pub)
- Use MutationObserver to handle dynamically loaded content

### 3. Popup UI (`popup.html`, `popup.js`, `popup.css`)

Settings interface for:
- Viewing and toggling preset rules
- Managing custom rules (add, edit, delete, enable/disable)
- Real-time sync across tabs

## Development

### Prerequisites

- Chrome or Chromium-based browser
- No build step required — plain JavaScript

### File Structure

```
tana-tweaks/
├── manifest.json       # Extension manifest (MV3)
├── background.js       # Service worker for CSP modification
├── content-script.js   # DOM manipulation and video embedding
├── popup.html          # Settings UI
├── popup.js            # Settings logic & rules management
├── popup.css           # Popup styling
├── icons/              # Extension icons (16, 48, 128px)
├── README.md
└── INSTALLATION.md
```

### Adding Icons

Create an `icons/` directory with PNG files:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

Or remove the `icons` field from `manifest.json` to use Chrome's default icon.

### Testing Changes

1. Make your changes
2. Go to `chrome://extensions`
3. Click the refresh icon on the extension card
4. Reload any open Tana tabs

## Storage Schema

Settings are stored in `chrome.storage.sync`:

```json
{
  "customRules": [
    {
      "id": "preset-kinescope",
      "name": "Kinescope",
      "enabled": true,
      "isPreset": true,
      "pattern": "kinescope\\.io/(?:embed/)?([a-zA-Z0-9_-]+)",
      "embedTemplate": "<iframe src=\"https://kinescope.io/embed/{{match1}}\" allowfullscreen></iframe>"
    },
    {
      "id": "abc123",
      "name": "Loom Videos",
      "enabled": true,
      "isPreset": false,
      "pattern": "loom\\.com/share/([a-zA-Z0-9]+)",
      "embedTemplate": "<iframe src=\"https://www.loom.com/embed/{{match1}}\" allowfullscreen></iframe>"
    }
  ]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
