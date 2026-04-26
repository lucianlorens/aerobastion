#!/usr/bin/env bash
set -euo pipefail

echo "Installing Docker Compose CLI plugin..."

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64)
    BIN=linux-x86_64
    ;;
  aarch64|arm64)
    BIN=linux-aarch64
    ;;
  *)
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

PLUGIN_DIR="/usr/local/lib/docker/cli-plugins"
PLUGIN_PATH="$PLUGIN_DIR/docker-compose"

echo "Architecture detected: $ARCH -> $BIN"
echo "Plugin dir: $PLUGIN_DIR"

sudo mkdir -p "$PLUGIN_DIR"

URL="https://github.com/docker/compose/releases/latest/download/docker-compose-${BIN}"
echo "Downloading docker compose from: $URL"
sudo curl -fsSL "$URL" -o "$PLUGIN_PATH"
sudo chmod +x "$PLUGIN_PATH"

echo "Installed plugin to $PLUGIN_PATH"
echo "Verifying..."
if docker compose version >/dev/null 2>&1; then
  echo "docker compose is installed successfully:"
  docker compose version
else
  echo "Installation completed but 'docker compose' command failed."
  echo "Listing plugin dir contents:"
  ls -la "$PLUGIN_DIR"
  exit 1
fi

echo "Done. You may need to log out and log in again if your shell caches PATH or docker context." 
