#!/bin/bash
set -e

if [ "$(whoami)" != "root" ]; then
    echo -e "${RED}This script must be run as root. Try again with 'sudo $0'${NC}"
    exit 1
fi

echo -n "Keep your config files [Y/n]?"
read -r KEEP_CONFIG_FILES_RESPONSE
KEEP_CONFIG_FILES=[[ $KEEP_CONFIG_FILES_RESPONSE =~ [yY](es)* ]]

systemctl stop vsfh
systemctl disable vsfh
rm /etc/systemd/system/vsfh.service

# TODO_JU Conditionally delete everything except config files
