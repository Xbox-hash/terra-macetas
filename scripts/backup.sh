#!/usr/bin/env bash
# ==========================================================================
# Respaldo diario de Donna Botánica (producción)
#
# Guarda en BACKUP_DIR/<fecha>/:
#   - TerraMacetas_Prod.bak   base de datos (productos, pedidos, textos, config)
#   - uploads.tar.gz          fotos y logo subidos desde el panel
#   - evolution.sql.gz        sesión de WhatsApp (evita volver a escanear el QR)
#
# Uso:      bash /opt/terra-macetas/scripts/backup.sh
# Cron:     30 3 * * * bash /opt/terra-macetas/scripts/backup.sh >> /var/log/terra-backup.log 2>&1
#
# Variables opcionales:
#   BACKUP_DIR      carpeta destino            (por defecto /opt/backups/terra-macetas)
#   KEEP_DAYS       días de respaldos a guardar (por defecto 7)
#   RCLONE_REMOTE   destino fuera del VPS, ej. "gdrive:respaldos/terra" (requiere rclone configurado)
# ==========================================================================
set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/terra-macetas/.env}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/terra-macetas}"
KEEP_DAYS="${KEEP_DAYS:-7}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}"

DB_NAME="TerraMacetas_Prod"
SQL_CONTAINER="terra_sqlserver"
API_CONTAINER="terra_api_prod"
EVO_DB_CONTAINER="terra_evolution_db"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
fail() { log "ERROR: $*"; exit 1; }

# Evita dos respaldos al mismo tiempo
exec 9>/tmp/terra-backup.lock
flock -n 9 || fail "Ya hay un respaldo en curso."

umask 077

# Lee solo la contraseña de SQL Server del .env (sin cargar el resto)
[[ -r "$ENV_FILE" ]] || fail "No se puede leer $ENV_FILE"
SA_PASSWORD="$(grep -E '^TERRA_SQL_SA_PASSWORD=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '"'"'"'\r')"
[[ -n "$SA_PASSWORD" ]] || fail "TERRA_SQL_SA_PASSWORD está vacío en $ENV_FILE"

STAMP="$(date '+%Y-%m-%d_%H%M')"
DEST="$BACKUP_DIR/$STAMP"
mkdir -p "$DEST"
chmod 700 "$BACKUP_DIR"
log "Respaldo en $DEST"

# Busca sqlcmd dentro del contenedor (la ruta cambia según la versión de la imagen)
SQLCMD="$(docker exec "$SQL_CONTAINER" sh -c 'ls /opt/mssql-tools18/bin/sqlcmd /opt/mssql-tools/bin/sqlcmd 2>/dev/null | head -n1')"
[[ -n "$SQLCMD" ]] || fail "No se encontró sqlcmd en $SQL_CONTAINER"

sql() {
  # La contraseña va por variable de entorno, no por -P, para que no aparezca en la lista de procesos
  docker exec -e SQLCMDPASSWORD="$SA_PASSWORD" "$SQL_CONTAINER" \
    "$SQLCMD" -C -S localhost -U sa -b -Q "$1"
}

# --- 1. Base de datos -------------------------------------------------------
log "Respaldando base de datos $DB_NAME..."
IN_CONTAINER="/var/opt/mssql/backup/${DB_NAME}_${STAMP}.bak"
docker exec "$SQL_CONTAINER" mkdir -p /var/opt/mssql/backup
sql "BACKUP DATABASE [$DB_NAME] TO DISK = N'$IN_CONTAINER' WITH INIT, CHECKSUM" >/dev/null
sql "RESTORE VERIFYONLY FROM DISK = N'$IN_CONTAINER' WITH CHECKSUM" >/dev/null
docker cp "$SQL_CONTAINER:$IN_CONTAINER" "$DEST/$DB_NAME.bak"
docker exec "$SQL_CONTAINER" rm -f "$IN_CONTAINER"
[[ -s "$DEST/$DB_NAME.bak" ]] || fail "El archivo .bak quedó vacío"

# --- 2. Fotos subidas ------------------------------------------------------
log "Respaldando fotos..."
docker run --rm --volumes-from "$API_CONTAINER":ro -v "$DEST":/backup alpine:3.20 \
  tar czf /backup/uploads.tar.gz -C /app/wwwroot/uploads .

# --- 3. Sesión de WhatsApp (Evolution) -------------------------------------
log "Respaldando sesión de WhatsApp..."
if docker exec "$EVO_DB_CONTAINER" pg_dump -U evolution_user evolution | gzip > "$DEST/evolution.sql.gz"; then
  :
else
  # No es crítico: sin esto solo hay que volver a escanear el QR
  log "AVISO: no se pudo respaldar Evolution. Se sigue con el resto."
  rm -f "$DEST/evolution.sql.gz"
fi

( cd "$DEST" && sha256sum ./* > SHA256SUMS )
log "Listo: $(du -sh "$DEST" | cut -f1)"

# --- 4. Copia fuera del VPS (opcional) -------------------------------------
if [[ -n "$RCLONE_REMOTE" ]]; then
  if command -v rclone >/dev/null 2>&1; then
    log "Subiendo a $RCLONE_REMOTE/$STAMP..."
    rclone copy "$DEST" "$RCLONE_REMOTE/$STAMP"
    rclone delete "$RCLONE_REMOTE" --min-age "${KEEP_DAYS}d" || true
    rclone rmdirs "$RCLONE_REMOTE" --leave-root || true
  else
    log "AVISO: RCLONE_REMOTE está configurado pero rclone no está instalado."
  fi
fi

# --- 5. Borrar respaldos viejos --------------------------------------------
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '20*' -mtime +"$KEEP_DAYS" -print -exec rm -rf {} + \
  | sed 's/^/Borrado respaldo viejo: /'

log "Respaldo terminado."
