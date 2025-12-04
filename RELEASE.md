# Release Guide

This document describes how to prepare and publish releases of Tana Tweaks.

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (e.g., `1.2.3`)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Release Checklist

### 1. Update Version

Edit `manifest.json` and update the `version` field:

```json
{
  "version": "1.1.0"
}
```

### 2. Update Changelog (Optional)

If you maintain a CHANGELOG.md, add the new version with changes.

### 3. Test Locally

1. Go to `chrome://extensions`
2. Click refresh on the extension
3. Test all features:
   - [ ] Theme toggle (auto/light/dark)
   - [ ] Preset rules (enable/disable)
   - [ ] Custom rules (add/edit/delete)
   - [ ] Embedding on app.tana.inc
   - [ ] Embedding on tana.pub

### 4. Create Release Package

**Option A: Manual ZIP**

```bash
cd /path/to/tana-tweaks

# Create a clean zip excluding dev files
zip -r tana-tweaks-v1.1.0.zip . \
  -x "*.git*" \
  -x "dev/*" \
  -x "*.DS_Store" \
  -x "*.zip" \
  -x ".cursor/*" \
  -x "*.plan.md"
```

**Option B: Using the Makefile (if added)**

```bash
make release VERSION=1.1.0
```

### 5. Git Tag & Push

```bash
git add .
git commit -m "Release v1.1.0"
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin main --tags
```

### 6. GitHub Release

1. Go to your repo's **Releases** page
2. Click **Draft a new release**
3. Select the tag `v1.1.0`
4. Add release notes
5. Attach the `.zip` file
6. Click **Publish release**

## Chrome Web Store (Optional)

If publishing to the Chrome Web Store:

### Prerequisites

- Chrome Developer account ($5 one-time fee)
- 128x128 icon (already included)
- Screenshots (1280x800 or 640x400)
- Promotional images (optional)

### Steps

1. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **New Item**
3. Upload the `.zip` file
4. Fill in store listing:
   - Name: Tana Tweaks
   - Description: Enhance Tana.inc with video embeds and customizations
   - Category: Productivity
   - Language: English
5. Add screenshots
6. Submit for review (typically 1-3 days)

## Files Included in Release

The release package should contain:

```
tana-tweaks/
├── manifest.json
├── background.js
├── content-script.js
├── popup.html
├── popup.js
├── popup.css
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md
└── INSTALLATION.md
```

## Files Excluded from Release

- `dev/` — Development/legacy files
- `.git/` — Git history
- `.github/` — CI workflows (not needed in extension)
- `RELEASE.md` — This file (dev documentation)
- `*.zip` — Previous release packages

