# WMS Design AI Agent — v0.2.0

Hackathon-ready agent that generates a WMS *Design Pack* from a structured requirement (YAML).
Now with **LLM stubs**, **simple RAG**, **extra modules** (Outbound, Inventory, CycleCount),
and **validators** (OpenAPI, ERD↔API, NFR↔Deployment).

## Quickstart (Python 3.8.x friendly)
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-38.txt
uvicorn orchestrator.main:app --reload --host 0.0.0.0 --port 8000
# Optional UI
pip install streamlit requests
streamlit run ui/streamlit_app.py
```

## Optional extras
```bash
./setup_extras.sh   # installs requests + openai + google-generativeai + openapi-spec-validator
```

Then open:
- API docs: http://localhost:8000/docs
- Streamlit UI: http://localhost:8501

See `validation_report.json` in each generated output folder for validation results.
