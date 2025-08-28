from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import yaml, os, json, uuid, requests
from orchestrator.tools.render import render_designpack
from orchestrator.tools.exporter import export_zip
from orchestrator.tools.validators import validate_openapi, check_api_vs_erd, check_nfr_vs_deployment
from orchestrator.llm_client import LLMClient
from orchestrator.rag_simple import load_kb as load_kb_simple, build_context as build_ctx_simple
from orchestrator.retriever_qdrant import build_context as build_ctx_qdrant

AIRFLOW_API_URL=os.environ.get('AIRFLOW_API_URL','http://localhost:8080/api/v1')
AIRFLOW_USERNAME=os.environ.get('AIRFLOW_USERNAME','airflow')
AIRFLOW_PASSWORD=os.environ.get('AIRFLOW_PASSWORD','airflow')
QDRANT_URL=os.environ.get('QDRANT_URL')

class IngestURLRequest(BaseModel):
    url: str
    module: Optional[str] = 'Unknown'
    tags: Optional[List[str]] = []
class IngestURLResponse(BaseModel):
    ok: bool
    dag_run_id: str

class GenerateRequest(BaseModel):
    requirement_yaml: str
    module: str = 'Inbound'
    llm_provider: str = 'none'
    llm_model: Optional[str] = None
    use_rag: bool = True
class GenerateResponse(BaseModel):
    ok: bool
    out_dir: str
    zip_path: str
    files: List[str]
    validation: Dict[str, Any]
    session_id: str
    download_url: Optional[str] = None

app=FastAPI(title='WMS Design AI Agent — Orchestrator',version='0.3.0')

@app.get('/healthz')
def healthz(): return {'status':'ok'}

@app.post('/ingest/url', response_model=IngestURLResponse)
def ingest_url(req: IngestURLRequest):
    dag_id='ingest_document'
    run_id=f"manual__{uuid.uuid4().hex[:8]}"
    payload={'dag_run_id':run_id,'conf':{'url':req.url,'module':req.module,'tags':req.tags}}
    r=requests.post(f"{AIRFLOW_API_URL}/dags/{dag_id}/dagRuns",auth=(AIRFLOW_USERNAME,AIRFLOW_PASSWORD),json=payload,timeout=15)
    if not r.ok: raise HTTPException(500,f'Airflow API error: {r.text}')
    return IngestURLResponse(ok=True, dag_run_id=run_id)

@app.get('/download/{session_id}')
def download(session_id:str):
    base_out=os.environ.get('WMS_OUT_DIR', os.path.join(os.getcwd(),'outputs'))
    zp=os.path.join(base_out,f'out_{session_id}.zip')
    if not os.path.exists(zp): raise HTTPException(404,'ZIP not found')
    return FileResponse(zp, media_type='application/zip', filename=f'designpack_{session_id}.zip')

@app.post('/generate', response_model=GenerateResponse)
def generate(req: GenerateRequest):
    try:
        data=yaml.safe_load(req.requirement_yaml)
        if not isinstance(data,dict): raise ValueError('Invalid YAML content')
    except Exception as e:
        raise HTTPException(400,f'YAML parse error: {e}')
    session_id=str(uuid.uuid4())[:8]
    base_out=os.environ.get('WMS_OUT_DIR', os.path.join(os.getcwd(),'outputs'))
    os.makedirs(base_out,exist_ok=True)
    out_dir=os.path.join(base_out,f'out_{session_id}')
    os.makedirs(out_dir,exist_ok=True)

    rag_ctx=''
    if req.use_rag:
        query=f"{req.module} WMS design "+' '.join([str(v) for v in data.values() if isinstance(v,(str,int,float))])
        if QDRANT_URL:
            rag_ctx=build_ctx_qdrant(query,k=6,filters={'module':req.module})
        else:
            kb_dir=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','kb'))
            docs=load_kb_simple(kb_dir)
            rag_ctx=build_ctx_simple(query,docs,k=4)

    llm=LLMClient(req.llm_provider, req.llm_model)
    assumptions=''
    if llm.available():
        sys='You are a WMS solution architect. Write crisp assumptions & gaps given requirement and KB snippets.'
        user=f"Requirement:\n{req.requirement_yaml}\n\nKB snippets:\n{rag_ctx}"
        assumptions=llm.complete(sys,user,max_tokens=400).strip()

    files=render_designpack(req.module,data,out_dir,extra={'rag_snippets':rag_ctx,'assumptions_md':assumptions or 'Assumptions auto-generated not available; please review.'})

    openapi_path=os.path.join(out_dir,f'openapi_{req.module.lower()}.json')
    erd_path=os.path.join(out_dir,f'erd_{req.module.lower()}.mmd')
    nfr_path=os.path.join(out_dir,'nfr.md')
    dep_path=os.path.join(out_dir,'deployment.mmd')
    validation={'openapi':[], 'erd_api':[], 'nfr_deployment':[]}
    validation['openapi']=validate_openapi(openapi_path)
    validation['erd_api']=check_api_vs_erd(openapi_path, erd_path)
    validation['nfr_deployment']=check_nfr_vs_deployment(nfr_path, dep_path)
    with open(os.path.join(out_dir,'validation_report.json'),'w') as f:
        json.dump(validation,f,indent=2)
    files.append('validation_report.json')

    zip_path=export_zip(out_dir)
    return GenerateResponse(ok=True,out_dir=out_dir,zip_path=zip_path,files=files,validation=validation,session_id=session_id,download_url=f'/download/{session_id}')
