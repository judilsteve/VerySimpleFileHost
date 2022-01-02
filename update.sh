#!/bin/bash
set -e

./check-dependencies.sh

if ! command -v git &>/dev/null
then
    echo "git could not be found. Ensure it is installed and available on PATH"
    exit 1
fi

# Ensure we have the latest source
if [[ `git rev-list HEAD..origin/main --count` != "0" ]]; then
    git pull
    # Restart this script in case it changed after the pull
    ./update.sh
    exit 0
fi

if [ "$(whoami)" != "root" ]; then
    echo -e "${RED}This script must be run as root. Try again with 'sudo $0'${NC}"
    exit 1
fi

# Update podman-compose
.venv/bin/pip3 install --upgrade -r requirements.txt

# Install new service file
cp vsfh.service /etc/systemd/system

# Load new version of service file
systemctl daemon-reload

# Restart VSFH
systemctl restart vsfh

echo ${GREEN}Update successful${NC}
