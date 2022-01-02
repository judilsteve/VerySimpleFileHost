#!/bin/bash
set -e

if [ "$(whoami)" != "root" ]; then
    echo -e "${RED}This script must be run as root. Try again with 'sudo $0'${NC}"
    exit 1
fi

./scripts/check-dependencies.sh

./pull-base-images.sh

INSTALL_DIR=/usr/bin/vsfh

# Copy files to install directory
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
mkdir -p $INSTALL_DIR
cp -R $SCRIPT_DIR/* $INSTALL_DIR

# Create VSFH user
useradd -m -s /sbin/nologin vsfh

# Create venv and install podman-compose in it
cd $INSTALL_DIR
python3 -m venv $INSTALL_DIR/.venv
./.venv/bin/pip3 install -r requirements.txt

CONFIG_DIR=/etc/vsfh
mkdir -p $CONFIG_DIR

# TODO_JU Validation for these
DEFAULT_HTTP_PORT=80
echo -n "Which port should VSFH listen on for HTTP connections [$DEFAULT_HTTP_PORT]?"
read -r HTTP_PORT
HTTP_PORT=${HTTP_PORT:-$DEFAULT_HTTP_PORT}
echo "VSFH_HTTP_PORT=$HTTP_PORT" >> $CONFIG_DIR/.env

DEFAULT_HTTPS_PORT=443
echo -n "Which port should VSFH listen on for HTTPS connections [$DEFAULT_HTTPS_PORT]?"
read -r HTTPS_PORT
HTTPS_PORT=${HTTPS_PORT:-$DEFAULT_HTTPS_PORT}
echo "VSFH_HTTPS_PORT=$HTTPS_PORT" >> $CONFIG_DIR/.env

echo -n "Which directory should VSFH share to its users?"
read -r SHARE_DIRECTORY
echo "VSFH_SHARE_DIRECTORY=$SHARE_DIRECTORY" >> $CONFIG_DIR/.env

# Install default config file if no config file present
cp -n ./vsfh-server/appsettings.Default.json /etc/vsfh/appsettings.json || true

mkdir -p /var/lib/vsfh

./scripts/new-admin-account.sh

# Install service file and start service
cp vsfh.service /etc/systemd/system
systemctl enable vsfh
systemctl start vsfh

echo ${GREEN}Installation successful. VSFH is now live at https://localhost:$HTTPS_PORT/${NC}
