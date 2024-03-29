# VerySimpleFileHost
VerySimpleFileHost (VSFH) is an HTTP File Server with a web interface. VSFH is designed to be:

 - **Quick to install and completely self-contained.** VSFH maintains its own user list in a self-managed SQLite database. It does *not* integrate with local user accounts, Linux-PAM, or filesystem permissions. VSFH runs as a single process.

 - **Easy to use and administrate.** Administrators can manage users from the web interface. New users do not need to install any software; all they need is an invite link.

  - **Fast and lightweight.** Files are served using asynchronous I/O and low-level APIs wherever possible. Large files and \[g\]zipped collections of files can be served without allocating large memory buffers. The web client prioritises a snappy user experience.

  - **Conceptually simple.** VSFH has a very conservative feature scope. It does not have per-user file permissions, or any user hierarchy. It provides read access to a single directory, in its entirety, for all users. Curation of shared content is left to the filesystem.

  - **API driven.** VSFH is a RESTful JSON API with OpenAPI/SwaggerUI integration (available in debug builds). Don't like the included web interface? Build your own! Need automated/m2m access? Use the [OpenAPI toolkit](https://github.com/OpenAPITools/openapi-generator-cli) to auto-generate a client API.

  - **Secure.** VSFH allows administrators to enforce frequenty changed strong passwords. All traffic is encrypted via HTTPS (with optional, fully automatic certificates from Let's Encrypt).

# Features

## zxcvbn Integration
Administrators can set a minimum [zxcvbn](https://github.com/dropbox/zxcvbn) password strength for all accounts. Users receive detailed feedback and suggestions to help them create stronger passwords. Administrators can mandate regular changing of passwords, disable persistent auth cookies, and set cookie/invite link expiration times.

![ChangePassword](https://user-images.githubusercontent.com/4328790/150635291-ea5bd069-ba85-42fe-93b1-42392a752206.png)

## Simple User Management
Administrators can create and manage user accounts easily from within the VSFH web client.

![ManageUsers](https://user-images.githubusercontent.com/4328790/150635292-538567c0-12ec-40b6-a0b2-e2d9aea9159d.png)

## Bulk Downloads
Users can download entire directories as a tarball (with optional gzip compression) or zip archive (with configurable compression level) with a single click. They can also select an arbitrary combination of files/directories at multiple levels of the share tree and download them together in a single archive.

![Browse](https://user-images.githubusercontent.com/4328790/150635293-56f5b565-6ddd-4fc4-8265-56f67543596b.png)

## HTTP Range and MIME Support
Media such as audio and video can be streamed, with full support for seek operations (via HTTP range requests). Administrators can configure MIME type mappings so that files automatically open in the right application.

# Build and Run

## Prerequisites
- [Node.js](https://nodejs.org/) (tested with v16 and v18)
- [Yarn](https://yarnpkg.com/)
- [dotnet SDK 7.0](https://dotnet.microsoft.com/en-us/download/dotnet/7.0)
- [libsodium](https://github.com/jedisct1/libsodium) (available in most distros' package repositories)

## Instructions

If you'd prefer to get up and running faster, you can [download a binary release](https://github.com/judilsteve/VerySimpleFileHost/releases), extract it, and  skip straight to step 6. This also avoids needing to install the prerequisites mentioned above (although libsodium still needs to be manually installed for some targets like ARM; you'll get an error when you try to set up your first account if this is the case).

You can also build a containerised deployment with the included Dockerfile. There are instructions for running the VSFH Docker image in the next section.

1. Clone this repository to an appropriate directory

2. Build the server
```bash
cd vsfh-server
dotnet restore
dotnet publish -c Release -o build
```

If you value fast server startup times (useful for deployment patterns such as systemd socket activation), you should consider publishing with the ReadyToRun flag:

```bash
dotnet publish -c Release -o build --use-current-runtime -p:PublishReadyToRun=true --no-self-contained
```

If you are cross-compiling, you should replace `--use-current-runtime` with `-r <rid>`, where `<rid>` is the [runtime identifier (RID)](https://docs.microsoft.com/en-us/dotnet/core/rid-catalog) of your target.

3. Build the client
```bash
cd ../vsfh-client
yarn install --frozen-lockfile
yarn run build
```

4. Compress the static client files, for faster page loads (optional, but highly recommended)
```bash
cd ../vsfh-compressor
dotnet run -- --path=../vsfh-client/build/
```

5. Copy client build output to server's static files directory
```bash
cd ..
mkdir vsfh-server/build/wwwroot
cp vsfh-client/build/* vsfh-server/build/wwwroot
```

6. Adjust `appsettings.json` as desired in `vsfh-server/build`

7. Create an administrator account
```bash
./vsfh-server/build/VerySimpleFileHost --create-admin-account
```

8. Start VSFH
```bash
./vsfh-server/build/VerySimpleFileHost
```

9. Use the link generated by step 7 to log in

## Instructions for Docker/Podman

After building an image, you will need to run the container with three bind mounts:

 - `--mount type=bind,ro,source=</path/to/your/appsettings.json>,target=/vsfh/appsettings.json`

 - `--mount type=bind,ro,source=</your/share/directory>,target=/home/vsfh/shared`

 - `--mount type=bind,source=</your/database/and/lettuce_encrypt/data>,target=/vsfh/data`

Only the last bind mount needs to be read/write, the rest can be read only. For the last bind mount, choose an empty folder as the source: VSFH will create the SQLite/LettuceEncrypt files for you.

## Exposing VSFH to the Internet
You will likely need to forward VSFH's HTTPS listen port to 443 and its HTTP listen port to 80. Instructions for this will be specific to your chosen firewall/router. Forwarding to other ports is possible, but you will lose the ability to use Let's Encrypt certificates, since Let's Encrypt's challenge schemes require VSFH to listen on ports 80 and 443.

VSFH runs on the Kestrel HTTP server, which (since .NET Core 2.0) can be used as an edge server. VSFH is preconfigured to serve pre-compressed static content with effective `Cache-Control` and `Content-Security-Policy` headers. Dynamic response compression is already implemented on endpoints that would benefit from it (and that are not susceptible to chosen-plaintext attacks like BREACH/CRIME). Therefore, reverse-proxying VSFH through Apache/nginx/IIS/etc is not required, but can still be done if it is convenient for your deployment scenario (although [you will lose the ability to use LettuceEncrypt](https://github.com/natemcmaster/LettuceEncrypt#aspnet-core-with-kestrel-behind-a-reverse-proxy)).

# Configuration
Adjust `./vsfh-server/build/VerySimpleFileHost/appsettings.json` as required. Comments are provided in the [default configuration](https://github.com/judilsteve/VerySimpleFileHost/blob/main/vsfh-server/appsettings.json) for your reference.

# Disclaimer
Although all care has been taken to make VSFH as secure as possible, it has not been independently audited for vulnerabilities. You run VSFH (and expose it to the internet) at your own risk.
