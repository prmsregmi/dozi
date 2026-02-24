FROM python:3.13-slim AS base

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install dependencies first for layer caching
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Copy application source
COPY llm_service/ llm_service/
COPY models.yaml prompts/ ./

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"

# Create non-root user
RUN groupadd --gid 10001 appuser && \
    useradd --uid 10001 --gid appuser --no-create-home appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "llm_service.main:app", "--host", "0.0.0.0", "--port", "8000"]
