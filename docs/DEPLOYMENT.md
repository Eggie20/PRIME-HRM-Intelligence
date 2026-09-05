# NBSC PRIME-HRM Intelligence Hub — Production Deployment Guide

This guide details the deployment of the NBSC PRIME-HRM Intelligence Hub using Docker Compose, Gunicorn WSGI, and Nginx.

---

## Architecture Overview

```
[ Client Browser ]
        │
        ▼ (Port 80 / 443)
┌────────────────────────────────────────┐
│ Nginx Reverse Proxy (Frontend Container) │
│ - Pure Static HTML5 / CSS (BEM) / JS   │
│ - Gzip compression & asset caching     │
└──────────────────┬─────────────────────┘
                   │ /api/v1/
                   ▼
┌────────────────────────────────────────┐
│ Gunicorn + Django REST API (Backend)   │
│ - Argon2 password hashing / JWT Auth   │
│ - 4-Pillar DSS & SHA-256 Hash Chain    │
│ - SARA Voice AI & RAG Engine           │
└──────────────────┬─────────────────────┘
                   │
                   ▼ (Port 27017)
┌────────────────────────────────────────┐
│ MongoDB 7.0 Document Database          │
│ - Persistent volume storage            │
└────────────────────────────────────────┘
```

---

## 1. Prerequisites
- Docker Engine 24.0+ and Docker Compose v2+
- Domain name with DNS A record pointing to server IP
- Valid Google Gemini API Key (for live AI conversational reasoning in SARA)

---

## 2. Environment Configuration

Create `.env` file in the project root:

```env
# Django Core
DJANGO_SECRET_KEY=change-to-a-very-strong-secret-key-at-least-32-chars-long
DJANGO_DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,nbsc-hrms.edu.ph

# MongoDB Connection
MONGODB_HOST=mongodb
MONGODB_PORT=27017
MONGODB_NAME=nbsc_hrms

# Authentication
JWT_SECRET_KEY=change-to-a-secure-jwt-signing-key-32-chars-minimum
JWT_EXPIRATION_HOURS=8

# SARA Voice AI Assistant
GEMINI_API_KEY=AIzaSyYourGoogleGeminiApiKeyHere

# Email Dispatcher (Optional SMTP)
DEFAULT_FROM_EMAIL=hrmo@nbsc.edu.ph
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=hrmo@nbsc.edu.ph
EMAIL_HOST_PASSWORD=your-app-password
```

---

## 3. Launching via Docker Compose

Run from the `docker/` directory:

```bash
cd docker

# Build and start all 3 containers in detached mode
docker compose up --build -d

# Check status of services
docker compose ps

# View real-time logs
docker compose logs -f
```

---

## 4. Seeding Production Initial Data

Execute the seed script inside the backend container:

```bash
docker compose exec backend python scripts/seed_db.py
```

This seeds:
- Administrative accounts (`admin@nbsc.edu.ph`, `hrmpsb@nbsc.edu.ph`, `depthead.ics@nbsc.edu.ph`, `applicant@gmail.com`)
- 6 Academic and administrative programs
- 8 Faculty & Staff personnel
- 6 Job vacancies across institutes
- 8 Applicant records across all 8 pipeline stages
- 4-Pillar DSS scores, Likert evaluations, and board ballots
- Genesis block + 5 cryptographic SHA-256 blocks
- Sample encrypted payroll cycle for September 1–15, 2026

---

## 5. SSL / TLS Setup (Certbot & HTTPS)

To enable SSL with Let's Encrypt:

1. Install Certbot on the host server:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```
2. Request and install certificates:
   ```bash
   sudo certbot certonly --standalone -d hrms.nbsc.edu.ph
   ```
3. Mount the certificate paths into the `frontend` container in `docker-compose.yml` and enable HTTPS listener in `nginx.conf`.

---

## 6. Backup & Maintenance

### Backing up MongoDB
```bash
docker compose exec mongodb mongodump --db=nbsc_hrms --out=/data/backup/$(date +%F)
```

### Checking Chain Integrity
Verify cryptographic ledger consistency:
```bash
curl -X GET http://localhost/api/v1/audit/verify/
```
