#!/bin/bash
#
# Tana Tweaks Launcher
# Double-click this file to launch Tana with video embed support
#

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$HOME/Library/Logs/TanaTweaks.log"
DEBUG_PORT=9222

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cleanup() {
    log "Cleaning up..."
    # Kill the node runner if it's running
    if [ -n "$NODE_PID" ] && kill -0 "$NODE_PID" 2>/dev/null; then
        kill "$NODE_PID" 2>/dev/null || true
    fi
}

trap cleanup EXIT

log "=========================================="
log "Tana Tweaks Launcher Starting"
log "=========================================="

# Check for Node.js
if ! command -v node &> /dev/null; then
    # Try common Node.js paths
    for NODE_PATH in /usr/local/bin/node /opt/homebrew/bin/node ~/.nvm/current/bin/node; do
        if [ -x "$NODE_PATH" ]; then
            export PATH="$(dirname "$NODE_PATH"):$PATH"
            break
        fi
    done
fi

if ! command -v node &> /dev/null; then
    log "ERROR: Node.js not found. Please install Node.js first."
    echo ""
    echo "Install Node.js from: https://nodejs.org/"
    echo "Or via Homebrew: brew install node"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

log "Node.js found: $(which node) ($(node --version))"

# Check if ws module is installed
if [ ! -d "$SCRIPT_DIR/node_modules/ws" ]; then
    log "Installing required dependencies..."
    cd "$SCRIPT_DIR"
    npm install ws --save 2>&1 | tee -a "$LOG_FILE"
fi

# Check if Tana is already running
if pgrep -f "Tana.app.*--remote-debugging-port" > /dev/null; then
    log "Tana is already running with debugging enabled"
else
    # Kill any existing Tana without debug port
    if pgrep -f "Tana.app" > /dev/null; then
        log "Closing existing Tana instance..."
        pkill -f "Tana.app" 2>/dev/null || true
        sleep 2
    fi
    
    log "Launching Tana with remote debugging on port $DEBUG_PORT..."
    /Applications/Tana.app/Contents/MacOS/Tana --remote-debugging-port=$DEBUG_PORT &
    
    # Wait for Tana to start
    log "Waiting for Tana to initialize..."
    for i in {1..30}; do
        if curl -s "http://localhost:$DEBUG_PORT/json" > /dev/null 2>&1; then
            log "Tana debug port is ready"
            break
        fi
        sleep 1
    done
fi

# Additional wait for app to fully load
sleep 3

# Start the Tweaks runner
log "Starting Tana Tweaks runner..."
cd "$SCRIPT_DIR"
node run.js 2>&1 | tee -a "$LOG_FILE" &
NODE_PID=$!

log "Tana Tweaks is now active (runner PID: $NODE_PID)"
log ""
log "Keep this window open while using Tana."
log "Close this window or press Ctrl+C to stop."
log ""

# Wait for the node process
wait $NODE_PID

