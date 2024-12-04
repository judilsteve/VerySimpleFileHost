FROM mcr.microsoft.com/dotnet/sdk:9.0 AS builder

# NativeAOT build deps
RUN apt-get udpate \
    && apt-get install -y --no-install-recommends \
    clang zlib1g-dev

COPY . /app

WORKDIR /app
RUN dotnet publish \
    -o publish \
    -c Release \
    -p:PublishTrimmed=true \
    -p:PublishAot=true \
    -p:TreatWarningsAsErrors=true

FROM mcr.microsoft.com/dotnet/runtime-deps:9.0

COPY --from=builder /app/publish /app

ENTRYPOINT [ "/app/VerySimpleFileHostCompressor" ]
