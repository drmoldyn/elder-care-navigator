#!/bin/bash

# This script sets up geocoding to run in the background using macOS LaunchAgent
# It will automatically restart if it crashes and keep running until all facilities are geocoded

PROJECT_DIR="/Users/dtemp/Desktop/nonnie-world"
LAUNCH_AGENT_PLIST="$HOME/Library/LaunchAgents/com.nonnieworld.geocoding.plist"
LOG_DIR="$HOME/Library/Logs/nonnie-world"

echo "🚀 Setting up background geocoding service"
echo "=========================================="
echo ""

# Create log directory
mkdir -p "$LOG_DIR"

# Create the LaunchAgent plist
cat > "$LAUNCH_AGENT_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.nonnieworld.geocoding</string>

    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$PROJECT_DIR/scripts/geocode-continuous.sh</string>
    </array>

    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>

    <key>StandardOutPath</key>
    <string>$LOG_DIR/geocoding.log</string>

    <key>StandardErrorPath</key>
    <string>$LOG_DIR/geocoding-error.log</string>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>

    <key>ThrottleInterval</key>
    <integer>60</integer>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.nvm/versions/node/v22.11.0/bin</string>
    </dict>
</dict>
</plist>
EOF

echo "✅ Created LaunchAgent plist: $LAUNCH_AGENT_PLIST"
echo ""

# Make the geocode-continuous.sh executable
chmod +x "$PROJECT_DIR/scripts/geocode-continuous.sh"
chmod +x "$PROJECT_DIR/scripts/geocode-facilities.ts"

echo "✅ Made scripts executable"
echo ""

echo "📝 To start the background service, run:"
echo ""
echo "   launchctl load $LAUNCH_AGENT_PLIST"
echo ""
echo "📝 To stop the background service, run:"
echo ""
echo "   launchctl unload $LAUNCH_AGENT_PLIST"
echo ""
echo "📝 To check if it's running:"
echo ""
echo "   launchctl list | grep nonnieworld"
echo ""
echo "📝 To view logs:"
echo ""
echo "   tail -f $LOG_DIR/geocoding.log"
echo ""
echo "⚠️  Note: LaunchAgents don't run during sleep mode."
echo "   To prevent sleep while geocoding runs, use:"
echo ""
echo "   caffeinate -s"
echo ""
echo "   Or keep your Mac plugged in and set 'Prevent automatic sleeping"
echo "   when the display is off' in System Settings > Battery > Power Adapter"
echo ""
