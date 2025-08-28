#!/bin/bash
set -e
echo "🔧 Installing optional extras for LLM + validation (Python 3.8.x)"
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
pip install requests || true
pip install openai google-generativeai || true
pip install openapi-spec-validator || true
echo "Done."
