#!/usr/bin/env bash
set -euo pipefail

echo "🚀 WMS AI Agent v0.3.0 — macOS installer (Intel/Apple)"

command -v python3 >/dev/null 2>&1 || { echo "❌ python3 not found. Install via Homebrew: brew install python@3.10"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found. Install Docker Desktop first: https://www.docker.com/products/docker-desktop"; exit 1; }

if command -v python3.10 >/dev/null 2>&1; then
  PY=python3.10
else
  PY=python3
fi

if [ ! -d ".venv" ]; then
  echo "👉 Creating virtual env with $PY"
  $PY -m venv .venv
fi

source .venv/bin/activate
python -m ensurepip --upgrade || true
python -m pip install --upgrade pip setuptools wheel

echo "👉 Installing Python dependencies"
python -m pip install   "fastapi<0.100" "uvicorn[standard]<0.23" "pydantic<2"   jinja2 pyyaml requests streamlit qdrant-client   openapi-spec-validator

if [ ! -f ".env" ]; then
  cat > .env <<'EOF'
OPENAI_API_KEY=
GOOGLE_API_KEY=
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=wms_kb
AIRFLOW_API_URL=http://localhost:8080/api/v1
AIRFLOW_USERNAME=airflow
AIRFLOW_PASSWORD=airflow
WMS_OUT_DIR=./outputs
EOF
  echo "📝 Created .env (placeholders). Fill keys if needed."
fi

if [ -d "airflow" ] && [ -f "airflow/docker-compose.yml" ]; then
  echo "🐳 Starting Docker services (Qdrant + Airflow + Postgres/Redis)..."
  (cd airflow && docker compose up -d)
else
  echo "⚠️  airflow/docker-compose.yml not found. Skipping Docker stack."
fi

echo ""
echo "✅ Install done."
echo ""
echo "Next steps:"
echo "1) Activate venv:   source .venv/bin/activate"
echo "2) Run server:      python -m uvicorn orchestrator.main:app --reload --port 8000"
echo "3) Run UI:          python -m streamlit run ui/streamlit_app.py"
echo ""
echo "Dashboards:"
echo "  • API docs:   http://localhost:8000/docs"
echo "  • Streamlit:  http://localhost:8501"
echo "  • Airflow:    http://localhost:8080   (airflow / airflow)"
echo "  • Qdrant:     http://localhost:6333"
