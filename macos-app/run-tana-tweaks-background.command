#!/bin/bash
#
# Tana Tweaks Launcher (Background Mode)
# Runs silently - check ~/Library/Logs/TanaTweaks.log for output
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$HOME/Library/Logs/TanaTweaks.log"
PID_FILE="$HOME/.tana-tweaks.pid"
DEBUG_PORT=9222

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Tana Tweaks is already running (PID: $OLD_PID)"
        echo "To stop: kill $OLD_PID"
        exit 0
    fi
fi

# Check for Node.js
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node &> /dev/null; then
    osascript -e 'display alert "Tana Tweaks" message "Node.js not found. Please install Node.js first." as critical'
    exit 1
fi

log "=========================================="
log "Tana Tweaks Starting (Background Mode)"
log "=========================================="

# Kill existing Tana without debug port
if pgrep -f "Tana.app" > /dev/null && ! pgrep -f "remote-debugging-port" > /dev/null; then
    log "Closing existing Tana..."
    pkill -f "Tana.app"
    sleep 2
fi

# Launch Tana with debugging if not running
if ! pgrep -f "remote-debugging-port" > /dev/null; then
    log "Launching Tana with debugging..."
    /Applications/Tana.app/Contents/MacOS/Tana --remote-debugging-port=$DEBUG_PORT >> "$LOG_FILE" 2>&1 &
    
    # Wait for debug port
    for i in {1..30}; do
        if curl -s "http://localhost:$DEBUG_PORT/json" > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done
    sleep 2
fi

# Start runner in background
log "Starting runner in background..."
cd "$SCRIPT_DIR"
nohup node run.js >> "$LOG_FILE" 2>&1 &
NODE_PID=$!
echo $NODE_PID > "$PID_FILE"

log "Runner started (PID: $NODE_PID)"

# Show notification
osascript -e 'display notification "Tana Tweaks is running in the background" with title "Tana Tweaks" sound name "Pop"'

echo ""
echo "✓ Tana Tweaks is now running in the background!"
echo ""
echo "  Logs: $LOG_FILE"
echo "  PID:  $NODE_PID"
echo ""
echo "To stop: kill $NODE_PID"
echo "Or run:  pkill -f 'node.*run.js'"
echo ""

# Close terminal after 3 seconds
sleep 3

