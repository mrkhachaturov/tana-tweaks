# Tana Tweaks - Build Scripts

VERSION ?= $(shell grep '"version"' manifest.json | sed 's/.*: "\(.*\)".*/\1/')
PACKAGE_NAME = tana-tweaks-v$(VERSION).zip

.PHONY: help release clean validate

help:
	@echo "Tana Tweaks Build Commands"
	@echo ""
	@echo "  make release     - Create release zip (uses version from manifest.json)"
	@echo "  make release VERSION=1.2.0 - Create release with specific version"
	@echo "  make validate    - Validate manifest and JS syntax"
	@echo "  make clean       - Remove build artifacts"
	@echo ""
	@echo "Current version: $(VERSION)"

release: validate
	@echo "Creating release package: $(PACKAGE_NAME)"
	@rm -f $(PACKAGE_NAME)
	@zip -r $(PACKAGE_NAME) . \
		-x "*.git*" \
		-x "dev/*" \
		-x "*.DS_Store" \
		-x "*.zip" \
		-x ".cursor/*" \
		-x "*.plan.md" \
		-x "Makefile" \
		-x "RELEASE.md"
	@echo "✓ Created $(PACKAGE_NAME)"
	@echo "  Size: $$(du -h $(PACKAGE_NAME) | cut -f1)"

validate:
	@echo "Validating manifest.json..."
	@node -e "JSON.parse(require('fs').readFileSync('manifest.json'))" && echo "✓ manifest.json is valid JSON"
	@echo "Checking JavaScript syntax..."
	@node --check content-script.js && echo "✓ content-script.js OK"
	@node --check background.js && echo "✓ background.js OK"
	@node --check popup.js && echo "✓ popup.js OK"

clean:
	@rm -f *.zip
	@echo "✓ Cleaned build artifacts"

