# MediaVault — Architektur-Guide

Ein Einsteiger-freundlicher Überblick darüber, wie dieses Projekt aufgebaut ist und wie die Teile zusammenarbeiten. Ideal, wenn du MediaVault per „Vibe Coding“ gebaut hast und jetzt die Architektur wirklich verstehen willst.

---

## 1. 🚀 Executive Summary & Architecture Overview

### Was ist MediaVault?

**MediaVault** ist ein privater Media-Tracker: Du speicherst Filme, Serien, Anime, Spiele und DLCs mit Status, Cover und Start-/Enddatum. Die App besteht aus drei klar getrennten Schichten:

| Schicht | Technologie | Hosting |
|---------|-------------|---------|
| Frontend | Next.js (Static Export) + React + Redux Toolkit Query + MUI | Render **Static Site** |
| Backend | FastAPI + Uvicorn + SQLAlchemy + Pydantic | Render **Web Service** |
| Datenbank | PostgreSQL | **Neon** |
| Externe APIs | IGDB (Cover-Suche) über Twitch OAuth | Twitch / IGDB |

Das Frontend ist **kein** klassischer Next.js-Server mit API-Routes. Durch `output: "export"` entstehen nur statische HTML/JS/CSS-Dateien. Alle Daten holt der Browser direkt vom FastAPI-Backend.

### Architektur-Fluss (High Level)

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Render Static Site)                                   │
│  Next.js Export → frontend/out/                                 │
│  Redux Toolkit Query (mediaApi)                                 │
│  Base-URL: NEXT_PUBLIC_API_URL  (= …/api/v1, zur Build-Zeit)    │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS (REST)
                             │ GET/POST/PUT/DELETE /entries
                             │ GET /igdb/cover?name=…
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  FastAPI (Render Web Service)                                   │
│  CORSMiddleware (allow_origins=["*"])                           │
│  Router-Prefix: /api/v1                                         │
│  ├── /entries  → CRUD auf media_entries                         │
│  └── /igdb     → Proxy zur Cover-Suche                          │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
             │ SQLAlchemy                    │ httpx + Twitch Token
             ▼                               ▼
┌────────────────────────┐     ┌──────────────────────────────────┐
│  PostgreSQL (Neon)     │     │  Twitch OAuth (client_credentials)│
│  Tabelle: media_entries│     │  → Bearer Token (gecacht)         │
└────────────────────────┘     │  → IGDB API /v4/games             │
                               │  → Cover-URL (images.igdb.com)    │
                               └──────────────────────────────────┘
```

**Kurz gesagt:** Klick im UI → RTK Query → FastAPI → Neon (oder IGDB) → JSON zurück → Redux-Cache/UI aktualisiert sich.

---

## 2. 🎨 Frontend Deep Dive (`/frontend`)

### Tech-Stack und warum

| Technologie | Rolle in diesem Projekt |
|-------------|-------------------------|
| **Next.js (App Router)** | Projektstruktur (`src/app`), Build-Pipeline, Static Export für günstiges Hosting |
| **React 19** | Komponenten der Bibliotheks-UI |
| **Redux Toolkit + RTK Query** | Server-State (API-Daten, Caching, Mutations) **und** UI-State (Filter, Modal) |
| **Material UI (MUI)** | Fertige Dark-Theme-Komponenten (Dialog, Grid, Buttons, …) |
| **Tailwind CSS** | Basis-Styling im Layout (`globals.css`, Utility-Klassen am `body`) |
| **TypeScript** | Typen 1:1 an die FastAPI-Felder angeglichen (`snake_case`) |

> Hinweis: Im README steht teilweise „TanStack Query“. Im Code wird dafür **ausschließlich RTK Query** verwendet (`frontend/src/redux/mediaApi.ts`).

### `output: 'export'` — Static Hosting

In `frontend/next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.igdb.com" },
      // …
    ],
  },
};
```

**Was das bedeutet:**

1. `next build` erzeugt den Ordner `frontend/out/` mit fertigem HTML/JS/CSS.
2. Es gibt **keinen** Node-Server zur Laufzeit → keine Server Components mit DB-Zugriff, keine Next.js API Routes.
3. Bilder können nicht serverseitig optimiert werden → deshalb `images.unoptimized: true`.
4. Ideal für Render **Static Site**: Du lädst nur die `out/`-Dateien hoch.

### Environment Variables zur Build-Zeit

Statische Exports kennen `process.env` nur **beim Build**. Variablen mit dem Prefix `NEXT_PUBLIC_` werden in den Client-Bundle „eingebacken“.

| Variable | Beispielwert | Zweck |
|----------|--------------|--------|
| `NEXT_PUBLIC_API_URL` | `https://dein-backend.onrender.com/api/v1` | Basis-URL für RTK Query |

