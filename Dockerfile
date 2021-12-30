FROM docker.io/node:17-slim AS client-builder

WORKDIR /opt
COPY vsfh-client ./
RUN npm ci
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS server-builder

WORKDIR /opt
COPY vsfh-server ./
RUN dotnet restore
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:6.0

ENV DEBIAN_FRONTEND=noninteractive

RUN useradd -m -s /sbin/nologin vsfh

EXPOSE 7270/tcp
EXPOSE 5299/tcp

WORKDIR ~
COPY --from=server-builder /opt/out /home/vsfh
COPY --from=client-builder /opt/build /home/vsfh

ENTRYPOINT ["dotnet" "/home/vsfh/aspnetapp.dll"]