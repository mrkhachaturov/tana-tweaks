# Installation Guide

## Installing from Source (Developer Mode)

### Step 1: Download the Extension

**Option A: Clone the repository**
```bash
git clone https://github.com/mrkhachaturov/tana-tweaks.git
```

**Option B: Download ZIP**
1. Click the green "Code" button on GitHub
2. Select "Download ZIP"
3. Extract to a folder you'll remember

### Step 2: Load in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the folder containing `manifest.json`
5. The extension should now appear in your extensions list

### Step 3: Enable Presets

The extension ships with presets for popular video platforms (Kinescope, VK Video, Wistia), all disabled by default.

1. Click the **Tana Tweaks** extension icon in Chrome's toolbar
2. Toggle the switch next to any preset you want to enable
3. Settings are saved immediately

### Step 4: Test It

1. Open [Tana](https://app.tana.inc) or a [Tana.pub](https://tana.pub) page
2. Paste a link for an enabled platform (e.g., `https://kinescope.io/abc123`)
3. The link should automatically convert to an embedded video player

## Adding Custom Rules

You can add rules to embed videos from any platform not covered by presets:

### Step 1: Open Settings

Click the Tana Tweaks icon in your browser toolbar.

### Step 2: Click "Add Custom Rule"

Click the "+ Add Custom Rule" button below the preset rules.

### Step 3: Fill in the Form

| Field | Description | Example |
|-------|-------------|---------|
| Rule Name | A friendly name | "Loom Videos" |
| URL Pattern | Regex to match URLs | `loom\.com/share/([a-zA-Z0-9]+)` |
| Embed Template | HTML with placeholders | `<iframe src="https://www.loom.com/embed/{{match1}}" allowfullscreen></iframe>` |

### Step 4: Save and Test

1. Click "Save Rule"
2. The rule is automatically enabled
3. Open Tana and paste a matching URL
4. The video should automatically embed

### Template Placeholders

- `{{match}}` — The full regex match
- `{{match1}}` — First capture group (usually the video ID)
- `{{match2}}`, `{{match3}}`, etc. — Additional capture groups

### Quick Examples

**Loom:**
```
Pattern: loom\.com/share/([a-zA-Z0-9]+)
Template: <iframe src="https://www.loom.com/embed/{{match1}}" allowfullscreen></iframe>
```

**Vimeo:**
```
Pattern: vimeo\.com/(\d+)
Template: <iframe src="https://player.vimeo.com/video/{{match1}}" allowfullscreen></iframe>
```

**YouTube:**
```
Pattern: youtube\.com/watch\?v=([a-zA-Z0-9_-]+)
Template: <iframe src="https://www.youtube.com/embed/{{match1}}" allowfullscreen></iframe>
```

## Managing Rules

### Enable/Disable Rules

Toggle the switch next to any rule (preset or custom) to enable or disable it.

### Edit Custom Rules

Click the ✎ (edit) button on any custom rule to modify its settings.

### Delete Custom Rules

Click the × (delete) button on any custom rule to remove it. Note: Preset rules cannot be deleted, only disabled.

## Updating the Extension

1. Pull the latest changes or download the new version
2. Go to `chrome://extensions`
3. Click the refresh icon (↻) on the extension card
4. Reload any open Tana tabs

## Troubleshooting

### Video not embedding?

1. **Check the rule is enabled** — Make sure the toggle is on
2. **Check the console**: Right-click → Inspect → Console. Look for `[Tana Tweaks] Extension Active`
3. **Verify the pattern**: Use [regex101.com](https://regex101.com) to test your regex
4. **Reload the extension**: Go to `chrome://extensions` and click refresh

### Custom rule not working?

1. **Check regex escaping**: Dots need `\.`, slashes need `\/`
2. **Verify capture groups**: Use parentheses `()` around the ID portion
3. **Check embed URL**: The embed URL is often different from the share URL
4. **CSP issues**: Some platforms may be blocked by Tana's CSP (only affects app.tana.inc)

### Extension not loading?

1. Ensure `manifest.json` exists in the root folder
2. Check for JSON syntax errors in manifest
3. Verify Developer mode is enabled

### Coming from Tampermonkey?

If you were using the Tampermonkey userscript:

1. **Disable or remove** the Tampermonkey script to avoid conflicts
2. The Chrome extension handles everything — no Tampermonkey needed
3. Enable the Kinescope preset to match the original behavior

### Migration from Previous Version

If you're upgrading from an older version with the built-in Kinescope toggle:
- Your settings will be automatically migrated
- If Kinescope was enabled, the Kinescope preset will be enabled
- Your custom rules will be preserved

## Uninstalling

1. Go to `chrome://extensions`
2. Find "Tana Tweaks"
3. Click **Remove**
4. Confirm removal

## Browser Compatibility

| Browser | Supported |
|---------|-----------|
| Chrome | ✅ |
| Edge | ✅ |
| Brave | ✅ |
| Opera | ✅ |
| Firefox | ❌ (MV3 differences) |
| Safari | ❌ |
