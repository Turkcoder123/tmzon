# Tmzon - Sosyal Medya Uygulaması Backend

Node.js, Express, MongoDB, Redis, Nginx ve Docker ile oluşturulmuş sosyal medya uygulaması backend'i.

## Özellikler

- **Kimlik Doğrulama (Auth)**
  - Email/Şifre ile kayıt ve giriş
  - Google OAuth
  - Telefon numarası ile doğrulama
  - JWT token tabanlı yetkilendirme

- **Paylaşımlar**
  - Post oluşturma, silme, beğenme
  - Story oluşturma (24 saat sonra otomatik silme)
  - Yorum sistemi
  - Resim yükleme desteği

- **Mesajlaşma**
  - Direkt mesajlaşma (1-1)
  - Grup mesajlaşma
  - Gerçek zamanlı mesajlaşma (Socket.IO)
  - Okundu bildirimi, yazıyor göstergesi

- **Profil Yönetimi**
  - Profil düzenleme
  - Takip/Takipten çık
  - Kullanıcı gönderileri

- **Altyapı**
  - Nginx reverse proxy
  - Docker & Docker Compose
  - Redis cache
  - Prometheus metrics
  - Winston logging
  - Rate limiting

## Hızlı Başlangıç

### Gereksinimler
- Docker & Docker Compose
- Node.js 20+ (geliştirme için)

### Kurulum

```bash
# Repoyu klonla
git clone https://github.com/Turkcoder123/tmzon.git
cd tmzon

# .env dosyasını oluştur
cp backend/.env.example backend/.env
# .env dosyasını düzenle ve gerekli değişkenleri ayarla

# Docker ile başlat
docker compose up -d
```

### Yerel Geliştirme

```bash
cd backend
npm install
npm run dev
```

## API Endpoints

### Auth
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register` | Email ile kayıt |
| POST | `/api/auth/login` | Email ile giriş |
| POST | `/api/auth/verify-email` | Email doğrulama |
| POST | `/api/auth/google` | Google OAuth |
| POST | `/api/auth/phone/send-code` | Telefon doğrulama kodu gönder |
| POST | `/api/auth/phone/verify` | Telefon numarası doğrula |
| GET | `/api/auth/me` | Mevcut kullanıcı bilgisi |

### Posts
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/posts` | Yeni gönderi |
| GET | `/api/posts/feed` | Akış |
| GET | `/api/posts/:id` | Gönderi detay |
| DELETE | `/api/posts/:id` | Gönderi sil |
| POST | `/api/posts/:id/like` | Beğen/Beğenme |
| POST | `/api/posts/:id/comments` | Yorum ekle |
| GET | `/api/posts/:id/comments` | Yorumları getir |

### Stories
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/stories` | Yeni story |
| GET | `/api/stories` | Story listesi |
| POST | `/api/stories/:id/view` | Story görüntüleme |
| DELETE | `/api/stories/:id` | Story sil |

### Messages
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/messages/conversations` | Yeni konuşma |
| GET | `/api/messages/conversations` | Konuşma listesi |
| GET | `/api/messages/conversations/:id/messages` | Mesajları getir |
| POST | `/api/messages/conversations/:id/messages` | Mesaj gönder |

### Profile
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/profile/:username` | Profil bilgisi |
| PUT | `/api/profile` | Profil güncelle |
| POST | `/api/profile/:userId/follow` | Takip et/bırak |
| GET | `/api/profile/:username/posts` | Kullanıcı gönderileri |

### Monitoring
| Endpoint | Açıklama |
|----------|----------|
| `/health` | Sağlık kontrolü |
| `/metrics` | Prometheus metrikleri |

## CI/CD

GitHub Actions ile otomatik deploy:
- `main` branch'e push yapıldığında VPS'e otomatik deploy edilir
- GitHub Secrets'a şunlar eklenmeli:
  - `VPS_HOST` - VPS IP adresi
  - `VPS_USER` - VPS kullanıcı adı
  - `VPS_SSH_KEY` - SSH özel anahtarı

## Ortam Değişkenleri

`backend/.env.example` dosyasına bakın.

## Lisans

Bu proje MIT lisansı ile lisanslanmıştır.
