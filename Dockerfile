# BUILD SERVER
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS server-builder

WORKDIR /tmp
COPY . /tmp/VerySimpleFileHost
WORKDIR /tmp/VerySimpleFileHost/vsfh-server

RUN dotnet restore
RUN dotnet publish -c Release -o build --use-current-runtime -p:PublishReadyToRun=true --no-self-contained

# BUILD CLIENT
# Note: Tried using node 17 but `npm ci` would hang
FROM docker.io/node:16 AS client-builder

WORKDIR /tmp/vsfh-client
COPY --from=server-builder /tmp/VerySimpleFileHost/vsfh-client ./

RUN yarn install --frozen-lockfile
RUN yarn run build

# BUILD RUNTIME ENVIRONMENT
FROM mcr.microsoft.com/dotnet/aspnet:6.0

WORKDIR /vsfh
COPY --from=server-builder /tmp/VerySimpleFileHost/vsfh-server/build .
COPY --from=client-builder /tmp/vsfh-client/build ./wwwroot

RUN mkdir data

ENTRYPOINT [ "/vsfh/VerySimpleFileHost" ]
