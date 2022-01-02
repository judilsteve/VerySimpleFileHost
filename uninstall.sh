#!/bin/bash
set -e

if [ "$(whoami)" != "root" ]; then
    echo -e "${RED}This script must be run as root. Try again with 'sudo $0'${NC}"
    exit 1
fi

# TODO_JU Interactive prompt asking whether user wants to keep config files

systemctl stop vsfh
systemctl disable vsfh
rm /etc/systemd/system/vsfh.service

# TODO_JU Conditionally delete everything except config files
