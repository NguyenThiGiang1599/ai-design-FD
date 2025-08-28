Write-Host "🚀 WMS AI Agent v0.3.0 — Windows installer" -ForegroundColor Cyan

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "❌ Docker not found. Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
  exit 1
}

$py = "python"
try {
  & py -3.10 --version *>$null
  if ($LASTEXITCODE -eq 0) { $py = "py -3.10" }
} catch { }

if (-not (Test-Path ".venv")) {
  Write-Host "👉 Creating virtual env with $py"
  iex "$py -m venv .venv"
}

.$PWD\.venv\Scripts\Activate.ps1

try { python -m ensurepip --upgrade | Out-Null } catch { }
python -m pip install --upgrade pip setuptools wheel

Write-Host "👉 Installing Python dependencies"
pip install `
  "fastapi<0.100" "uvicorn[standard]<0.23" "pydantic<2" `
  jinja2 pyyaml requests streamlit qdrant-client `
  openapi-spec-validator

if (-not (Test-Path ".env")) {
@"
OPENAI_API_KEY=
GOOGLE_API_KEY=
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=wms_kb
AIRFLOW_API_URL=http://localhost:8080/api/v1
AIRFLOW_USERNAME=airflow
AIRFLOW_PASSWORD=airflow
WMS_OUT_DIR=./outputs
"@ | Out-File -Encoding utf8 .env
  Write-Host "📝 Created .env (placeholders). Fill keys if needed."
}

if (Test-Path "airflow\docker-compose.yml") {
  Write-Host "🐳 Starting Docker services (Qdrant + Airflow + Postgres/Redis)..."
  Push-Location airflow
  docker compose up -d
  Pop-Location
} else {
  Write-Warning "airflow/docker-compose.yml not found. Skipping Docker stack."
}

Write-Host ""
Write-Host "✅ Install done." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1) Activate venv (if new shell): .\.venv\Scripts\Activate.ps1"
Write-Host "2) Run server:                    python -m uvicorn orchestrator.main:app --reload --port 8000"
Write-Host "3) Run UI:                        python -m streamlit run ui/streamlit_app.py"
Write-Host ""
Write-Host "Dashboards:"
Write-Host "  • API docs:   http://localhost:8000/docs"
Write-Host "  • Streamlit:  http://localhost:8501"
Write-Host "  • Airflow:    http://localhost:8080   (airflow / airflow)"
Write-Host "  • Qdrant:     http://localhost:6333"
