# Dozi

AI-powered sales conversation assistant that provides real-time transcription and insights during calls, meetings, and interviews.

## Architecture

```
Frontend → LiveKit Cloud ← Transcription Agent
    ↓ (gets transcription)
    ↓ (HTTP API call)
FastAPI Backend → Generates insights → Returns via HTTP
    ↓
Supabase (auth + data)
```

Frontend connects to LiveKit, receives transcriptions from the transcription agent, sends them to the backend API for processing, and displays returned insights.

## Tech Stack

- **Backend**: FastAPI, Python 3.13+, uv
- **Frontend**: React 18, TypeScript, Vite, pnpm
- **Database**: Supabase (PostgreSQL + Auth)
- **Audio/Transcription**: LiveKit Cloud, Deepgram Nova-3 (streaming STT)
- **AI**: Groq (battle cards), OpenAI GPT (fallback)

## Setup

### 1. Supabase

Requires [Node.js](https://nodejs.org/) (for npx). Create a project at https://supabase.com, then run the migration:

```bash
npx supabase login
npx supabase link
npx supabase db push
```

### 2. Backend

```bash
cp .env.example .env
# Fill in: OPENAI_API_KEY, LIVEKIT_*, SUPABASE_* values from step 1
```

**Option A: Direct (recommended for development)**

```bash
uv sync
uv run uvicorn src.dozi.main:app --reload
```

**Option B: Docker**

```bash
docker compose up -d --build
```

Backend runs at `http://localhost:8000`

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
├── agents/          # LiveKit transcription agent (Deepgram/OpenAI)
├── src/dozi/        # FastAPI backend
│   ├── api/routes/  # API endpoints
│   ├── models/      # Data models & schemas
│   ├── prompts/     # LLM prompt templates
│   ├── repositories/# Database access layer
│   └── services/    # Business logic
├── frontend/        # React frontend (pnpm monorepo)
│   ├── apps/web/    # Main web app
│   └── packages/    # Shared packages (api-client, etc.)
└── supabase/        # Database migrations
```

## Docker Deployment (VPS)

```bash
git clone <repo> /opt/dozi && cd /opt/dozi
cp .env.example .env
# Fill in real values, set CORS_ORIGINS=https://your-vercel-domain.com

docker compose up -d --build
```

Set up host nginx (template at `deploy/nginx/api.conf`):

```bash
sudo cp deploy/nginx/api.conf /etc/nginx/sites-available/
# Edit domain name, symlink to sites-enabled
sudo certbot --nginx -d api.yourdomain.com
sudo nginx -t && sudo systemctl reload nginx
```

Update with `git pull && docker compose up -d --build`.

## Development

This project uses pre-commit hooks for code quality (Ruff + ty):

```bash
uv sync --dev
uv run pre-commit install
```

## License

AGPL-3.0
