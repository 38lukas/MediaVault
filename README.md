# MediaVault

A private media tracker for **movies, series, and anime**.

---

## Tech Stack

* **Backend:** Python (FastAPI, SQLAlchemy, Pydantic)
* **Database:** PostgreSQL (Hosted on Neon)
* **Frontend:** Next.js (App Router, TypeScript + React, Material UI, TanStack Query, Redux Toolkit)

---

## Backend Setup

### 1. Create & Activate Virtual Environment

Navigate into the `backend/` folder:

```bash
cd backend
python -m venv venv
```

#### Activate Environment:

* **Windows (PowerShell):** `.\venv\Scripts\Activate.ps1`
* **Windows (CMD):** `.\venv\Scripts\activate.bat`
* **Linux / macOS:** `source venv/bin/activate`

### 2. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Environment Variables

Copy `.env.example` to a single `.env` in the **repo root** (not `frontend/` or `backend/`):

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
AUTH_SECRET=at_least_32_random_characters
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TMDB_ACCESS_TOKEN=your_tmdb_read_access_token
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

# Avatars (S3-compatible: AWS S3, Cloudflare R2, …)
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_REGION=auto
S3_ENDPOINT_URL=
S3_PUBLIC_BASE_URL=https://your-public-base-url
```

`AUTH_SECRET` signs login tokens; generate one with
`python -c "import secrets; print(secrets.token_urlsafe(48))"` and set the same kind of value
on Render. Changing it logs everyone out.

IGDB uses Twitch developer credentials. Create an app at https://dev.twitch.tv/console/apps
(Confidential client type), generate a Client Secret, then paste both values into the root `.env`.

TMDB cover lookup uses the **API Read Access Token** (Bearer), not the v3 API key.
Copy it from https://www.themoviedb.org/settings/api into `TMDB_ACCESS_TOKEN`.

Avatars upload to S3-compatible storage. Set `S3_*` in the root `.env`
(and on Render). For Cloudflare R2, set `S3_ENDPOINT_URL` to your account endpoint
and `S3_PUBLIC_BASE_URL` to the bucket’s public `r2.dev` URL or custom domain.
The bucket (or public domain) must allow public read of `avatars/*`.

### 4. Run the Backend Server

```bash
uvicorn app.main:app --reload
```

* **API Server:** http://127.0.0.1:8000
* **Healthcheck:** http://127.0.0.1:8000/health
* **Interactive API Docs (Swagger UI):** http://127.0.0.1:8000/docs
* **Alternative API Docs (ReDoc):** http://127.0.0.1:8000/redoc

### 5. Database Migrations

Schema migrations no longer run on every API startup (that made Render cold starts slow).
After pulling changes that touch the database schema, run them once against the database:

```bash
cd backend
python -m app.core.migrations
```

This uses `DATABASE_URL` from the root `.env`, so running it locally updates the Neon database
that Render uses too. Alternatively, set `RUN_MIGRATIONS=1` on the Render Web Service for one
deploy, then remove it again. All statements are idempotent, so running them twice is safe.

### 6. Backups

`.github/workflows/db-backup.yml` backs up the Neon database every night (02:17 UTC) and
can also be started by hand under **Actions → Database backup → Run workflow**. Each run
restores the dump into a throwaway Postgres and compares row counts with the live database,
then stores the dump **encrypted** (AES-256) as a workflow artifact for 30 days.

It needs two repository secrets (**Settings → Secrets and variables → Actions**):
`DATABASE_URL` (the Neon connection string) and `BACKUP_PASSPHRASE` (keep a copy in your
password manager — without it the backups can't be decrypted).

To restore:

1. Download the artifact from the workflow run and unzip it.
2. Decrypt: `gpg --output mediavault.dump --decrypt mediavault_<date>.dump.gpg`
3. In Neon, create a new branch (or database) to restore into, so the current data stays untouched.
4. Restore: `pg_restore --no-owner --no-privileges --dbname="<connection string of the new branch>" mediavault.dump`
5. Check the data, then point `DATABASE_URL` (locally and on Render) at the restored branch.

On Render you need **two services**: a Static Site for `frontend/out` and a
separate Web Service for FastAPI (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
Set the frontend build env `NEXT_PUBLIC_API_URL` to the Web Service URL + `/api`
(not the Static Site hostname). The API allows all origins (`CORSMiddleware` with
`allow_origins=["*"]`); redeploy the Web Service after pulling CORS changes.