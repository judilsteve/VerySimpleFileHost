# VerySimpleFileHost

VerySimpleFileHost (VSFH) is a RESTful HTTP File Server with a web interface. VSFH is designed to be:

 - **Quick to install and completely self-contained.** VSFH does *not* integrate with local user accounts, Linux-PAM, or filesystem permissions; instead it maintains its own set of users in a simple SQLite database which it manages by itself. At runtime, it consists of a single process.

 - **Easy to use and administrate.** Administrators can manage users from within the web interface. New users do not need to install any client software; all they need to get up and running is an invite link from an administrator.

  - **Fast and lightweight.** Files are served using asynchronous I/O and near-direct file-system access wherever possible. Large files and \[g\]zipped collections of files do not require large amounts of memory for buffering. The web frontend makes heavy use of code-splitting, tree-pruning, and bundle minification/optimisation to ensure a snappy experience for end-users.

  - **Conceptually simple.** VSFH is very conservative in its feature scope. It does not have a complicated per-user file permission system, or a hierarchical group system for managing users. It provides read access to a single directory, in its entirety, to all of its users. Curation of shared content is left to the filesystem.

  - **Secure.** VSFH has configuration options that allow administrators to enforce the use (and frequent change of) strong passwords. It encrypts all traffic via HTTPS (with optional certificates from Let's Encrypt) (TODO_JU) and runs inside a Docker container (TODO_JU) to provide you with a virtual demilitarised-zone (DMZ).

# Build and run

You will need dotnet sdk (version 6.0).

```
dotnet restore
dotnet build
dotnet run
```
