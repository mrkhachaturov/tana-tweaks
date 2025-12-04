#!/bin/bash
#
# Stop Tana Tweaks
# Kills the runner process and optionally Tana itself
#

echo "Stopping Tana Tweaks..."

# Kill node runner
if pgrep -f "node.*run.js" > /dev/null; then
    pkill -f "node.*run.js"
    echo "✓ Stopped Tana Tweaks runner"
else
    echo "• Runner was not running"
fi

# Ask about Tana
echo ""
read -p "Also quit Tana? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if pgrep -f "Tana.app" > /dev/null; then
        pkill -f "Tana.app"
        echo "✓ Quit Tana"
    else
        echo "• Tana was not running"
    fi
fi

echo ""
echo "Done!"

