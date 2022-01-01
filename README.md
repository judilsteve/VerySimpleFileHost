# VerySimpleFileHost

VerySimpleFileHost (VSFH) is an HTTP File Server with a web interface. VSFH is designed to be:

 - **Quick to install and completely self-contained.** VSFH maintains its own user list in a self-managed SQLite database. It does *not* integrate with local user accounts, Linux-PAM, or filesystem permissions. VSFH consists of a single runtime process.

 - **Easy to use and administrate.** Administrators can manage users from within the web interface. New users do not need to install any client software; all they need is an invite link from an administrator.

  - **Fast and lightweight.** Files are served using asynchronous I/O and low-level filesystem APIs wherever possible. Large files and \[g\]zipped collections of files can be served without allocating large memory buffers. The web client makes heavy use of code-splitting and lazy-loading for a snappy user experience.

  - **Conceptually simple.** VSFH has a very conservative feature scope. It does not have per-user file permissions, or any user hierarchy. It provides read access to a single directory, in its entirety, for all users. Curation of shared content is left to the filesystem.

  - **API driven.** VSFH is a RESTful JSON API with OpenAPI/SwaggerUI integration (available in debug builds). Don't like the included web interface? Build your own! Need automated/m2m access? Use the [OpenAPI toolkit](https://github.com/judilsteve/marvel-test/blob/master/openapi-generator-cli) to auto-generate a client API.

  - **Secure.** VSFH allows administrators to enforce frequenty changed strong passwords. All traffic is encrypted via HTTPS (with optional certificates from Let's Encrypt). In the default installation, VSFH runs in a hardened, rootless container jailed to a virtual network DMZ, and registered as a hardened, non-root systemd service.

# Features
TODO_JU Screenshots

## zxcvbn Integration
Administrators can set a minimum [zxcvbn](https://github.com/dropbox/zxcvbn) password strength for all accounts. Users receive detailed feedback and suggestions to help them create stronger passwords. Administrators can mandate regular changing of passwords, disable persistent auth cookies, and set cookie/invite link expiration times.

## Bulk Downloads
Users can download entire directories as a tarball (with optional gzip compression) or zip archive (with configurable compression level) with a single click. They can also select an arbitrary combination of files/directories at multiple levels of the share tree and download them together in a single archive.

## HTTP Range and MIME Support
Media such as audio and video can be streamed, with full support for seek operations (via HTTP range requests). Administrators can configure MIME type mappings so that files automatically open in the right application.

# Configuration

## Shared Directory
TODO_JU FilesConfiguration

## Authentication
TODO_JU AuthenticationConfiguration

## Host Binding
TODO_JU Host binding configuration

## Let's Encrypt
TODO_JU LettuceEncryptConfiguration

# Install and run
TODO_JU Test these instructions to make sure they work

## Installing as a containerised service (highly recommended)
Since VSFH is designed to be opened to the world via the internet, it is highly recommended to use the automated containerised installation, which will help protect your host system and local network in the event that VSFH or one of its dependencies is compromised.

### Prerequisites
 - A Linux distribution with a systemd init system
 - Git
 - Python >=3.3 and matching pip
 - Podman >=3.4

Running the container with Docker (instead of Podman) should also be possible. See [this repository](https://github.com/MiGoller/dc-systemd-template) for reasonable service file templates that you can use.

### Instructions
1. Clone this repository to an appropriate directory
```bash
cd /tmp
git clone https://github.com/judilsteve/VerySimpleFileHost.git`
```

2. Follow the instructions in the [Configuration](#configuration) section to configure VSFH.

3. Run `install.sh` (after first marking it as executable) and follow the prompts
```bash
chmod +x ./VerySimpleFileHost/install.sh
./VerySimpleFileHost/install.sh
```

### Exposing VSFH to the internet
You will likely need to forward VSFH's HTTPS listen port to 443 and its HTTP listen port to 80. Instructions for this will be specific to your chosen firewall/router. Forwarding to other ports is possible, but you will lose the ability to use Let's Encrypt certificates, since Let's Encrypt's challenge schemes require VSFH to listen on ports 80 and 443.

### Updating the configuration
Make your changes to the configuration files in your chosen installation directory, then restart the service:
```bash
sudo systemctl restart vsfh
```

### "Help, I locked myself out of my administrator account!"
TODO_JU Recovery instructions

### Updating VSFH
Run `git pull` in your chosen installation directory to update to the latest version.
Then, restart the service:
```bash
sudo systemctl restart vsfh
```

## Installing on bare metal
Only sparse and minimal instruction is provided here. This is to discourage you from installing VSFH on bare metal. Especially if you plan to expose VSFH to the internet, you should make sure that you are installing on a bastion host in a DMZ. If you don't know what either of those terms mean, please turn away now.

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

5. Put your [config files](#Configuration) in `vsfh-server/build`

6. Run
```bash
./vsfh-server/build/VerySimpleFileHost
```

# Disclaimer
Although all care has been taken to make VSFH as secure as possible, it has not been independently audited for vulnerabilities. You run VSFH (and expose it to the internet) at your own risk.