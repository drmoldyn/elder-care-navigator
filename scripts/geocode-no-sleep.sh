#!/bin/bash

# Run geocoding continuously and prevent Mac from sleeping
# This uses macOS 'caffeinate' command to keep the system awake

echo "☕ Starting geocoding with sleep prevention"
echo "=========================================="
echo ""
echo "Your Mac will NOT sleep while this runs."
echo "Press Ctrl+C to stop and allow sleep again."
echo ""

# Run the continuous geocoding script with caffeinate
# -i: Prevent system idle sleep
# -s: Prevent system sleep (even when closing lid on battery)
caffeinate -is bash scripts/geocode-continuous.sh
