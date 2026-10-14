#!/usr/bin/env bash
# ==============================================================================
# EstudeMy - Rotina de Restauração e Disaster Recovery (Seção 6)
# Meta RTO (Recovery Time Objective): < 15 Minutos
# Restaura o banco de dados a partir do arquivo de backup local ou Object Storage
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/estudemy/backups}"
LOG_FILE="${LOG_FILE:-/opt/estudemy/logs/restore.log}"
MONGO_CONTAINER="${MONGO_CONTAINER:-estudemy_mongo}"
MONGO_DB="${MONGO_DB:-estudemy}"
MONGO_USER="${MONGO_APP_USER:-estudemy_admin}"
MONGO_PASSWORD="${MONGO_APP_PASSWORD:-estudemy_secure_pass_2026}"
MONGO_AUTH_DB="${MONGO_AUTH_DB:-admin}"

log() {
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1" | tee -a "${LOG_FILE}"
}

# Identifica o arquivo de backup a ser restaurado (passado como argumento ou o mais recente)
TARGET_BACKUP="${1:-}"

if [ -z "${TARGET_BACKUP}" ]; then
    log "Nenhum arquivo especificado. Buscando o backup mais recente em ${BACKUP_DIR}..."
    TARGET_BACKUP=$(ls -t "${BACKUP_DIR}"/estudemy_backup_*.archive.gz 2>/dev/null | head -n 1 || true)
fi

if [ -z "${TARGET_BACKUP}" ] || [ ! -f "${TARGET_BACKUP}" ]; then
    log "ERRO: Nenhum arquivo de backup válido encontrado para restauração."
    echo "Uso: $0 [/caminho/para/arquivo_backup.archive.gz]"
    exit 1
fi

log "=========================================================="
log "Iniciando Restauração de Desastre (Disaster Recovery)"
log "Arquivo de origem: ${TARGET_BACKUP}"
log "Banco de destino: ${MONGO_DB}"
log "=========================================================="

START_TIME=$(date +%s)

# 1. Verifica se o contêiner MongoDB está operacional
if ! docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
    log "Iniciando o contêiner MongoDB..."
    docker compose up -d mongo
    sleep 5
fi

# 2. Executa a restauração com mongorestore via stream de archive gzip
log "1. Executando mongorestore (--drop --archive --gzip)..."

docker exec -i "${MONGO_CONTAINER}" mongorestore \
    --username="${MONGO_USER}" \
    --password="${MONGO_PASSWORD}" \
    --authenticationDatabase="${MONGO_AUTH_DB}" \
    --nsInclude="${MONGO_DB}.*" \
    --drop \
    --archive \
    --gzip < "${TARGET_BACKUP}"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

log "Restauração concluída em ${DURATION} segundos!"
if [ ${DURATION} -le 900 ]; then
    log "SUCESSO: Meta de RTO de 15 minutos cumprida com folga (Executado em ${DURATION}s)."
else
    log "AVISO: Tempo de restauração excedeu 15 minutos (${DURATION}s)."
fi

# 3. Teste de fumaça (Smoke Test) para validar coleções do banco
log "2. Validando integridade das coleções restauradas..."
docker exec "${MONGO_CONTAINER}" mongosh \
    --username="${MONGO_USER}" \
    --password="${MONGO_PASSWORD}" \
    --authenticationDatabase="${MONGO_AUTH_DB}" \
    --eval "db.getSiblingDB('${MONGO_DB}').getCollectionNames()"
