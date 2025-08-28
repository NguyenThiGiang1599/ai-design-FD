#!/usr/bin/env bash
set -euo pipefail

echo "🚀 WMS AI Agent v0.3.0 — macOS installer (Apple Silicon, arm64)"

# --- detect arch & basic env ---
ARCH="$(uname -m || true)"
if [[ "$ARCH" != "arm64" ]]; then
  echo "⚠️  This script is optimized for Apple Silicon (arm64). Detected: $ARCH"
  echo "    If you're on Intel, use the previous install.sh for Intel."
fi

# --- sanity checks ---
if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker not found. Install Docker Desktop: https://www.docker.com/products/docker-desktop"
  exit 1
fi

# Prefer Homebrew's ARM Python (Apple Silicon installs at /opt/homebrew)
CANDIDATES=(
  "/opt/homebrew/bin/python3.10"
  "/opt/homebrew/bin/python3.9"
  "/opt/homebrew/bin/python3.8"
  "$(command -v python3 || true)"
)

PY=""
for c in "${CANDIDATES[@]}"; do
  if [[ -x "$c" ]]; then
    PY="$c"
    break
  fi
done

if [[ -z "$PY" ]]; then
  echo "❌ No suitable python3 found."
  echo "   → Install Homebrew & Python: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
  echo "   → brew install python@3.10"
  exit 1
fi

# Warn if Python is x86_64 (Rosetta), which can cause build/issues on Apple Silicon
PY_ARCH="$($PY -c 'import platform,struct,sys; print(platform.machine())' || echo "")"
if [[ "$PY_ARCH" != "arm64" ]]; then
  echo "⚠️  Detected Python is not arm64 (machine=$PY_ARCH)."
  echo "   You appear to be using a Rosetta/x86_64 Python, which can cause problems."
  echo "   Recommended: brew install python@3.10 (Apple Silicon) → /opt/homebrew/bin/python3.10"
  read -p "Continue anyway? [y/N] " cont
  [[ "${cont:-N}" =~ ^[Yy]$ ]] || exit 1
fi

echo "👉 Using Python at: $PY ($("$PY" -V))"

# Ensure 'venv' module exists
if ! "$PY" -c "import venv" >/dev/null 2>&1; then
  echo "❌ Python at '$PY' lacks 'venv' module."
  echo "   → brew reinstall python@3.10"
  exit 1
fi

# --- create venv ---
if [[ -d ".venv" ]]; then
  echo "ℹ️  Found existing .venv"
else
  echo "👉 Creating virtual env with $PY"
  "$PY" -m venv ".venv" || { echo "❌ Failed to create venv with $PY"; exit 1; }
fi

# Ensure activate exists
if [[ ! -f ".venv/bin/activate" ]]; then
  echo "❌ .venv/bin/activate not found (venv creation failed)."
  echo "   Try: rm -rf .venv && $PY -m venv .venv"
  exit 1
fi

# shellcheck disable=SC1091
source ".venv/bin/activate"

# --- upgrade build tools & pip ---
python -m ensurepip --upgrade || true
python -m pip install --upgrade pip setuptools wheel

# --- python deps (pinned for py3.8–3.10) ---
echo "👉 Installing Python dependencies"
python -m pip install \
  "fastapi<0.100" "uvicorn[standard]<0.23" "pydantic<2" \
  jinja2 pyyaml requests streamlit qdrant-client \
  openapi-spec-validator

# --- .env template (only create if missing) ---
if [[ ! -f ".env" ]]; then
  cat > .env <<'EOF'
# Optional API keys (fill if you use LLMs)
OPENAI_API_KEY=
GOOGLE_API_KEY=

# Vector DB & Airflow settings
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=wms_kb

AIRFLOW_API_URL=http://localhost:8080/api/v1
AIRFLOW_USERNAME=airflow
AIRFLOW_PASSWORD=airflow

# Output directory
WMS_OUT_DIR=./outputs
EOF
  echo "📝 Created .env (placeholders). Fill keys if needed."
fi

# --- bring up infra (Airflow + Qdrant via Docker Compose) ---
if [[ -d "airflow" && -f "airflow/docker-compose.yml" ]]; then
  echo "🐳 Starting Docker services (Qdrant + Airflow + Postgres/Redis)..."
  (cd airflow && docker compose up -d)
else
  echo "⚠️  airflow/docker-compose.yml not found. Skipping Docker stack."
fi

echo ""
echo "✅ Install done for Apple Silicon."
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
