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
# TODO_JU Check that python version is >=3.3 (required for venv)

check_command pip3
check_command systemctl
check_command podman
# TODO_JU Check that podman version is >=3.4 (readme for podman-compose mentions this as a requirement)
