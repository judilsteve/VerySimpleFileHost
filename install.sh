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

# TODO_JU Interactive prompt to set up env vars (listen ports and share directory) if not already present

# Create default config file
# TODO_JU Only do this if there isn't already a config file here
cp ./vsfh-server/appsettings.Default.json ./vsfh-server/appsettings.json

./scripts/new-admin-account.sh

# Install service file and start service
cp vsfh.service /etc/systemd/system
systemctl enable vsfh
systemctl start vsfh

echo ${GREEN}Installation successful. VSFH is now live at https://localhost:$HTTPS_PORT/${NC}
