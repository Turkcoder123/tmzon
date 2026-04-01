# VPS Kurulum Kılavuzu

Bu dosya, GitHub Actions deploy pipeline'ı çalıştırılmadan önce VPS sunucusunda **bir kez** yapılması gereken kurulum adımlarını içerir.

---

## 1. Sistemi Güncelle

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

---

## 2. Git'i Kur

```bash
sudo apt-get install -y git
```

---

## 3. Docker'ı Kur

```bash
# Gerekli bağımlılıkları yükle
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Docker'ın resmi GPG anahtarını ekle
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Docker deposunu ekle
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker Engine'i kur
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Docker servisini başlat
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 4. Mevcut Kullanıcıyı Docker Grubuna Ekle

> Bu adımdan sonra oturumu kapatıp tekrar açmak gerekir.

```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## 5. Docker Kurulumunu Doğrula

```bash
docker --version
docker compose version
```

---

## 6. SSH Yetkili Anahtarı Ekle (GitHub Actions için)

GitHub Actions'ın VPS'e passphrase olmadan bağlanabilmesi için deploy public key'ini `authorized_keys` dosyasına ekle:

```bash
# Lokal makinede passphrase'siz anahtar çifti oluştur
ssh-keygen -t ed25519 -C "github-actions-deploy" -N "" -f ~/.ssh/tmzon_deploy

# Public key'i VPS'e kopyala (lokal makinede çalıştır)
ssh-copy-id -i ~/.ssh/tmzon_deploy.pub <VPS_KULLANICI>@<VPS_IP>

# Alternatif olarak manuel ekle (VPS'de çalıştır)
echo "<tmzon_deploy.pub içeriği>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Private key (`~/.ssh/tmzon_deploy` içeriği) GitHub → Settings → Secrets → Actions altına `VPS_SSH_KEY` olarak eklenmelidir.

---

## 7. Uygulama Dizinini Oluştur

```bash
mkdir -p ~/tmzon
```

---

## 8. Ortam Değişkenlerini Ayarla

```bash
cat > ~/tmzon/.env << 'EOF'
JWT_SECRET=guclu_ve_rastgele_bir_secret_buraya
EOF
chmod 600 ~/tmzon/.env
```

---

## 9. Güvenlik Duvarı (UFW) Ayarları

```bash
sudo apt-get install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp    # HTTP (nginx)
sudo ufw allow 443/tcp   # HTTPS (nginx)
sudo ufw enable
```

---

## 10. SSL Sertifikası Al (Let's Encrypt / Certbot)

> **Ön koşul:** `tmzon.tech` ve `www.tmzon.tech` DNS kayıtlarının sunucunun IP adresine yönlendirilmiş olması gerekir.
> Bu adımlar nginx konteyneri **başlatılmadan önce** yapılmalıdır; Certbot sertifika alırken 80. portu kullanır.

### Certbot'u Kur

```bash
sudo apt-get install -y certbot
```

### Sertifikayı Al (Standalone Mod)

```bash
# 80. portu kullanan bir servis varsa durdur
sudo docker compose down 2>/dev/null || true

# Sertifikayı al
sudo certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email pylanyyewbiri@tmzon.tech \
  -d tmzon.tech \
  -d www.tmzon.tech
```

Sertifika dosyaları `/etc/letsencrypt/live/tmzon.tech/` altına kaydedilir:

| Dosya           | Açıklama               |
|-----------------|------------------------|
| `fullchain.pem` | Sertifika + zincir     |
| `privkey.pem`   | Özel anahtar           |

### Otomatik Yenileme Ayarla

```bash
# Yenilemeyi test et
sudo certbot renew --dry-run

# Crontab ile otomatik yenileme (90 günde bir)
echo "0 3 * * * root certbot renew --quiet --post-hook 'docker compose -f $(eval echo ~$USER)/tmzon/docker-compose.yml restart nginx'" \
  | sudo tee /etc/cron.d/certbot-renew
sudo chmod 644 /etc/cron.d/certbot-renew
```

---

## 11. Frontend'i Derle (Web Build)

```bash
cd ~/tmzon/app/tmzon

# Bağımlılıkları kur
npm install

# Expo web build oluştur (çıktı: dist/)
npx expo export --platform web
```

---

## 12. Uygulamayı Başlat

```bash
cd ~/tmzon

# Konteynerleri derle ve başlat
docker compose up -d --build

# Servislerin durumunu kontrol et
docker compose ps
docker compose logs -f
```

---

## GitHub Secrets

Deploy workflow'un çalışması için aşağıdaki secret'ların GitHub reposuna eklenmesi gerekir:

| Secret        | Açıklama                                      |
|---------------|-----------------------------------------------|
| `VPS_HOST`    | VPS'in IP adresi veya hostname'i              |
| `VPS_USER`    | SSH kullanıcı adı (örn. `ubuntu`)             |
| `VPS_SSH_KEY` | Passphrase'siz private SSH key (PEM içeriği)  |
| `VPS_PORT`    | SSH portu (opsiyonel, varsayılan `22`)         |

---

## Kurulum Özeti

| Adım | Paket / İşlem           | Amaç                                      |
|------|-------------------------|-------------------------------------------|
| 1    | `apt upgrade`           | Sistem güncelliği                         |
| 2    | `git`                   | Repo klonlama / güncelleme                |
| 3    | `docker-ce`             | Uygulama, nginx ve MongoDB container'ları |
| 4    | `docker-compose-plugin` | Çoklu container yönetimi                  |
| 5    | Docker grup yetkisi     | Sudo olmadan Docker kullanımı             |
| 6    | SSH authorized key      | Passphrase'siz CI/CD bağlantısı           |
| 7    | Uygulama dizini         | Deploy hedef klasörü                      |
| 8    | `.env` dosyası          | Uygulama gizli değişkenleri               |
| 9    | UFW güvenlik duvarı     | 80/443 (nginx) ve SSH portlarını aç       |
| 10   | `certbot`               | Let's Encrypt SSL sertifikası             |
| 11   | Expo web build          | Frontend statik dosyaları                 |
| 12   | `docker compose up`     | Tüm servisleri başlat                     |
