# VerySimpleFileHost

VerySimpleFileHost (VSFH) is a RESTful HTTP File Server with a web interface. VSFH is designed to be:

 - **Quick to install and completely self-contained.** VSFH does *not* integrate with local user accounts, Linux-PAM, or filesystem permissions; instead it maintains its own set of users in a simple SQLite database which it manages by itself. At runtime, it consists of a single process.

 - **Easy to use and administrate.** Administrators can manage users from within the web interface. New users do not need to install any client software; all they need to get up and running is an invite link from an administrator.

  - **Fast and lightweight.** Files are served using asynchronous I/O and near-direct file-system access wherever possible. Large files and \[g\]zipped collections of files do not require large amounts of memory for buffering. The web frontend makes heavy use of code-splitting, tree-pruning, and bundle minification/optimisation to ensure a snappy experience for end-users.

  - **Conceptually simple.** VSFH is very conservative in its feature scope. It does not have a complicated per-user file permission system, or a hierarchical group system for managing users. It provides read access to a single directory, in its entirety, to all of its users. Curation of shared content is left to the filesystem.

  - **API driven.** VSFH is a RESTful JSON API with OpenAPI and Swagger UI integration (available in debug builds only). Don't like the included web interface? Build your own! Need to interact with a VSFH for automation/machine-to-machine purposes? No worries! Use the [OpenAPI toolkit](https://github.com/judilsteve/marvel-test/blob/master/openapi-generator-cli) to get up and running quickly with an auto-generated API client in your chosen language.

  - **Secure.** VSFH has configuration options that allow administrators to enforce the use (and frequent change of) strong passwords. It encrypts all traffic via HTTPS (with optional certificates from Let's Encrypt). In the default installation configuration, VSFH runs as a hardened, non-root systemd service inside a hardened rootless container. Thus, VSFH is jailed behind multiple redundant layers of attack protection and confined to an extremely restrictive bastion container with a networking configuration that emulates a demilitarised-zone (DMZ) in software.

# Features
TODO_JU Screenshots

## zxcvbn Integration
Administrators can set a minimum [zxcvbn](https://github.com/dropbox/zxcvbn) password strength for all accounts. User passwords are evaluated in realtime, with detailed feedback and suggestions to help them create stronger passwords. For additional security, administrators can set password expiry intervals to mandate regular changing of passwords, disable persistent auth cookies, and set cookie/invite link expiration times.

## Bulk Downloads
Users can download entire directories as a tarball (with optional gzip compression) or zip archive (with configurable compression level) with a single click. Users can also select an arbitrary combination of files/directories at multiple levels of the share tree and download them all at once in a single archive. Bulk downloads do not need to be buffered in memory on either the client or server, making it possible to download archives of arbitrary size.

## HTTP Range and MIME Support
For single file downloads, media such as audio and video can be streamed with full support for seek operations. Administrators can configure MIME type mappings so that files will be opened with appropriate applications, where they are installed on the client.  

# Configuration

## Shared Directory
TODO_JU FilesConfiguration

## Authentication
TODO_JU AuthenticationConfiguration

## Host Binding

## Let's Encrypt
TODO_JU LettuceEncryptConfiguration

# Installation

## Installing as a containerised service (highly recommended)
As VSFH is designed to be opened to the world via the internet, it is highly recommended to use the automated containerised installation, which will help protect your host system and local network in the event that VSFH or one of its dependencies is compromised.

### Prerequisites
 - A Linux distribution with a systemd init system
 - Python >=3.3 and matching pip
 - Podman >=3.4
 - Git

Running the container with Docker (instead of Podman) should also be possible. See [this repository](https://github.com/MiGoller/dc-systemd-template) for reasonable service file templates that you can use.

### Instructions
TODO_JU Audit these and make sure they work

1. Clone this repository to an appropriate directory
```bash
cd /tmp
git clone https://github.com/judilsteve/VerySimpleFileHost.git`
```

TODO_JU Configuration

2. Run `install.sh` (after first marking it as executable)
```bash
chmod +x ./VerySimpleFileHost/install.sh
./VerySimpleFileHost/install.sh
```

## Installing on bare metal
Only sparse and minimal instruction will be provided here. This is deliberate; to discourage you from installing VSFH on bare metal. Especially if you plan to face VSFH to the internet, you should make sure that you are installing on a bastion host in a DMZ. If you don't know what either of those terms mean, turn away now.

### Prerequisites
- Node v16 and matching npm
- dotnet SDK 6.0

### Instructions

1. Clone this repository to an appropriate directory

2. Build the server
```bash
cd vsfh-server
dotnet restore
dotnet publish -c Release -o build
```

3. Build the client
```bash
cd ../vsfh-client
npm install --dev
npm run build
```

4. Copy client build output to server's static files directory
```bash
cd ..
mkdir vsfh-server/build/wwwroot
cp vsfh-client/build/* vsfh-server/build/wwwroot
```

5. Run
```bash
./vsfh-server/build/VerySimpleFileHost
```

# Disclaimer
TODO_JU