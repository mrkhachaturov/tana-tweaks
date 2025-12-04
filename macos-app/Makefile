# Tana Tweaks - macOS App Makefile

.PHONY: install run run-bg stop status logs clean build help

# Default target
help:
	@echo "Tana Tweaks - macOS App"
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  install    Install Node.js dependencies"
	@echo "  run        Run Tana with Tweaks (Terminal stays open)"
	@echo "  run-bg     Run Tana with Tweaks in background"
	@echo "  stop       Stop all Tana Tweaks processes"
	@echo "  status     Check if Tana Tweaks is running"
	@echo "  logs       View logs (follow mode)"
	@echo "  logs-tail  View last 50 log lines"
	@echo "  clean      Remove logs and PID file"
	@echo "  build      Rebuild the macOS app bundle"
	@echo ""

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install
	@echo "Done!"

# Run with Terminal open
run:
	@./run-tana-tweaks.command

# Run in background
run-bg:
	@./run-tana-tweaks-background.command

# Stop all processes
stop:
	@echo "Stopping Tana Tweaks..."
	@-pkill -f "node.*run.js" 2>/dev/null && echo "✓ Stopped runner" || echo "• Runner not running"
	@-rm -f ~/.tana-tweaks.pid
	@echo ""
	@read -p "Also quit Tana? (y/N) " ans && [ "$$ans" = "y" ] && pkill -f "Tana.app" && echo "✓ Quit Tana" || true

# Check status
status:
	@echo "=== Tana Tweaks Status ==="
	@echo ""
	@if pgrep -f "node.*run.js" > /dev/null; then \
		echo "Runner:  ✓ Running (PID: $$(pgrep -f 'node.*run.js'))"; \
	else \
		echo "Runner:  ✗ Not running"; \
	fi
	@if pgrep -f "Tana.app.*remote-debugging" > /dev/null; then \
		echo "Tana:    ✓ Running with debugging"; \
	elif pgrep -f "Tana.app" > /dev/null; then \
		echo "Tana:    ⚠ Running WITHOUT debugging (restart needed)"; \
	else \
		echo "Tana:    ✗ Not running"; \
	fi
	@echo ""

# View logs (follow mode)
logs:
	@if [ -f ~/Library/Logs/TanaTweaks.log ]; then \
		tail -f ~/Library/Logs/TanaTweaks.log; \
	else \
		echo "No log file found. Run Tana Tweaks first."; \
	fi

# View last 50 lines
logs-tail:
	@if [ -f ~/Library/Logs/TanaTweaks.log ]; then \
		tail -50 ~/Library/Logs/TanaTweaks.log; \
	else \
		echo "No log file found."; \
	fi

# Clean up
clean:
	@echo "Cleaning up..."
	@-rm -f ~/Library/Logs/TanaTweaks.log
	@-rm -f ~/.tana-tweaks.pid
	@echo "Done!"

# Rebuild the app bundle
build:
	@echo "Building Tana Tweaks.app..."
	@cd launcher && osacompile -o "Tana Tweaks.app" TanaTweaks.applescript
	@echo "Done! App at: launcher/Tana Tweaks.app"

