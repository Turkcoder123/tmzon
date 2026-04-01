# tmzon – Social Media Platform

A full-stack social media platform with a **Node.js/Express** backend API and a **React Native (Expo)** mobile & web app. Supports user registration & login (JWT), posts, likes, comments, and follow/unfollow. The backend is containerised with **Docker Compose** and deployed automatically to a VPS via **GitHub Actions**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Running Tests](#running-tests)
- [CI/CD (GitHub Actions)](#cicd-github-actions)
- [VPS Prerequisites](#vps-prerequisites)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4 |
| Database | MongoDB 6 (Mongoose 7) |
| Auth | JSON Web Tokens (`jsonwebtoken`) |
| Password hashing | bcryptjs |
| Containerisation | Docker + Docker Compose v3.9 |
| Testing | Jest + Supertest |
| CI/CD | GitHub Actions |
| Mobile/Web App | React Native (Expo SDK 54) |
| Navigation | React Navigation 7 |
| Platforms | Android, iOS, Web |

---

## Project Structure

```
tmzon/
├── src/                       # Backend API
│   ├── index.js               # Express app entry point
│   ├── config/
│   │   ├── env.js             # Environment variable config
│   │   └── database.js        # MongoDB connection
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Post.js            # Post schema
│   ├── routes/
│   │   ├── auth.js            # /api/auth – register & login
│   │   ├── posts.js           # /api/posts – CRUD, likes, comments
│   │   └── users.js           # /api/users – profile & follow
│   ├── controllers/
│   │   ├── authController.js  # Auth logic
│   │   ├── postController.js  # Post logic
│   │   └── userController.js  # User logic
│   └── middleware/
│       ├── auth.js            # JWT Bearer token verification
│       └── rateLimiter.js     # Rate limiting
├── app/
│   └── tmzon/                 # React Native (Expo) app – Android, iOS, Web
│       ├── App.js             # Navigation + Auth context setup
│       ├── app.json           # Expo config
│       ├── package.json       # App dependencies
│       └── src/
│           ├── api/
│           │   └── client.js          # Fetch-based API client
│           ├── utils/
│           │   └── session.js         # Token storage (SecureStore + localStorage)
│           ├── context/
│           │   └── AuthContext.js      # Auth state provider
│           ├── screens/
│           │   ├── LoginScreen.js     # Login
│           │   ├── RegisterScreen.js  # Registration
│           │   ├── FeedScreen.js      # Keşfet / Takip Edilenler tabs
│           │   ├── PostDetailScreen.js # Post detail + comments
│           │   ├── ProfileScreen.js   # User profile + follow
│           │   └── EditProfileScreen.js # Edit own profile
│           └── components/
│               ├── PostCard.js        # Reusable post card
│               ├── CommentItem.js     # Comment display
│               └── CreatePostModal.js # New post modal
├── tests/
│   └── app.test.js            # Jest + Supertest integration tests
├── Dockerfile                 # Node 18-alpine, production build
├── docker-compose.yml         # app + mongo services
├── VPS_SETUP.md               # One-time VPS setup guide
└── package.json               # Backend dependencies
```

---

## Data Models

### User

| Field | Type | Notes |
|-------|------|-------|
| `username` | String | Required, unique, min 3 chars |
| `email` | String | Required, unique, lowercased |
| `password` | String | Required, min 6 chars, bcrypt-hashed before save |
| `bio` | String | Optional, defaults to `""` |
| `followers` | ObjectId[] | References to `User` |
| `following` | ObjectId[] | References to `User` |
| `createdAt` / `updatedAt` | Date | Auto-managed by Mongoose |

> The `password` field is **excluded** from all JSON responses automatically.

### Post

| Field | Type | Notes |
|-------|------|-------|
| `author` | ObjectId | Reference to `User`, required |
| `content` | String | Required, max 2000 chars |
| `likes` | ObjectId[] | References to `User` |
| `comments` | Comment[] | Embedded sub-documents |
| `createdAt` / `updatedAt` | Date | Auto-managed |

### Comment (embedded in Post)

| Field | Type | Notes |
|-------|------|-------|
| `author` | ObjectId | Reference to `User`, required |
| `content` | String | Required, max 500 chars |
| `createdAt` / `updatedAt` | Date | Auto-managed |

---

## API Reference

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Returns `{ status: "ok", timestamp: "…" }` |

---

### Auth – `/api/auth`

#### `POST /api/auth/register`

**Request body:**
```json
{ "username": "alice", "email": "alice@example.com", "password": "secret123" }
```

**Responses:**

| Status | Meaning |
|--------|---------|
| `201` | Created – returns `{ token, user }` |
| `400` | Missing `username`, `email`, or `password` |
| `409` | Username or email already taken |

---

#### `POST /api/auth/login`

**Request body:**
```json
{ "email": "alice@example.com", "password": "secret123" }
```

**Responses:**

| Status | Meaning |
|--------|---------|
| `200` | OK – returns `{ token, user }` |
| `400` | Missing `email` or `password` |
| `401` | Invalid credentials |

---

### Posts – `/api/posts`

> Endpoints that modify data require a `Bearer` token (see [Authentication](#authentication)).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/posts` | No | List all posts, newest first. Author and comment authors are populated. |
| `GET` | `/api/posts/:id` | No | Get a single post by ID. |
| `POST` | `/api/posts` | **Yes** | Create a post. Body: `{ "content": "…" }` |
| `DELETE` | `/api/posts/:id` | **Yes** | Delete a post. Only the owner may delete. |
| `POST` | `/api/posts/:id/like` | **Yes** | Toggle like on a post. Returns `{ likes, liked }`. |
| `POST` | `/api/posts/:id/comments` | **Yes** | Add a comment. Body: `{ "content": "…" }` |
| `DELETE` | `/api/posts/:id/comments/:commentId` | **Yes** | Delete a comment. Only the comment owner may delete. |

---

### Users – `/api/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/users/:username` | No | Get a public profile. `followers` and `following` lists are populated with usernames. |
| `POST` | `/api/users/:username/follow` | **Yes** | Toggle follow/unfollow. Returns `{ following, followersCount }`. Cannot follow yourself. |

---

## Authentication

Protected endpoints require an `Authorization` header with a **Bearer token** obtained from `/api/auth/register` or `/api/auth/login`.

```
Authorization: Bearer <token>
```

Tokens are signed with `JWT_SECRET` and expire after **7 days**.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port the server listens on |
| `MONGO_URI` | `mongodb://mongo:27017/tmzon` | MongoDB connection string |
| `JWT_SECRET` | `changeme_secret` | Secret used to sign JWTs. **Must be changed in production.** |
| `NODE_ENV` | `production` (in Docker) | Node environment |

Create a `.env` file in the project root to override any of the above:

```env
JWT_SECRET=your_strong_random_secret
MONGO_URI=mongodb://localhost:27017/tmzon
PORT=3000
```

---

## Local Development

### Option 1 – Docker Compose (recommended)

```bash
# Clone the repo
git clone https://github.com/Turkcoder123/tmzon.git
cd tmzon

# (Optional) create a .env file to set a real JWT_SECRET
echo "JWT_SECRET=your_strong_secret" > .env

# Start the API + MongoDB
docker compose up --build
```

The API will be available at **http://localhost:3000**.

Docker Compose starts two services:
- **`app`** – Node.js API (built from `Dockerfile`, Node 18-alpine)
- **`mongo`** – MongoDB 6 with a persistent named volume (`mongo_data`) and a health check

### Option 2 – Node.js directly

```bash
npm install
# Make sure a local MongoDB instance is running and MONGO_URI is set
npm run dev   # uses nodemon for auto-reload
# or
npm start
```

---

## Running Tests

Tests use **Jest** and **Supertest**. Mongoose and Mongoose models are mocked, so no database is required.

```bash
npm install
npm test
```

The test suite covers:

- `GET /health`
- Auth routes: register (success / missing fields / duplicate), login (success / missing fields / bad credentials)
- Post routes: list, get by ID (not found), create (unauthenticated / missing content / success), delete
- User routes: get profile (not found / success)

---

## CI/CD (GitHub Actions)

The workflow (`.github/workflows/deploy.yml`) runs on every push and pull request:

1. **test job** – Installs dependencies and runs `npm test` (Jest).
2. **deploy job** *(only on `main` branch push)* – SSHs into the VPS and:
   - Pulls the latest code (`git pull`)
   - Rebuilds and restarts containers: `docker compose up -d --build`

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS IP address or hostname |
| `VPS_USER` | SSH username (e.g. `ubuntu`) |
| `VPS_SSH_KEY` | Private SSH key **without** a passphrase (PEM content) |
| `VPS_PORT` | SSH port (optional, defaults to `22`) |

### Generating an SSH key pair (no passphrase)

```bash
# Generate a passphrase-less key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -N "" -f ~/.ssh/tmzon_deploy

# Copy the public key to your VPS
ssh-copy-id -i ~/.ssh/tmzon_deploy.pub user@your-vps

# Add the PRIVATE key content as the VPS_SSH_KEY secret in GitHub
cat ~/.ssh/tmzon_deploy
```

---

## VPS Prerequisites

See **[VPS_SETUP.md](VPS_SETUP.md)** for the full step-by-step installation guide that must be run on the VPS **once** before the first deploy. In short:

- System updated (`apt upgrade`)
- Docker CE + Compose plugin installed and running
- Current user added to the `docker` group
- Deploy public key added to `~/.ssh/authorized_keys`
- Application directory `~/tmzon` created
- `~/tmzon/.env` file with a strong `JWT_SECRET`
- UFW firewall configured to allow ports 22 and 3000

---

## Mobile & Web App (React Native / Expo)

The React Native app is located at `app/tmzon/` and supports **Android**, **iOS**, and **Web** from a single codebase using **Expo SDK 54**.

### Features

| Feature | Description |
|---------|-------------|
| **Giriş / Kayıt** | Login & Register screens with JWT auth |
| **Akış (Feed)** | Two tabs – "Keşfet" (all posts) and "Takip Edilenler" (following feed) |
| **Gönderi Oluşturma** | Create new posts via FAB button + modal |
| **Beğeni & Yorum** | Like posts, add/delete comments |
| **Profil** | View user profiles, follow/unfollow, see user posts |
| **Profil Düzenleme** | Edit username, bio, and avatar URL |
| **Çıkış** | Logout from own profile |

### Getting Started

```bash
cd app/tmzon
npm install

# Start the development server
npx expo start

# Platform-specific commands
npm run android   # Open in Android emulator/device
npm run ios       # Open in iOS simulator (macOS only)
npm run web       # Open in browser
```

### Configuration

The API base URL is set in `src/api/client.js`. Update the `BASE_URL` constant to point to your backend:

```javascript
const BASE_URL = 'http://localhost:3000'; // Change for production
```

### Tech Stack

- **Expo SDK 54** – Cross-platform framework
- **React Navigation 7** – Stack + Bottom Tabs navigation
- **expo-secure-store** – Secure token storage (native) with localStorage fallback (web)
- **Ionicons** – Icon library via `@expo/vector-icons`

---

## License

[MIT](LICENSE)
