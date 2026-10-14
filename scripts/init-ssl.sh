#!/usr/bin/env bash
# ==============================================================================
# EstudeMy - Inicialização e Gestão de Certificados SSL/TLS (Seção 8)
# Cria certificados autoassinados para desenvolvimento/staging imediato
# ou solicita certificados válidos via Certbot (Let's Encrypt) para produção
# ==============================================================================

set -euo pipefail

SSL_DIR="${SSL_DIR:-./nginx/ssl/live}"
DOMAIN="${DOMAIN:-estudemy.site}"
EMAIL="${EMAIL:-admin@estudemy.site}"
MODE="${1:-selfsigned}" # selfsigned ou letsencrypt

mkdir -p "${SSL_DIR}"

if [ "${MODE}" = "letsencrypt" ]; then
    echo "Solicitando certificado SSL Let's Encrypt para ${DOMAIN}..."
    if command -v certbot >/dev/null 2>&1; then
        certbot certonly --standalone \
            -d "${DOMAIN}" \
            -d "api.${DOMAIN}" \
            --email "${EMAIL}" \
            --agree-tos \
            --non-interactive
        
        cp -L "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "${SSL_DIR}/fullchain.pem"
        cp -L "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "${SSL_DIR}/privkey.pem"
        echo "Certificado Let's Encrypt instalado com sucesso!"
    else
        echo "Certbot não instalado. Gerando certificados autoassinados provisórios..."
        MODE="selfsigned"
    fi
fi

if [ "${MODE}" = "selfsigned" ]; then
    if [ ! -f "${SSL_DIR}/fullchain.pem" ] || [ ! -f "${SSL_DIR}/privkey.pem" ]; then
        echo "Gerando certificado autoassinado para testes locais/homologação..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "${SSL_DIR}/privkey.pem" \
            -out "${SSL_DIR}/fullchain.pem" \
            -subj "/C=BR/ST=SP/L=Votorantim/O=EstudeMy/OU=DevOps/CN=${DOMAIN}"
        echo "Certificado autoassinado criado em ${SSL_DIR}."
    else
        echo "Certificados já existem em ${SSL_DIR}."
    fi
fi
