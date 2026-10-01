FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY src/backend/Salgados.Core/Salgados.Core.csproj src/backend/Salgados.Core/
COPY src/backend/Salgados.Infrastructure/Salgados.Infrastructure.csproj src/backend/Salgados.Infrastructure/
COPY src/backend/Salgados.Api/Salgados.Api.csproj src/backend/Salgados.Api/
RUN dotnet restore src/backend/Salgados.Api/Salgados.Api.csproj

COPY src/backend/Salgados.Core/ src/backend/Salgados.Core/
COPY src/backend/Salgados.Infrastructure/ src/backend/Salgados.Infrastructure/
COPY src/backend/Salgados.Api/ src/backend/Salgados.Api/
RUN dotnet publish src/backend/Salgados.Api/Salgados.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "Salgados.Api.dll"]