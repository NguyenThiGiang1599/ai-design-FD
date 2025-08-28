import streamlit as st,requests
st.set_page_config(page_title='WMS Agent v0.3.0',layout='wide')
st.title('WMS Design AI Agent — v0.3.0 Ingest')
api=st.text_input('Orchestrator URL','http://localhost:8000')
url=st.text_input('URL','https://en.wikipedia.org/wiki/Warehouse_management_system')
module=st.selectbox('Module',['Inbound','Outbound','Inventory','CycleCount','Unknown'])
tags=st.text_input('Tags','kb,public')
if st.button('Trigger Ingest'):
    r=requests.post(f"{api}/ingest/url",json={'url':url,'module':module,'tags':[t.strip() for t in tags.split(',') if t.strip()]}); st.write(r.status_code); st.text(r.text)