Lokal fällt der Code auf `http://127.0.0.1:8000/api/v1` zurück, falls die Variable fehlt.

**Wichtig:** Änderst du die API-URL in Production, musst du das Frontend **neu bauen und deployen**. Ein reiner Backend-Restart reicht nicht — die alte URL steckt schon im JS-Bundle.

### RTK Query Setup (`mediaApi.ts`)

Die zentrale API-Schicht liegt in `frontend/src/redux/mediaApi.ts`.

**1. Base-URL auflösen** (inkl. Schutz vor doppelten Hosts — ein klassischer Deploy-Bug):

```ts
function resolveApiBaseUrl(): string {
  let raw = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').trim();
  // … Markdown-Links/Anführungszeichen entfernen …
  raw = raw.replace(/\/+$/, '');
  // Fix: https://host/https://host/api/v1 → https://host/api/v1
  raw = raw.replace(/^(https?:\/\/[^/]+)\/\1(?=\/|$)/i, '$1');
  return raw;
}
```

**2. API Slice mit Caching und Tag-Invalidierung:**

```ts
export const mediaApi = createApi({
  reducerPath: 'mediaApi',
  baseQuery: fetchBaseQuery({ baseUrl: resolveApiBaseUrl() }),
  tagTypes: ['MediaEntries'],
  endpoints: (builder) => ({
    getMediaEntries: builder.query<MediaItem[], void>({
      query: () => '/entries',           // relativ → kein doppelter Host
      transformResponse: (response) =>
        [...response].sort((a, b) => b.id - a.id),
      providesTags: ['MediaEntries'],
    }),
    createMediaEntry: builder.mutation(/* POST /entries */, {
      invalidatesTags: ['MediaEntries'], // → Liste wird neu geladen
    }),
    // update / delete analog …
    fetchIgdbCover: builder.query(/* GET /igdb/cover?name=… */),
  }),
});
```

**Wie Caching hier funktioniert (einfach erklärt):**

- `useGetMediaEntriesQuery()` lädt die Liste einmal und speichert sie im Redux-Store.
- Nach Create/Update/Delete markiert `invalidatesTags: ['MediaEntries']` den Cache als veraltet → RTK Query holt die Liste automatisch neu.
- UI-State (Filter, Sortierung, Modal) lebt **separat** in `libraryUiSlice.ts` — Serverdaten und UI-Zustand sind bewusst getrennt.

**Store-Zusammenbau** (`store.ts`):

```ts
configureStore({
  reducer: {
    [mediaApi.reducerPath]: mediaApi.reducer,
    libraryUi: libraryUiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(mediaApi.middleware),
});
```

`StoreProvider.tsx` wickelt die App in Redux + MUI Dark Theme und wird in `layout.tsx` eingebunden.

### Schlüssel-Seiten und Komponentenfluss

Es gibt praktisch **eine Seite**: `/` → `src/app/page.tsx`.

```
layout.tsx
  └── StoreProvider (Redux + MUI Theme)
        └── page.tsx
              ├── LibraryHeader      → Titel, Cards/List-Toggle, „Add“
              ├── AddMediaModal      → Create / Edit / Delete + IGDB Fetch
              └── LibraryView
                    ├── useGetMediaEntriesQuery()
                    ├── LibraryToolbar   → Typfilter, Sortierung, Monats-Gruppierung
                    └── MediaGrid | MediaList (+ MonthDivider)
```

**Typische User-Flows:**

