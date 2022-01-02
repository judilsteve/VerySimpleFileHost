#!/bin/bash
set -e

if [ "$(whoami)" != "root" ]; then
    echo -e "${RED}This script must be run as root. Try again with 'sudo $0'${NC}"
    exit 1
fi

su -m vsfh -c podman exec -ti vsfh --create-admin-account
