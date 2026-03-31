# tmzon – Social Media API

A simple social media backend built with **Node.js**, **Express**, and **MongoDB**, containerised with **Docker** and deployed automatically via **GitHub Actions**.

---

## Features

| Resource | Endpoints |
|----------|-----------|
| Auth     | `POST /api/auth/register`, `POST /api/auth/login` |
| Posts    | `GET /api/posts`, `GET /api/posts/:id`, `POST /api/posts`, `DELETE /api/posts/:id` |
| Likes    | `POST /api/posts/:id/like` (toggle) |
| Comments | `POST /api/posts/:id/comments`, `DELETE /api/posts/:id/comments/:commentId` |
| Users    | `GET /api/users/:username`, `POST /api/users/:username/follow` (toggle) |
| Health   | `GET /health` |

---

## Local development

```bash
# 1. Clone the repo
git clone https://github.com/Turkcoder123/tmzon.git
cd tmzon

# 2. Start everything with Docker Compose
docker compose up --build

# API available at http://localhost:3000
```

Create a `.env` file to override defaults:

```
JWT_SECRET=your_strong_secret
```

---

## Running tests

```bash
npm install
npm test
```

---

## CI/CD (GitHub Actions)

The workflow in `.github/workflows/deploy.yml`:

1. **test** – installs dependencies and runs Jest on every push / PR
2. **deploy** – on `main` branch push, SSHs into the VPS and:
   - pulls the latest code
   - runs `docker compose up -d --build`

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS IP address or hostname |
| `VPS_USER` | SSH username (e.g. `ubuntu`) |
| `VPS_SSH_KEY` | Private SSH key **without** a passphrase |
| `VPS_PORT` | SSH port (optional, defaults to `22`) |

### Generating an SSH key pair (no passphrase)

```bash
# Generate a key with an empty passphrase
ssh-keygen -t ed25519 -C "github-actions" -N "" -f ~/.ssh/tmzon_deploy

# Copy the public key to your VPS
ssh-copy-id -i ~/.ssh/tmzon_deploy.pub user@your-vps

# Add the PRIVATE key (~/.ssh/tmzon_deploy) as the VPS_SSH_KEY secret in GitHub
```

---

## VPS prerequisites

See **[VPS_SETUP.md](VPS_SETUP.md)** for the full step-by-step installation commands that must be run on the VPS before the first deploy. In short:

- Docker (CE + Compose plugin)
- Git
- SSH authorised key added to `~/.ssh/authorized_keys`
- App directory `~/tmzon` with a `.env` file
