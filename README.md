Das liegt daran, dass Markdown-Code-Blöcke geschachtelte Code-Blöcke (wie ````bash`) nicht direkt verarbeiten können und die Formatierung dort abgebrochen ist.

Hier ist der reine Text, den du direkt in deine `README.md` einfügen kannst:

# Media Tracker

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

Create a `.env` file in the `backend/` directory and add your PostgreSQL connection string:

```env
DATABASE_URL=postgresql://neondb_owner:npg_RjzJ2X5PLArQ@ep-curly-hill-b4keuhny-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require

```

### 4. Run the Backend Server

```bash
uvicorn app.main:app --reload
```

* **API Server:** http://127.0.0.1:8000
* **Interactive API Docs (Swagger UI):** http://127.0.0.1:8000/docs
* **Alternative API Docs (ReDoc):** http://127.0.0.1:8000/redoc

---