1. **Bibliothek laden:** `LibraryView` ruft `useGetMediaEntriesQuery` auf → GET `/api/v1/entries` → Filter/Sort lokal im Browser.
2. **Eintrag hinzufügen:** Header öffnet Modal → optional „Fetch“ (IGDB) → POST `/entries` → Cache invalidiert → Liste refreshed.
3. **Eintrag bearbeiten:** Klick auf Card/Zeile → `openEditMediaModal` → PUT `/entries/{id}` oder DELETE.

Feldnamen sind durchgängig `snake_case` (`media_type`, `poster_path`, …) — Frontend-Typen in `types/media.ts` spiegeln das Backend 1:1, ohne Mapping-Layer.

---

## 3. ⚙️ Backend Deep Dive (`/backend`)

### Framework-Struktur

| Baustein | Datei(en) | Aufgabe |
|----------|-----------|---------|
| **FastAPI** | `app/main.py` | App, Middleware, Router, Healthchecks |
| **Uvicorn** | (CLI) | ASGI-Server (`uvicorn app.main:app`) |
| **SQLAlchemy** | `database.py`, `models.py` | Engine, Sessions, ORM-Modell |
| **Pydantic** | `schemas.py`, `enums.py` | Request/Response-Validierung |
| **httpx** | `igdb.py` | HTTP-Calls zu Twitch & IGDB |
| **python-dotenv** | `database.py` / Env | Lädt die gemeinsame Root-`.env` |

Abhängigkeiten stehen in `backend/requirements.txt` (`fastapi`, `uvicorn`, `sqlalchemy`, `psycopg`, `pydantic`, `httpx`, …).

Beim Start passiert zusätzlich:

1. `Base.metadata.create_all` — legt fehlende Tabellen an.
2. Leichte „Inline-Migration“: alte Spalten (`created_at`, `watched_at`) droppen, neue (`started_at`, `finished_at`) hinzufügen. Es gibt **kein Alembic** in diesem Projekt.

### Route-Mapping und Prefixes

In `main.py`:

```python
app.include_router(entries.router, prefix="/api/v1")
app.include_router(igdb.router, prefix="/api/v1")
```

Die Router selbst haben eigene Prefixes (`/entries`, `/igdb`). Daraus ergeben sich die finalen Pfade:

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `GET` | `/` | Willkommens-JSON |
| `GET` | `/health` | Healthcheck für Render |
| `GET` | `/ping-db` | `SELECT 1` gegen PostgreSQL |
| `GET` | `/api/v1/entries` | Alle Einträge |
| `POST` | `/api/v1/entries` | Neuen Eintrag anlegen (201) |
| `PUT` | `/api/v1/entries/{id}` | Eintrag aktualisieren |
| `DELETE` | `/api/v1/entries/{id}` | Eintrag löschen (204) |
| `GET` | `/api/v1/igdb/cover?name=…` | Cover + `external_id` von IGDB |

`redirect_slashes=True` und doppelte Routen (`""` und `"/"`) verhindern 307/404-Probleme, wenn Clients mal mit und mal ohne trailing slash aufrufen.

### Datenbankverbindung

```python
# database.py
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

FastAPI nutzt `Depends(get_db)`: Pro Request wird eine Session geöffnet und danach zuverlässig geschlossen. Die URL kommt aus der Umgebung (lokal `.env`, auf Render Environment Variables) — typischerweise eine Neon-Connection-String mit `sslmode=require`.

### CORS Middleware — warum nötig?

Frontend und Backend liegen auf **verschiedenen Origins** (zwei Render-Services = zwei Domains). Browser blockieren Cross-Origin-Requests ohne passende CORS-Header.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Einfach erklärt:**

- Der Browser fragt vor bestimmten Requests oft per **OPTIONS** (Preflight): „Darf die Seite von Origin A die API auf Origin B ansprechen?“
- Die Middleware antwortet mit `Access-Control-Allow-Origin` usw.
- `allow_origins=["*"]` erlaubt alle Origins — praktisch für Static Site + API auf getrennten Hosts.
- Bei `*` müssen Credentials (`allow_credentials`) **aus** sein (Browser-Regel).

Ohne CORS siehst du im Browser-Netzwerk-Tab Fehler wie „blocked by CORS policy“, obwohl das Backend lokal mit curl funktioniert.

### Authentifizierung: Twitch OAuth + IGDB

IGDB verlangt Twitch-Developer-Credentials. Der Flow ist **Client Credentials** (App-zu-App), **kein** Login für Endnutzer:

```
1. Backend liest TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET
2. POST https://id.twitch.tv/oauth2/token  (grant_type=client_credentials)
3. Access Token wird im Speicher gecacht (inkl. Ablaufzeit, Refresh ~60s vorher)
4. POST https://api.igdb.com/v4/games  mit Header:
      Client-ID + Authorization: Bearer <token>
