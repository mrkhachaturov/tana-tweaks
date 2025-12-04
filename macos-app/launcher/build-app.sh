#!/bin/bash
# Rebuild the Tana Tweaks.app from the AppleScript source

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building Tana Tweaks.app..."
osacompile -o "Tana Tweaks.app" TanaTweaks.applescript

if [ $? -eq 0 ]; then
    echo "Done! App created at: $SCRIPT_DIR/Tana Tweaks.app"
    echo ""
    echo "To install, drag 'Tana Tweaks.app' to your Applications folder."
else
    echo "Build failed!"
    exit 1
fi

