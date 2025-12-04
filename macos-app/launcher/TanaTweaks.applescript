-- Tana Tweaks Launcher (Background Mode)
-- Launches Tana with video embed support, runs silently in background

on run
    set projectPath to "/Volumes/storage/01_Projects/tana-extension/macos-app"
    set commandPath to projectPath & "/run-tana-tweaks-background.command"
    
    -- Check if command file exists
    try
        do shell script "test -f " & quoted form of commandPath
    on error
        display alert "Tana Tweaks" message "Could not find launcher script at:
" & commandPath & "

Please make sure the tana-extension project is at the expected location." as critical
        return
    end try
    
    -- Run in background (Terminal will close automatically)
    tell application "Terminal"
        activate
        do script commandPath
    end tell
end run
