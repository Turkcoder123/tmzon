#!/bin/sh
# nginx entrypoint: SSL sertifikası varsa HTTPS, yoksa HTTP modunda başlat
set -e

CERT_FILE="/etc/letsencrypt/live/tmzon.tech/fullchain.pem"
KEY_FILE="/etc/letsencrypt/live/tmzon.tech/privkey.pem"
CONF_DEST="/etc/nginx/conf.d/default.conf"
SSL_TEMPLATE="/etc/nginx/templates/nginx-ssl.conf"
HTTP_TEMPLATE="/etc/nginx/templates/nginx.conf"

# Şablon dosyalarının varlığını kontrol et
if [ ! -f "$SSL_TEMPLATE" ]; then
    echo "[entrypoint] HATA: SSL şablon dosyası bulunamadı: $SSL_TEMPLATE" >&2
    exit 1
fi
if [ ! -f "$HTTP_TEMPLATE" ]; then
    echo "[entrypoint] HATA: HTTP şablon dosyası bulunamadı: $HTTP_TEMPLATE" >&2
    exit 1
fi

# Hedef dizinin yazılabilir olup olmadığını kontrol et
CONF_DIR=$(dirname "$CONF_DEST")
if [ ! -d "$CONF_DIR" ]; then
    echo "[entrypoint] HATA: nginx conf dizini bulunamadı: $CONF_DIR" >&2
    exit 1
fi

# SSL sertifika varlığına göre uygun yapılandırmayı seç
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo "[entrypoint] SSL sertifikası bulundu — HTTPS modu etkinleştiriliyor."
    cp "$SSL_TEMPLATE" "$CONF_DEST"
else
    echo "[entrypoint] SSL sertifikası bulunamadı — HTTP modu ile başlatılıyor."
    cp "$HTTP_TEMPLATE" "$CONF_DEST"
fi

# nginx yapılandırmasını doğrula
echo "[entrypoint] nginx yapılandırması test ediliyor..."
if ! nginx -t; then
    echo "[entrypoint] HATA: nginx yapılandırması geçersiz! Lütfen yapılandırma dosyalarını kontrol edin." >&2
    exit 1
fi

echo "[entrypoint] nginx başlatılıyor..."
exec nginx -g "daemon off;"
