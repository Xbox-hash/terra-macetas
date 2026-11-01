#!/usr/bin/env bash
# ==========================================================================
# Restaura un respaldo de Donna Botánica (producción)
#
# Uso:  bash /opt/terra-macetas/scripts/restore.sh /opt/backups/terra-macetas/2026-11-01_0330
#
# REEMPLAZA los datos actuales de producción por los del respaldo.
# Pide confirmación antes de hacer cualquier cambio.
# ==========================================================================
set -euo pipefail

SRC="${1:-}"
ENV_FILE="${ENV_FILE:-/opt/terra-macetas/.env}"
DB_NAME="TerraMacetas_Prod"
SQL_CONTAINER="terra_sqlserver"
API_CONTAINER="terra_api_prod"
EVO_DB_CONTAINER="terra_evolution_db"
EVO_API_CONTAINER="terra_evolution_api"

log() { echo "[$(date '+%H:%M:%S')] $*"; }
fail() { log "ERROR: $*"; exit 1; }

[[ -n "$SRC" && -d "$SRC" ]] || fail "Indicá la carpeta del respaldo. Ej: $0 /opt/backups/terra-macetas/2026-11-01_0330"
[[ -s "$SRC/$DB_NAME.bak" ]] || fail "No existe $SRC/$DB_NAME.bak"

if [[ -f "$SRC/SHA256SUMS" ]]; then
  ( cd "$SRC" && sha256sum -c --quiet SHA256SUMS ) || fail "Los archivos del respaldo están dañados (checksum)."
fi

SA_PASSWORD="$(grep -E '^TERRA_SQL_SA_PASSWORD=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '"'"'"'\r')"
[[ -n "$SA_PASSWORD" ]] || fail "TERRA_SQL_SA_PASSWORD está vacío en $ENV_FILE"

echo "Vas a REEMPLAZAR los datos de producción con el respaldo:"
echo "  $SRC"
ls -lh "$SRC"
read -r -p "Escribí RESTAURAR para continuar: " answer
[[ "$answer" == "RESTAURAR" ]] || fail "Cancelado."

SQLCMD="$(docker exec "$SQL_CONTAINER" sh -c 'ls /opt/mssql-tools18/bin/sqlcmd /opt/mssql-tools/bin/sqlcmd 2>/dev/null | head -n1')"
sql() {
  docker exec -e SQLCMDPASSWORD="$SA_PASSWORD" "$SQL_CONTAINER" \
    "$SQLCMD" -C -S localhost -U sa -b -Q "$1"
}

# La API se detiene para que nadie escriba durante la restauración
log "Deteniendo la API de producción..."
docker stop "$API_CONTAINER" >/dev/null
trap 'log "Iniciando la API de producción..."; docker start "$API_CONTAINER" >/dev/null' EXIT

# --- 1. Base de datos -------------------------------------------------------
log "Restaurando base de datos..."
docker exec "$SQL_CONTAINER" mkdir -p /var/opt/mssql/backup
docker cp "$SRC/$DB_NAME.bak" "$SQL_CONTAINER:/var/opt/mssql/backup/restore.bak"
docker exec -u root "$SQL_CONTAINER" chown mssql /var/opt/mssql/backup/restore.bak 2>/dev/null || true
sql "IF DB_ID('$DB_NAME') IS NOT NULL ALTER DATABASE [$DB_NAME] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
     RESTORE DATABASE [$DB_NAME] FROM DISK = N'/var/opt/mssql/backup/restore.bak' WITH REPLACE, CHECKSUM;
     ALTER DATABASE [$DB_NAME] SET MULTI_USER;"
docker exec "$SQL_CONTAINER" rm -f /var/opt/mssql/backup/restore.bak

# --- 2. Fotos ---------------------------------------------------------------
if [[ -s "$SRC/uploads.tar.gz" ]]; then
  log "Restaurando fotos..."
  docker run --rm -i --volumes-from "$API_CONTAINER" alpine:3.20 \
    sh -c 'rm -rf /app/wwwroot/uploads/* && tar xzf - -C /app/wwwroot/uploads' < "$SRC/uploads.tar.gz"
fi

# --- 3. Sesión de WhatsApp (opcional) ---------------------------------------
if [[ -s "$SRC/evolution.sql.gz" ]]; then
  read -r -p "¿Restaurar también la sesión de WhatsApp? (s/N): " evo
  if [[ "$evo" =~ ^[sS]$ ]]; then
    log "Restaurando sesión de WhatsApp..."
    docker stop "$EVO_API_CONTAINER" >/dev/null
    docker exec "$EVO_DB_CONTAINER" psql -U evolution_user -d postgres -q \
      -c "DROP DATABASE IF EXISTS evolution WITH (FORCE);" -c "CREATE DATABASE evolution OWNER evolution_user;"
    gunzip -c "$SRC/evolution.sql.gz" | docker exec -i "$EVO_DB_CONTAINER" psql -U evolution_user -d evolution -q
    docker start "$EVO_API_CONTAINER" >/dev/null
  fi
fi

log "Restauración terminada."
