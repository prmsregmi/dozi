# Dozi

AI-powered sales conversation assistant that provides real-time insights during calls, meetings, and interviews.

## Architecture

```
Frontend → LiveKit Cloud ← Transcription Agent (STT via Deepgram/OpenAI)
               ↓
    Frontend polls for transcripts
               ↓ (HTTP)
    LLM Service (FastAPI) → Generates battle cards → Returns via HTTP
               ↓
    Supabase (auth + data)
```

The **LLM Service** is stateless — it handles battle card generation only. The **Transcription Agent** runs in LiveKit Cloud and handles all STT. The frontend wires them together.

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
├── agents/              # LiveKit transcription agent (Deepgram/OpenAI)
│   └── stt_models.yaml  # Supported STT models
├── llm_service/         # FastAPI LLM service (self-contained)
│   ├── llm_service/     # Python package
│   │   ├── api/routes/  # battlecards, livekit, models
│   │   ├── models/      # Schemas
│   │   ├── services/    # Business logic
│   │   └── prompts/     # Prompt loader
│   ├── prompts/         # Prompt YAML files (per mode)
│   ├── llm_models.yaml  # Supported LLM models
│   ├── stt_models.yaml  # Supported STT models (served via API)
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/            # React frontend (pnpm monorepo)
│   ├── apps/web/        # Main web app
│   └── packages/        # Shared packages (api-client, etc.)
└── supabase/            # Database migrations
```

## Docker Deployment (VPS)

```bash
git clone <repo> /opt/dozi && cd /opt/dozi/llm_service
cp .env.example .env
# Fill in real values, set CORS_ORIGINS=https://your-vercel-domain.com

docker compose up -d --build
```

Update with `git pull && docker compose up -d --build` (from `llm_service/`).

## Development

This project uses pre-commit hooks for code quality (Ruff + ty):

```bash
cd llm_service
uv sync --dev
uv run pre-commit install
```

## License

AGPL-3.0
