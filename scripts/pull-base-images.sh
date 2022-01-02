#!/bin/bash
set -e

podman pull mcr.microsoft.com/dotnet/sdk:6.0
podman pull docker.io/node:16
podman pull mcr.microsoft.com/dotnet/aspnet:6.0
