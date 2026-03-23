# 🚕 GeoDurak

Akıllı Taksi Durağı Yönetim Sistemi — GPS & Geofence tabanlı.

## Başlangıç

```bash
docker-compose up -d   # PostgreSQL + Redis (ilk kez)
npm install            # Bağımlılıklar (ilk kez)
npm start              # Her şeyi başlatır
```

## Servis Adresleri

| Servis | Adres |
|--------|-------|
| Backend API | http://localhost:3000 |
| Admin Panel | http://localhost:5173 |
| Mobile (Expo) | exp://192.168.1.10:8081 |

## Giriş Bilgileri

### 🖥️ Admin Panel (Yönetici)
| Alan | Değer |
|------|-------|
| Telefon | `05001234567` |
| Şifre | `admin123` |

### 📱 Mobil Uygulama (Test Sürücüsü)
| Alan | Değer |
|------|-------|
| Telefon | `05009876543` |
| Şifre | `driver123` |

### 🗄️ Veritabanı (PostgreSQL)
| Alan | Değer |
|------|-------|
| Host | `localhost:5432` |
| Kullanıcı | `umut` |
| Şifre | `durak123` |
| Veritabanı | `geodurak_db` |

### 🔴 Redis
| Alan | Değer |
|------|-------|
| Host | `localhost:6379` |
| Şifre | Yok |

## Tech Stack

- **Backend**: NestJS + TypeORM + Socket.io
- **Database**: PostgreSQL + PostGIS (Docker)
- **Cache**: Redis (Docker)
- **Admin Panel**: React + Vite
- **Mobile**: React Native + Expo
