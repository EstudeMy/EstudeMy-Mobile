#!/usr/bin/env bash
# ==============================================================================
# Apache CloudStack - Cloud-Init User Data Script para EstudeMy
# Executado automaticamente na primeira inicialização da VM no CloudStack (KVM)
# Sistema Operacional Homologado: Ubuntu Server 24.04 LTS (Template qcow2)
# ==============================================================================

set -euo pipefail

exec > >(tee -a /var/log/cloudstack-user-data.log) 2>&1

echo "========================================================================"
echo "☁️ Iniciando Provisionamento Automático no Apache CloudStack (EstudeMy)"
echo "========================================================================"

# 1. Atualização do Sistema
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg lsb-release ufw openssl git jq parted

# 2. Configuração de Armazenamento: Formatação e Montagem do Disco de Dados (200 GB)
# No CloudStack KVM, discos adicionais aparecem como /dev/vdb
DATA_DEV="/dev/vdb"
MOUNT_POINT="/opt/estudemy/data/db"

if [ -b "${DATA_DEV}" ]; then
    echo "Disco de dados detectado em ${DATA_DEV}. Configurando..."
    if ! blkid "${DATA_DEV}" >/dev/null 2>&1; then
        echo "Formatando ${DATA_DEV} com ext4..."
        mkfs.ext4 -F "${DATA_DEV}"
    fi
    mkdir -p "${MOUNT_POINT}"
    UUID=$(blkid -s UUID -o value "${DATA_DEV}")
    if ! grep -q "${UUID}" /etc/fstab; then
        echo "UUID=${UUID} ${MOUNT_POINT} ext4 defaults,noatime 0 2" >> /etc/fstab
    fi
    mount -a
    echo "Disco de dados de 200 GB montado com sucesso em ${MOUNT_POINT}."
else
    echo "Aviso: Dispositivo ${DATA_DEV} não detectado. Usando armazenamento local do disco root."
    mkdir -p "${MOUNT_POINT}"
fi

# 3. Configuração do Firewall Host (UFW)
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 3000/tcp comment 'Grafana'
ufw --force enable

# 4. Instalação Oficial do Docker 26.x e Compose Plugin
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker
systemctl start docker

# 5. Estrutura de Diretórios e Permissões
mkdir -p /opt/estudemy/{backups,logs,scripts,nginx/ssl/live,monitoring}
chmod 700 /opt/estudemy/backups

# 6. Agendamento do Cron de Backup Diário (0 2 * * *)
CRON_JOB="0 2 * * * /opt/estudemy/scripts/backup.sh >> /opt/estudemy/logs/backup_cron.log 2>&1"
(crontab -l 2>/dev/null | grep -Fv "/opt/estudemy/scripts/backup.sh" ; echo "${CRON_JOB}") | crontab -

echo "========================================================================"
echo "✅ Provisionamento Cloud-Init no CloudStack finalizado com sucesso!"
echo "========================================================================"
