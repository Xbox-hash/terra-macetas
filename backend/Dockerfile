# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["TerraMacetas.Api.csproj", "./"]
RUN dotnet restore "TerraMacetas.Api.csproj"

COPY . .
RUN dotnet publish "TerraMacetas.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "TerraMacetas.Api.dll"]
