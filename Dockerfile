# BUILD SERVER
FROM mcr.microsoft.com/dotnet/sdk:6.0-bullseye-slim AS server-builder

ADD ./vsfh-server /vsfh-server

WORKDIR /vsfh-server

RUN dotnet restore
RUN dotnet publish -c Release -o build --use-current-runtime -p:PublishReadyToRun=true --no-self-contained

# BUILD CLIENT
FROM docker.io/node:18-slim AS client-builder

ADD ./vsfh-client /vsfh-client
WORKDIR /vsfh-client

RUN yarn install --frozen-lockfile

# See https://github.com/webpack/webpack/issues/14532
# The build process calls Object.createHash, which in node is implemented via openssl
RUN export NODE_OPTIONS=--openssl-legacy-provider && yarn run build

# COMPRESS CLIENT
FROM mcr.microsoft.com/dotnet/sdk:6.0-bullseye-slim AS compressor

ADD ./vsfh-compressor /vsfh-compressor
COPY --from=client-builder /vsfh-client/build /vsfh-client
WORKDIR /vsfh-compressor

RUN dotnet run -c Release -- --path /vsfh-client

# BUILD RUNTIME ENVIRONMENT
FROM mcr.microsoft.com/dotnet/aspnet:6.0-bullseye-slim

WORKDIR /vsfh
COPY --from=server-builder /vsfh-server/build .
COPY --from=compressor /vsfh-client ./wwwroot

RUN mkdir data

# TODO_JU Actually test this
ENTRYPOINT [ "/vsfh/VerySimpleFileHost" ]
