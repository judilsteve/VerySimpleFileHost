#!/bin/bash
set -e

# Check that git is installed
if ! command -v git &>/dev/null
then
    echo "git could not be found. Ensure it is installed and available on PATH"
    exit 1
fi

# Clone the repo
git clone https://github.com/judilsteve/VerySimpleFileHost.git

cd VerySimpleFileHost

# Make sure install script is executable
chmod +x install.sh

./install.sh

# Clean up
cd ..
rm -rf VerySimpleFileHost
