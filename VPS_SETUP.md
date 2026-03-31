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
sudo ufw allow 3000/tcp   # tmzon API portu
sudo ufw enable
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

| Adım | Paket / İşlem         | Amaç                              |
|------|-----------------------|-----------------------------------|
| 1    | `apt upgrade`         | Sistem güncelliği                 |
| 2    | `git`                 | Repo klonlama / güncelleme        |
| 3    | `docker-ce`           | Uygulama ve MongoDB container'ları|
| 4    | `docker-compose-plugin` | Çoklu container yönetimi        |
| 5    | Docker grup yetkisi   | Sudo olmadan Docker kullanımı     |
| 6    | SSH authorized key    | Passphrase'siz CI/CD bağlantısı   |
| 7    | Uygulama dizini       | Deploy hedef klasörü              |
| 8    | `.env` dosyası        | Uygulama gizli değişkenleri       |
| 9    | UFW güvenlik duvarı   | Sadece gerekli portları aç        |
