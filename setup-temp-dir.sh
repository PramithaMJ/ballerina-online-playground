#!/bin/bash

# Create the host temporary directory for Ballerina execution
# This directory will be shared between the backend container and Ballerina containers

TEMP_DIR="/tmp/ballerina-playground"

echo "Setting up temporary directory for Ballerina execution..."

# Create directory if it doesn't exist
if [ ! -d "$TEMP_DIR" ]; then
    sudo mkdir -p "$TEMP_DIR"
    echo "✓ Created directory: $TEMP_DIR"
else
    echo "✓ Directory already exists: $TEMP_DIR"
fi

# Set proper permissions (readable and writable by all)
sudo chmod 777 "$TEMP_DIR"
echo "✓ Set permissions: 777"

# Clean up old files (optional, but recommended)
echo "Cleaning up old temporary files..."
sudo find "$TEMP_DIR" -type d -mtime +1 -exec rm -rf {} + 2>/dev/null || true
echo "✓ Cleanup complete"

echo ""
echo "Temporary directory is ready!"
echo "You can now run: sudo docker-compose up --build"
