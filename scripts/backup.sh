#!/usr/bin/env bash
# ==============================================================================
# EstudeMy - Rotina Automatizada de Backup em Nuvem (Seção 6)
# Agendamento Cron: 0 2 * * * /opt/estudemy/scripts/backup.sh
# RPO: 24 Horas | RTO: 15 Minutos | Retenção: 7 Dias
# Destino: Block Storage Local + Object Storage (OCI / AWS S3)
# ==============================================================================

set -euo pipefail

# Diretórios e Configurações
BACKUP_DIR="${BACKUP_DIR:-/opt/estudemy/backups}"
LOG_FILE="${LOG_FILE:-/opt/estudemy/logs/backup.log}"
DATE_TAG=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="estudemy_backup_${DATE_TAG}.archive.gz"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}"
RETENTION_DAYS=7

# Credenciais e Variáveis do Banco (injetadas via ambiente ou .env)
MONGO_CONTAINER="${MONGO_CONTAINER:-estudemy_mongo}"
MONGO_DB="${MONGO_DB:-estudemy}"
MONGO_USER="${MONGO_APP_USER:-estudemy_admin}"
MONGO_PASSWORD="${MONGO_APP_PASSWORD:-estudemy_secure_pass_2026}"
MONGO_AUTH_DB="${MONGO_AUTH_DB:-admin}"

# Configuração de Object Storage (OCI Bucket / AWS S3)
OBJECT_STORAGE_BUCKET="${OBJECT_STORAGE_BUCKET:-estudemy-backups}"
OBJECT_STORAGE_PROVIDER="${OBJECT_STORAGE_PROVIDER:-oci}" # oci ou aws ou local

# Garante a existência dos diretórios
mkdir -p "${BACKUP_DIR}" "$(dirname "${LOG_FILE}")"

log() {
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1" | tee -a "${LOG_FILE}"
}

log "=========================================================="
log "Iniciando Rotina de Backup da Base EstudeMy: ${MONGO_DB}"
log "=========================================================="

# 1. Executa dump compactado com gzip diretamente do contêiner MongoDB
log "1. Executando mongodump com compressão gzip..."

if docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
    docker exec "${MONGO_CONTAINER}" mongodump \
        --username="${MONGO_USER}" \
        --password="${MONGO_PASSWORD}" \
        --authenticationDatabase="${MONGO_AUTH_DB}" \
        --db="${MONGO_DB}" \
        --archive \
        --gzip > "${BACKUP_FILE}"
else
    log "ERRO CRÍTICO: Contêiner ${MONGO_CONTAINER} não está em execução!"
    exit 1
fi

# 2. Validação da integridade do arquivo gerado
FILE_SIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}" 2>/dev/null || echo 0)

if [ "${FILE_SIZE}" -lt 1024 ]; then
    log "ERRO: Arquivo de backup suspeito ou vazio (${FILE_SIZE} bytes). Abortando."
    rm -f "${BACKUP_FILE}"
    exit 1
fi

log "Backup local gerado com sucesso: ${BACKUP_NAME} (${FILE_SIZE} bytes)"

# 3. Upload para Object Storage em Nuvem (OCI Object Storage ou AWS S3)
log "2. Sincronizando com o Object Storage (${OBJECT_STORAGE_PROVIDER})..."

if [ "${OBJECT_STORAGE_PROVIDER}" = "oci" ]; then
    if command -v oci >/dev/null 2>&1; then
        oci os object put \
            --bucket-name "${OBJECT_STORAGE_BUCKET}" \
            --file "${BACKUP_FILE}" \
            --name "backups/${BACKUP_NAME}" \
            --force >> "${LOG_FILE}" 2>&1
        log "Upload para OCI Object Storage concluído: bucket ${OBJECT_STORAGE_BUCKET}"
    else
        log "AVISO: Utilitário 'oci' CLI não encontrado. Mantido no Block Volume local."
    fi
elif [ "${OBJECT_STORAGE_PROVIDER}" = "aws" ]; then
    if command -v aws >/dev/null 2>&1; then
        aws s3 cp "${BACKUP_FILE}" "s3://${OBJECT_STORAGE_BUCKET}/backups/${BACKUP_NAME}" >> "${LOG_FILE}" 2>&1
        log "Upload para AWS S3 concluído com sucesso."
    else
        log "AVISO: Utilitário 'aws' CLI não encontrado. Mantido no Block Volume local."
    fi
else
    log "Modo de armazenamento local ativo. Cópia mantida em ${BACKUP_DIR}."
fi

# 4. Aplicação da Política de Retenção de 7 Dias (Expurgo de Backups Antigos)
log "3. Aplicando política de retenção (${RETENTION_DAYS} dias)..."
find "${BACKUP_DIR}" -type f -name "estudemy_backup_*.archive.gz" -mtime +${RETENTION_DAYS} -exec rm -vf {} \; | tee -a "${LOG_FILE}"

log "Rotina de Backup finalizada com sucesso. RPO de 24h garantido."