5. Antwort → Cover-URL + external_id (igdb_<id>)
```

Relevanter Code in `app/igdb.py` (`get_access_token`, `fetch_cover_by_name`). Der Router `app/routers/igdb.py` mappt Fehler sauber:

- ungültige Eingabe → **400**
- kein Treffer / kein Cover → **404**
- HTTP-Fehler zu Twitch/IGDB → **502**

Das Frontend ruft nur den eigenen Proxy auf (`/api/v1/igdb/cover`) — Twitch-Secrets bleiben serverseitig.

---

## 4. 🗄️ Database & Models

### Schema (`media_entries`)

ORM-Modell in `backend/app/models.py`:

| Spalte | Typ | Pflicht | Bedeutung |
|--------|-----|---------|-----------|
| `id` | Integer (PK) | ja | Primärschlüssel |
| `title` | String | ja | Titel |
| `media_type` | String | ja | `Movie`, `Series`, `Anime`, `Game`, `DLC` |
| `status` | String | ja | z. B. `Watching`, `Playing`, `Finished`, … |
| `external_id` | String | ja | `igdb_123` oder `manual_<timestamp>` |
| `poster_path` | String | nein | Absolute Cover-URL |
| `started_at` | TIMESTAMPTZ | nein | Startdatum |
| `finished_at` | TIMESTAMPTZ | nein | Enddatum |

**Status-Regeln** (`enums.py` + Pydantic-Validator):

- Game / DLC: Playing, Finished, Dropped, Shelved, Backlog, Wishlist  
- Movie / Series / Anime: Watching, Finished, Dropped, Watchlist  

Ungültige Kombinationen werden schon bei der API-Validierung abgelehnt — bevor etwas in die DB geschrieben wird.

### Datenfluss: Klick → DB → UI

Beispiel: **Neuen Eintrag speichern**

```
1. User klickt „Save“ in AddMediaModal
2. useCreateMediaEntryMutation() sendet POST
   → {BASE}/entries  (BASE = NEXT_PUBLIC_API_URL = …/api/v1)
3. FastAPI: schemas.MediaEntryCreate validiert Typ/Status
4. Router create_entry:
      db.add(MediaEntry(...)); db.commit(); db.refresh(...)
5. PostgreSQL speichert die Zeile, ID kommt zurück
6. JSON-Response (MediaEntryResponse) geht an den Browser
7. RTK Query: invalidatesTags(['MediaEntries'])
8. useGetMediaEntriesQuery lädt die Liste neu
9. LibraryView rendert Grid/List mit dem neuen Eintrag
```

**Lesen** ist kürzer: Mount von `LibraryView` → GET `/entries` → `db.query(MediaEntry).all()` → Cache → Filter/Sort im Client.

---

## 5. ☁️ Deployment & Production Infrastructure

### Zwei Render-Services

Es gibt **kein** `render.yaml` / Dockerfile im Repo — das Setup steht im README und folgt diesem Muster:

| Service-Typ | Was wird deployed? | Start / Publish |
|-------------|--------------------|-----------------|
| **Static Site** | `frontend/out` nach `next build` | Nur statische Dateien |
| **Web Service** | Ordner `backend/` | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

**Environment Variables:**

| Ort | Variablen |
|-----|-----------|
| Backend (Web Service) | `DATABASE_URL`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` |
| Frontend (Build der Static Site) | `NEXT_PUBLIC_API_URL` = **Web-Service-URL + `/api/v1`** |

Nicht die Static-Site-Domain als API-URL setzen — dort liegt kein FastAPI.

### Typische Stolperfallen (und wie sie gelöst wurden)

