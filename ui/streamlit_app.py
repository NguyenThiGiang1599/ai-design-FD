import streamlit as st, requests

st.set_page_config(page_title="WMS Design AI Agent", layout="wide")
st.title("WMS Design AI Agent — Enhanced")

default_yaml = """project: FHM WMS Hackathon
domain: WMS
module: Inbound
integrations:
  - SAP S/4 (IDoc ASN, GR)
  - Zebra Printer (GS1-128)
users: 200
warehouses: 5
constraints:
  latency_scan_ms: 300
  offline_mobile: true
tech:
  backend: NestJS
  db: Postgres
  mq: RabbitMQ
  web: Next.js
  mobile: Android (Kotlin)
non_functional:
  uptime: "99.9%"
  audit: true
"""

api = st.text_input("Orchestrator URL", "http://localhost:8000")
req_yaml = st.text_area("Requirement YAML", default_yaml, height=420)

c1, c2, c3 = st.columns(3)
module = c1.selectbox("Module", ["Inbound", "Outbound", "Inventory", "CycleCount"])
llm_provider = c2.selectbox("LLM Provider", ["none", "openai", "gemini", "ollama"])
use_rag = c3.checkbox("Use RAG (KB)", True)

if st.button("Generate Design Pack"):
    try:
        payload = {
            "requirement_yaml": req_yaml,
            "module": module,
            "llm_provider": llm_provider,
            "use_rag": use_rag,
        }
        r = requests.post(f"{api}/generate", json=payload, timeout=180)
        if r.ok:
            data = r.json()
            st.success("Generated!")

            # Hiển thị báo cáo validation trước
            if "validation" in data:
                st.subheader("Validation Report")
                st.json(data["validation"])

            # Link tải ZIP ưu tiên dùng endpoint /download/{session_id}
            dl_url = data.get("download_url")
            if dl_url:
                full_dl = f"{api}{dl_url}"
                st.markdown(f"[⬇️ Download DesignPack ZIP]({full_dl})")
            else:
                # Fallback hiển thị đường dẫn cục bộ trên server
                st.code(data.get("zip_path", ""), language="bash")

        else:
            st.error(r.text)
    except Exception as e:
        st.error(str(e))

st.caption(
    "Tip: Set env OPENAI_API_KEY hoặc GOOGLE_API_KEY nếu dùng LLM. "
    "Có thể đặt WMS_OUT_DIR để chỉ định thư mục lưu output (mặc định ./outputs)."
)
