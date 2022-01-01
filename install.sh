#!/bin/bash

if [ "$(whoami)" != "root" ]; then
  echo -e "${RED}This script must be run as root. Try again with 'sudo $0'${NC}"
  exit 1
fi

function check_command() {
  if ! command -v $1 &>/dev/null
  then
    echo "$1 could not be found. Ensure it is installed and available on root's PATH"
    exit 1
  fi
}

check_command python3
# TODO_JU Check that python version is >=3.3 (required for venv)

check_command pip3
check_command systemd
check_command podman
# TODO_JU Check that podman version is >=3.4 (readme for podman-compose mentions this as a requirement)

INSTALL_DIR=/usr/bin/vsfh

# Copy files to /usr/bin
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
mkdir -p $INSTALL_DIR
cp -R $SCRIPT_DIR/* $INSTALL_DIR

# Create VSFH user
useradd -m -s /sbin/nologin vsfh

# Create venv and install podman-compose
cd $INSTALL_DIR
python3 -m venv $INSTALL_DIR/.venv
$INSTALL_DIR/.venv/bin/pip3 install 'podman-compose~=1.0.3'

# TODO_JU Interactive prompt to set up first admin user

# TODO_JU Configure and install service file
