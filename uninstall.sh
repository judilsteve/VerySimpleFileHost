#!/bin/bash
set -e

if [ "$(whoami)" != "root" ]; then
    echo -e "${RED}This script must be run as root. Try again with 'sudo $0'${NC}"
    exit 1
fi

CONFIG_FILE_DIR=/etc/vsfh
echo -n "Keep your config files [Y/n]?"
read -r KEEP_CONFIG_FILES_RESPONSE
if [[ $KEEP_CONFIG_FILES_RESPONSE =~ [yY](es)* ]]; then
    echo "Your config files will continue to exist at $CONFIG_FILE_DIR"
elif
    rm -rf $CONFIG_FILE_DIR
fi

DATABASE_DIR=/var/lib/vsfh
echo -n "Keep your user database [Y/n]?"
read -r KEEP_USER_DATABASE_RESPONSE
if [[ $KEEP_USER_DATABASE_RESPONSE =~ [yY](es)* ]]; then
    echo "Your database will continue to exist at $DATABASE_DIR"
elif
    rm -rf $DATABASE_DIR
fi

systemctl stop vsfh
systemctl disable vsfh
rm /etc/systemd/system/vsfh.service

rm -rf /usr/bin/vsfh

echo ${GREEN}Uninstallation successful${NC}
