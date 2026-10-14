#!/usr/bin/env bash
# ==============================================================================
# EstudeMy - Automação de Provisionamento de Host Cloud (OCI Free Tier / AWS EC2)
# Sistema Operacional Homologado: Ubuntu Server 24.04 LTS (Noble Numbat)
# Shape Homologado: VM.Standard.A1.Flex (4 OCPUs ARM, 24 GB RAM, 200 GB SSD)
#
# Este script realiza:
# 1. Atualização do sistema operacional e pacotes essenciais
# 2. Configuração do Firewall UFW (Portas 22, 80, 443 liberadas; 5000 e 27017 isoladas)
# 3. Instalação do Docker Engine 26.x e Docker Compose Plugin v2
# 4. Estruturação dos diretórios de dados (/opt/estudemy/data/db, backups, logs)
# 5. Configuração do agendamento de backup diário às 02h00 (0 2 * * *)
# 6. Criação de serviço Systemd para inicialização automática da stack
# ==============================================================================

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "Por favor, execute este script como root ou com sudo."
  exit 1
fi

echo "========================================================================"
echo "🚀 Iniciando Provisionamento do Servidor Cloud EstudeMy (Ubuntu 24.04)"
echo "========================================================================"

# 1. Atualização de Repositórios e Pacotes Base
echo "1. Atualizando repositórios e pacotes do sistema..."
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    ufw \
    openssl \
    tar \
    gzip \
    git \
    htop \
    jq

# 2. Configuração do Firewall UFW (Segurança de Rede - Seção 8)
echo "2. Configurando regras de Firewall UFW..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH Administrativo'
ufw allow 80/tcp comment 'HTTP Redirecionamento'
ufw allow 443/tcp comment 'HTTPS Seguro'
ufw allow 3000/tcp comment 'Painel Grafana'
# Bloqueio explícito de portas internas contra exposição acidental
ufw deny 5000/tcp comment 'Backend API (Isolado)'
ufw deny 27017/tcp comment 'MongoDB (Isolado)'
ufw --force enable
echo "Firewall UFW ativo e configurado conforme Seção 8."

# 3. Instalação do Docker Engine Oficial e Compose Plugin v2
echo "3. Instalando Docker Engine 26.x e Docker Compose Plugin v2..."
install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.asc ]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
fi

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker
echo "Docker $(docker --version) instalado com sucesso."

# 4. Criação da Estrutura de Diretórios na Nuvem
echo "4. Criando estrutura de diretórios em /opt/estudemy..."
mkdir -p /opt/estudemy/data/db
mkdir -p /opt/estudemy/backups
mkdir -p /opt/estudemy/logs
mkdir -p /opt/estudemy/scripts
mkdir -p /opt/estudemy/nginx/ssl/live
mkdir -p /opt/estudemy/monitoring/prometheus
mkdir -p /opt/estudemy/monitoring/grafana

# Ajuste de permissões
chmod 700 /opt/estudemy/backups
chmod 755 /opt/estudemy/scripts

# 5. Agendamento Cron para Rotina Diária de Backup às 02h00 (Seção 6)
echo "5. Configurando agendamento de backup diário (0 2 * * *)..."
CRON_JOB="0 2 * * * /opt/estudemy/scripts/backup.sh >> /opt/estudemy/logs/backup_cron.log 2>&1"
(crontab -l 2>/dev/null | grep -Fv "/opt/estudemy/scripts/backup.sh" ; echo "${CRON_JOB}") | crontab -
echo "Cron de backup registrado: 0 2 * * *"

# 6. Criação do Serviço Systemd para a Stack EstudeMy
echo "6. Configurando serviço Systemd estudemy.service..."
cat << 'EOF' > /etc/systemd/system/estudemy.service
[Unit]
Description=EstudeMy Cloud Production Stack (Docker Compose)
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/estudemy
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d --remove-orphans
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable estudemy.service
echo "Serviço Systemd estudemy.service habilitado para inicialização automática."

# 7. Otimizações de Kernel e Memória Virtual (Sysctl para MongoDB)
echo "7. Aplicando parâmetros de performance do kernel..."
cat << 'EOF' >> /etc/sysctl.d/99-estudemy-cloud.conf
vm.max_map_count=262144
fs.file-max=65536
net.core.somaxconn=1024
EOF
sysctl -p /etc/sysctl.d/99-estudemy-cloud.conf >/dev/null 2>&1 || true

echo "========================================================================"
echo "✅ Provisionamento concluído com sucesso!"
echo "Próximos passos:"
echo "1. Clone o repositório ou sincronize os arquivos em /opt/estudemy"
echo "2. Configure as variáveis no arquivo /opt/estudemy/.env"
echo "3. Execute /opt/estudemy/scripts/init-ssl.sh"
echo "4. Inicie a stack com: systemctl start estudemy"
echo "========================================================================"