| Problem | Ursache | Lösung im Projekt |
|---------|---------|-------------------|
| **404 / Slash-Mismatch** | `/entries` vs `/entries/` | `redirect_slashes=True` + Routen für `""` und `"/"` |
| **Doppelte Base-URL** | Env enthält schon Host, Endpoint hängt Host nochmal an → `https://x/https://x/api/v1` | Relative Endpoints (`/entries`) + `resolveApiBaseUrl()` bereinigt Duplikate |
| **CORS-Fehler** | Frontend-Origin ≠ Backend-Origin | `CORSMiddleware` mit `allow_origins=["*"]` |
| **Cold Starts** | Free-Tier Web Service schläft ein → erster Request langsam oder Timeout | `/health` für Monitoring; nach Wake-up normale Latenz; ggf. Warmhalten/Upgrade |
| **Env nur zur Build-Zeit** | `NEXT_PUBLIC_*` ändert sich nicht zur Laufzeit | Nach API-URL-Änderung Frontend neu bauen |
| **Bilder kaputt nach Export** | Image Optimization braucht Server | `images.unoptimized: true` |

Lokal testen:

```bash
# Backend
cd backend && uvicorn app.main:app --reload
# → http://127.0.0.1:8000/docs

# Frontend
cd frontend && npm run dev
# → NEXT_PUBLIC_API_URL optional; Default zeigt auf :8000/api/v1
```

---

## 6. 💡 Key Takeaways for Learning

Fünf Konzepte, die dieses Projekt konkret zeigt:

### 1. REST APIs

Klare Ressourcen und HTTP-Verben: `GET/POST/PUT/DELETE` auf `/api/v1/entries`. Versionierung über den Prefix `/api/v1` macht spätere Breaking Changes kontrollierbar, ohne alte Clients sofort zu brechen.

### 2. CORS

Wenn Frontend und Backend auf verschiedenen Domains laufen, entscheidet der Browser anhand von CORS-Headern, ob der Call erlaubt ist. Ohne Middleware „funktioniert curl, aber nicht die Website“.

### 3. Environment Variables bei Static Exports

`NEXT_PUBLIC_API_URL` wird **eingebaut**, nicht zur Laufzeit gelesen. Das ist der Preis (und die Einfachheit) von Static Hosting: kein Server, der Secrets oder Config nachliefern könnte.

### 4. State Management (RTK Query + UI Slice)

- **Server-State** (Einträge von der API): Caching, Loading, Error, automatisches Refetch nach Mutations.  
- **UI-State** (Filter, Modal): lokaler Redux-Slice.  
Trennung hält Komponenten schlank und vermeidet doppelte Fetch-Logik.

### 5. ORMs (SQLAlchemy) + Schema-Validierung (Pydantic)

- SQLAlchemy mappt Python-Klassen auf Tabellenzeilen.  
- Pydantic prüft eingehende JSON-Bodies (Enums, erlaubte Status-Kombinationen), bevor sie persistiert werden.  
So bleiben Datenbank und API-Vertrag synchron und Fehler landen früh als 422/400 statt als korrupte DB-Zeilen.

---

## Schnelle Orientierung im Repo

```
MediaVault/
├── PROJECT_EXPLAINER.md     ← diese Datei
├── README.md                ← Setup & Deploy-Kurznotizen
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py          ← App, CORS, Router, /health
│       ├── database.py      ← Engine + get_db()
│       ├── models.py        ← MediaEntry (ORM)
│       ├── schemas.py       ← Pydantic Create/Response
│       ├── enums.py         ← MediaType / MediaStatus
│       ├── igdb.py          ← Twitch Token + IGDB Cover
│       └── routers/
│           ├── entries.py   ← CRUD
│           └── igdb.py      ← GET /cover
└── frontend/
    ├── next.config.ts       ← output: "export"
    └── src/
        ├── app/page.tsx     ← einzige Bibliotheksseite
        ├── components/      ← Header, Modal, Grid, List, …
        ├── redux/           ← store, mediaApi, libraryUiSlice
        ├── lib/             ← Sort, Grouping, Dates
        └── types/media.ts   ← gemeinsame Domain-Typen
```

Wenn du eine Stelle im Code nicht verstehst, starte meist bei **`mediaApi.ts`** (Frontend-Netzwerk) oder **`routers/entries.py`** (Backend-CRUD) — von dort aus lässt sich jeder Klick bis in die Neon-Datenbank nachverfolgen.
