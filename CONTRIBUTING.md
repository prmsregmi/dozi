# Contributing to Dozi

Hey, glad you're here! Whether you're fixing a typo, squashing a bug, or building something new — all contributions are welcome. If this is your first time contributing to an open source project, don't worry. The process is straightforward and we're happy to help you through it. Feel free to open an issue or a draft PR at any stage if you want early feedback.

Contributions of any size are welcome — bug fixes, new features, prompt improvements, or just helping others with questions.

## Ways to Contribute

**Fix bugs** — stability improvements are always appreciated. Open a PR with a clear description of what broke and how you fixed it.

**Add features** — open an issue first to discuss scope before starting work on anything significant.

**Improve prompts** — the AI behavior lives in `prompts/`. If you find a prompt that produces poor results, a focused improvement here can have outsized impact.

**Help others** — answering questions in issues is a meaningful contribution even without writing code.

## Development Setup

Requirements: Python 3.13+, [uv](https://docs.astral.sh/uv/), Node.js 20+, [pnpm](https://pnpm.io/), a Supabase project, and a LiveKit account.

```bash
# Backend
uv sync --dev
uv run pre-commit install
cp .env.example .env  # fill in values

# Frontend
cd frontend && pnpm install
cd apps/web && cp .env.example .env  # fill in values
```

## Code Quality

CI enforces linting, formatting, and type checking. Pre-commit hooks handle this automatically if you've run `pre-commit install`. To run them manually:

```bash
uv run ruff check --fix .  # lint and auto-fix
uv run ruff format .       # format
uv run ty check            # type check
```

## Tests

```bash
uv run pytest
```

Add tests for any new behavior you introduce.

## Pull Requests

- Branch off `main` with a descriptive name (`feat/...`, `fix/...`)
- Keep PRs focused — one concern per PR
- Link related issues in the description
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages (`feat:`, `fix:`, `chore:`, etc.)
