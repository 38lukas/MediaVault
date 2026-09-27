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

Create a `.env` file in the `backend/` directory and add your PostgreSQL connection string
plus Twitch credentials for IGDB cover lookups:

```env
DATABASE_URL=postgresql://neondb_owner:npg_RjzJ2X5PLArQ@ep-curly-hill-b4keuhny-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
```

IGDB uses Twitch developer credentials. Create an app at https://dev.twitch.tv/console/apps
(Confidential client type), generate a Client Secret, then paste both values into `.env`.

### 4. Run the Backend Server

```bash
uvicorn app.main:app --reload
```

* **API Server:** http://127.0.0.1:8000
* **Healthcheck:** http://127.0.0.1:8000/health
* **Interactive API Docs (Swagger UI):** http://127.0.0.1:8000/docs
* **Alternative API Docs (ReDoc):** http://127.0.0.1:8000/redoc

On Render you need **two services**: a Static Site for `frontend/out` and a
separate Web Service for FastAPI (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
Set the frontend build env `NEXT_PUBLIC_API_URL` to the Web Service URL + `/api/v1`
(not the Static Site hostname). The API allows all origins (`CORSMiddleware` with
`allow_origins=["*"]`); redeploy the Web Service after pulling CORS changes.