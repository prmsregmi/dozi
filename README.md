# Dozi

AI-powered sales conversation assistant that provides real-time insights during calls, meetings, and interviews.

## Architecture

Each service is independently deployed — there is no monolithic setup.

```
User's Browser
  ├── Supabase (direct)          — auth, conversations, transcriptions, battle_cards, preferences
  ├── LLM Service (FastAPI)      — model registry, LiveKit tokens, battlecard generation, prompts
  └── LiveKit Cloud (WebSocket)  — audio streaming
       └── Transcription Agent  — STT via Deepgram/OpenAI
            └── LLM Service     — GET /models at startup
```

The **LLM Service** is stateless and has no database connection — it handles battle card generation, LiveKit room/token management, and serves the model registry. The **Transcription Agent** runs in LiveKit Cloud and handles all STT. **Supabase** is accessed directly from the frontend for all persistence.

## Tech Stack

- **LLM Service**: FastAPI, Python 3.13+, uv
- **Frontend**: React 18, TypeScript, Vite, pnpm
- **Database**: Supabase (PostgreSQL + Auth)
- **Audio/Transcription**: LiveKit Cloud, Deepgram Nova-3 (streaming STT)
- **AI**: Groq (battle cards), OpenAI (fallback)

## Setup

### 1. Supabase

Requires [Node.js](https://nodejs.org/) (for npx). Create a project at https://supabase.com, then run the migration:

```bash
npx supabase login
npx supabase link
npx supabase db push
```

### 2. LLM Service

```bash
cd llm_service
cp .env.example .env
# Fill in: OPENAI_API_KEY, LIVEKIT_*, AUTH_JWKS_URL values
```

**Option A: Direct (recommended for development)**

```bash
uv sync
PYTHONPATH=. uv run uvicorn llm_service.main:app --reload
```

**Option B: Docker**

```bash
docker compose up -d --build   # from llm_service/
```

LLM service runs at `http://localhost:8000`

### 3. Transcription Agent

Install LiveKit CLI:

```bash
brew install livekit-cli                          # macOS
curl -sSL https://get.livekit.io/cli | bash       # Linux
```

Deploy agent:

```bash
lk cloud auth
cd agents/
lk agent create --project dozi
```

Set `DEEPGRAM_API_KEY` (and optionally `OPENAI_API_KEY`) in LiveKit Cloud dashboard under **Settings → Agents**.

For local development, see [agents/README.md](agents/README.md).

### 4. Frontend

```bash
cd frontend
pnpm install

cp apps/web/.env.example apps/web/.env
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY from step 1

pnpm dev
```

Frontend runs at `http://localhost:5173`

## Project Structure

```
dozi/
├── agents/                     # LiveKit transcription agent (Deepgram/OpenAI)
│   ├── transcription_agent.py
│   ├── requirements.txt
│   └── Dockerfile
├── llm_service/                # FastAPI LLM service (self-contained)
│   ├── llm_service/            # Python package
│   │   ├── api/routes/         # battlecards, livekit, models
│   │   ├── prompts/            # Prompt loader + models
│   │   ├── services/           # Business logic
│   │   ├── schemas.py          # All Pydantic schemas
│   │   ├── auth.py             # JWT validation (Supabase JWKS)
│   │   └── settings.py         # Env config + model registry
│   ├── prompts/                # Prompt YAML files (call, meeting, interview)
│   ├── models.yaml             # Single source of truth for all model names
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/                   # React frontend (pnpm monorepo)
│   ├── apps/web/               # Main web app
│   └── packages/api-client/   # @dozi/api-client
└── supabase/                   # Database migrations
```

## Deployment

Each service deploys independently:

- **Frontend** — deploy `frontend/apps/web/` to Vercel, Netlify, or any static host
- **LLM Service** — deploy as a Docker container on any VPS

```bash
# LLM Service on VPS
git clone <repo> /opt/dozi && cd /opt/dozi/llm_service
cp .env.example .env
# Fill in real values, set CORS_ORIGINS=https://your-frontend-domain.com

docker compose up -d --build
```

Update with `git pull && docker compose up -d --build` (from `llm_service/`).

- **Transcription Agent** — deploy to LiveKit Cloud via `lk agent create`
- **Supabase** — managed service, run `supabase db push` for migrations

## Development

This project uses pre-commit hooks for code quality (Ruff + ty + ESLint + tsc). Install from the repo root:

```bash
uv sync --dev    # from llm_service/ for the uv environment
pre-commit install
```

## License

AGPL-3.0
