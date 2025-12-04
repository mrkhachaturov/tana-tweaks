#!/bin/bash
#
# View Tana Tweaks logs
#

LOG_FILE="$HOME/Library/Logs/TanaTweaks.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "No log file found at: $LOG_FILE"
    echo "Run Tana Tweaks first to generate logs."
    read -p "Press Enter to exit..."
    exit 0
fi

echo "=== Tana Tweaks Logs ==="
echo "Log file: $LOG_FILE"
echo ""
echo "Showing last 50 lines (press Ctrl+C to exit follow mode):"
echo "=========================================="
echo ""

tail -50 "$LOG_FILE"

echo ""
echo "=========================================="
echo "Following new entries... (Ctrl+C to stop)"
echo ""

tail -f "$LOG_FILE"

