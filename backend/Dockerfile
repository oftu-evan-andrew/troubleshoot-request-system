# Build context is the backend/ directory (see render.yaml's dockerContext).
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/TroubleshootRequestSystem.Api/TroubleshootRequestSystem.Api.csproj src/TroubleshootRequestSystem.Api/
RUN dotnet restore src/TroubleshootRequestSystem.Api/TroubleshootRequestSystem.Api.csproj

COPY src/TroubleshootRequestSystem.Api/ src/TroubleshootRequestSystem.Api/
RUN dotnet publish src/TroubleshootRequestSystem.Api/TroubleshootRequestSystem.Api.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "TroubleshootRequestSystem.Api.dll"]
