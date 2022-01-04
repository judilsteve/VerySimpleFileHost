# VerySimpleFileHost
VerySimpleFileHost (VSFH) is an HTTP File Server with a web interface. VSFH is designed to be:

 - **Quick to install and completely self-contained.** VSFH maintains its own user list in a self-managed SQLite database. It does *not* integrate with local user accounts, Linux-PAM, or filesystem permissions. VSFH consists of a single runtime process.

 - **Easy to use and administrate.** Administrators can manage users from within the web interface. New users do not need to install any client software; all they need is an invite link from an administrator.

  - **Fast and lightweight.** Files are served using asynchronous I/O and low-level filesystem APIs wherever possible. Large files and \[g\]zipped collections of files can be served without allocating large memory buffers. The web client makes heavy use of code-splitting and lazy-loading for a snappy user experience.

  - **Conceptually simple.** VSFH has a very conservative feature scope. It does not have per-user file permissions, or any user hierarchy. It provides read access to a single directory, in its entirety, for all users. Curation of shared content is left to the filesystem.

  - **API driven.** VSFH is a RESTful JSON API with OpenAPI/SwaggerUI integration (available in debug builds). Don't like the included web interface? Build your own! Need automated/m2m access? Use the [OpenAPI toolkit](https://github.com/OpenAPITools/openapi-generator-cli) to auto-generate a client API.

  - **Secure.** VSFH allows administrators to enforce frequenty changed strong passwords. All traffic is encrypted via HTTPS (with optional certificates from Let's Encrypt). A [deployment template](https://github.com/judilsteve/vsfh-podman) is available to run VSFH in a hardened, rootless container jailed to a virtual network DMZ.

# Features
TODO_JU Screenshots

## zxcvbn Integration
Administrators can set a minimum [zxcvbn](https://github.com/dropbox/zxcvbn) password strength for all accounts. Users receive detailed feedback and suggestions to help them create stronger passwords. Administrators can mandate regular changing of passwords, disable persistent auth cookies, and set cookie/invite link expiration times.

## Bulk Downloads
Users can download entire directories as a tarball (with optional gzip compression) or zip archive (with configurable compression level) with a single click. They can also select an arbitrary combination of files/directories at multiple levels of the share tree and download them together in a single archive.

## HTTP Range and MIME Support
Media such as audio and video can be streamed, with full support for seek operations (via HTTP range requests). Administrators can configure MIME type mappings so that files automatically open in the right application.

# Install and Run
TODO_JU Test these instructions to make sure they work

If you intend to deploy on shared infrastructure (e.g. if the machine that will be running VSFH has other duties or has access to your local network) and especially if you intend to expose VSFH to the internet, [containerised deployment](https://github.com/judilsteve/vsfh-podman) is highly recommended.

Bare metal deployment instructions are provided below, but this deployment pattern is only recommended for use inside a trusted network behind a firewall, or in a well-isolated hosting environment (e.g. a cloud VPS, or a bastion host in a DMZ).

## Prerequisites
- Node v16 and matching npm\*
- dotnet SDK 6.0

\* At the time of writing, Node v17 appears to have issues with installing dependencies. Consider using [nvm](https://github.com/nvm-sh/nvm) if you need to maintain multiple Node installations.

## Instructions

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

5. Create an `appsettings.json` file with your desired [configuration](#Configuration) in `vsfh-server/build`

6. Run
```bash
./vsfh-server/build/VerySimpleFileHost
```

## "Help, I locked myself out of my administrator account!"
Run the following in your terminal:
```bash
./vsfh-server/build/VerySimpleFileHost --create-admin-account
```
and follow the prompts.

## Exposing VSFH to the Internet
You will likely need to forward VSFH's HTTPS listen port to 443 and its HTTP listen port to 80. Instructions for this will be specific to your chosen firewall/router. Forwarding to other ports is possible, but you will lose the ability to use Let's Encrypt certificates, since Let's Encrypt's challenge schemes require VSFH to listen on ports 80 and 443.

# Configuration
All configuration lives in `./vsfh-server/build/VerySimpleFileHost/appsettings.json`. Use [`appsettings.Default.json`](https://github.com/judilsteve/VerySimpleFileHost/blob/main/vsfh-server/appsettings.Default.json) as a reference for building your configuration.

# Disclaimer
Although all care has been taken to make VSFH as secure as possible, it has not been independently audited for vulnerabilities. You run VSFH (and expose it to the internet) at your own risk.
