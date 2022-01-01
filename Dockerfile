# BUILD SSERVER
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS server-builder

WORKDIR /opt/vsfh-server
COPY vsfh-server ./

RUN dotnet restore
RUN dotnet publish -c Release -o build

# BUILD CLIENT
# Note: Tried using node 17 but `npm ci` would hang
FROM docker.io/node:16 AS client-builder

WORKDIR /opt/vsfh-client
COPY vsfh-client ./

RUN npm ci --dev --verbose --no-audit
RUN npm run build

# BUILD RUNTIME ENVIRONMENT
FROM mcr.microsoft.com/dotnet/aspnet:6.0-buster

RUN useradd -m -s /sbin/nologin vsfh
USER vsfh

EXPOSE 7270/tcp
EXPOSE 5299/tcp

WORKDIR /home/vsfh
COPY --from=server-builder /opt/vsfh-server/build /home/vsfh/vsfh
COPY --from=client-builder /opt/vsfh-client/build /home/vsfh/vsfh/wwwroot

ENTRYPOINT /home/vsfh/vsfh/VerySimpleFileHost
