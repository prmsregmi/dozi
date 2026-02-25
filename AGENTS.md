# Dozi — Agent Instructions

## Architecture (Mental Model)

Each service is independently deployed. Understanding data flow is critical to making correct decisions:

```
User's Browser
  ├── Supabase (direct)          — auth, conversations, transcriptions, battle_cards, preferences
  ├── LLM Service (FastAPI)      — model registry, LiveKit tokens, battlecard generation, prompts
  └── LiveKit Cloud (WebSocket)  — audio streaming
       └── Transcription Agent  — STT via Deepgram/OpenAI
            └── LLM Service     — GET /models at startup
```

**The LLM Service has no database connection.** It is stateless. Never add Supabase access to it. All persistence goes through Supabase, accessed directly from the frontend only.

## Key Files

- `llm_service/models.yaml` — single source of truth for ALL model names (LLM + STT). Never duplicate model names in code.
- `llm_service/llm_service/schemas.py` — all Pydantic schemas
- `llm_service/llm_service/settings.py` — env config + model registry loader
- `llm_service/llm_service/auth.py` — Supabase JWKS JWT validation (no DB connection)
- `llm_service/prompts/` — prompt YAML files (call, meeting, interview)
- `frontend/apps/web/` — main React app
- `agents/transcription_agent.py` — LiveKit STT agent

## Quality Checks

Run before every commit. Never bypass pre-commit hooks (`--no-verify` is not allowed).

```bash
pre-commit run --all-files   # from repo root

# Individually:
cd llm_service && uv run ruff check --fix . && uv run ruff format . && uv run ty check
cd frontend && pnpm lint && pnpm type-check
```

## Git

- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, etc.
- **Never add a co-author line to commit messages.**
- Branch off `main`: `feat/...`, `fix/...`, `chore/...`

## Coding Rules

**Config over code** — No hardcoded values in source. Everything comes from YAML config or environment variables. If a required config is missing, the service must fail with a clear error — never fall back to a default defined in code.

**Fail fast** — Missing config or dependency at startup = immediate exit with a clear message. No silent degradation.

**Simplicity over abstraction** — Write the simplest code that works. No premature generalization or unnecessary design patterns.

**Logging** — Log all errors and unexpected states. On the frontend, show users a friendly message only — real error detail goes to the console/logging service, not the UI.

**Error responses** — Backend: structured responses (HTTP status + message). Frontend: catch at source, log detail, show generic feedback.

## Known Pre-existing Issues (do not fix unless specifically tasked)

- `ty check`: 3 warnings from `groq_client` typed as `AsyncGroq | None`
- `main.tsx`: unused React import (TS6133)
