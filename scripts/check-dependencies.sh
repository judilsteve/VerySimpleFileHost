#!/bin/bash
set -e

function check_command() {
    if ! command -v $1 &>/dev/null
    then
        echo "$1 could not be found. Ensure it is installed and available on root's PATH"
        exit 1
    fi
}

check_command python3

# Required for venv support
if [ `python3 -c"import sys; print(sys.version_info.minor)"` -lt 3 ]; then
    echo "VSFH requires Python3 >=3.3"
    exit 1
fi

check_command pip3
check_command systemctl
check_command podman

# Readme for podman-compose mentions this version as a minimum requirement
PODMAN_VERSION=`podman version --format '{{.Client.Version}}'`
PODMAN_VERSION_MAJOR="${PODMAN_VERSION%%\.*}"
PODMAN_VERSION_MINOR="${PODMAN_VERSION#*.}"
if [ $PODMAN_VERSION_MAJOR -lt 3 || $PODMAN_VERSION_MINOR -lt 4 ]; then
    echo "VSFH requires Podman >=3.4"
    exit 1
fi
