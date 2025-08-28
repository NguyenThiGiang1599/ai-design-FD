from datetime import datetime
from airflow import DAG
from airflow.operators.python import PythonOperator
import os,re,requests,hashlib
from bs4 import BeautifulSoup

OPENAI_API_KEY=os.environ.get('OPENAI_API_KEY')
QDRANT_URL=os.environ.get('QDRANT_URL','http://qdrant:6333')
QCOL=os.environ.get('QDRANT_COLLECTION','wms_kb')
EMB_DIM=int(os.environ.get('EMBED_DIM','1536'))

def clean(t):
    return re.sub(r'\s+',' ',t).strip()

def fetch(url):
    r=requests.get(url,timeout=60); r.raise_for_status()
    if 'html' in r.headers.get('content-type',''):
        soup=BeautifulSoup(r.text,'lxml')
        for s in soup(['script','style','noscript']): s.decompose()
        return clean(soup.get_text(' '))[:200000]
    return clean(r.text)[:200000]

def chunk(txt):
    size=1000
    return [txt[i:i+size] for i in range(0,len(txt),size)][:200]

def embed(ch):
    try:
        if OPENAI_API_KEY:
            import openai
            client=openai.OpenAI(api_key=OPENAI_API_KEY)
            resp=client.embeddings.create(model='text-embedding-3-small',input=ch)
            return resp.data[0].embedding
    except Exception:
        pass
    v=[0.0]*EMB_DIM
    for tok in re.findall(r'[A-Za-z0-9_]+',ch.lower()):
        v[hash(tok)%EMB_DIM]+=1.0
    import math
    n=math.sqrt(sum(x*x for x in v)) or 1.0
    return [x/n for x in v]

def ensure_collection():
    r=requests.get(f"{QDRANT_URL}/collections/{QCOL}")
    if r.status_code==200: return
    payload={'vectors':{'size':EMB_DIM,'distance':'Cosine'}}
    rc=requests.put(f"{QDRANT_URL}/collections/{QCOL}",json=payload); rc.raise_for_status()

def upsert(chunks,url,module,tags):
    ensure_collection()
    pts=[]
    for i,c in enumerate(chunks):
        pts.append({'id':int(hashlib.md5(f"{url}-{i}".encode()).hexdigest(),16)%(2**63-1),
                    'vector':embed(c),
                    'payload':{'source':'url','uri':url,'chunk_index':i,'module':module,'tags':tags or []}})
    body={'points':pts}
    r=requests.put(f"{QDRANT_URL}/collections/{QCOL}/points?wait=true",json=body); r.raise_for_status()
    return len(pts)

def run(url,module='Unknown',tags=None,**ctx):
    text=fetch(url)
    ch=chunk(text)
    n=upsert(ch,url,module,tags or [])
    return {'chunks':len(ch),'upserted':n}

with DAG('ingest_document',start_date=datetime(2025,1,1),schedule_interval=None,catchup=False) as dag:
    t=PythonOperator(task_id='ingest_url',python_callable=run,
        op_kwargs={'url':'{{ dag_run.conf["url"] }}','module':'{{ dag_run.conf.get("module","Unknown") }}','tags':'{{ dag_run.conf.get("tags",[]) }}'})
