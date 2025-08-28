import os,requests,math,re
QDRANT_URL=os.environ.get('QDRANT_URL')
QCOL=os.environ.get('QDRANT_COLLECTION','wms_kb')
EMB_DIM=int(os.environ.get('EMBED_DIM','1536'))
OPENAI_API_KEY=os.environ.get('OPENAI_API_KEY')

def _hash_embed(text,dim=EMB_DIM):
    v=[0.0]*dim
    for tok in re.findall(r'[A-Za-z0-9_]+',text.lower()): v[hash(tok)%dim]+=1.0
    n=math.sqrt(sum(x*x for x in v)) or 1.0
    return [x/n for x in v]

def _openai_embed(text):
    if not OPENAI_API_KEY:
        return _hash_embed(text)
    try:
        import openai
        client=openai.OpenAI(api_key=OPENAI_API_KEY)
        resp=client.embeddings.create(model='text-embedding-3-small',input=text)
        return resp.data[0].embedding
    except Exception:
        return _hash_embed(text)

def search(query,k=6,filters=None):
    if not QDRANT_URL: return []
    vec=_openai_embed(query)
    body={'vector':vec,'limit':k,'with_payload':True}
    if filters:
        body['filter']={'must':[{'key':kk,'match':{'value':vv}} for kk,vv in filters.items()]}
    r=requests.post(f"{QDRANT_URL}/collections/{QCOL}/points/search",json=body,timeout=20)
    if not r.ok: return []
    return r.json().get('result',[])

def build_context(query,k=6,filters=None):
    hits=search(query,k,filters)
    if not hits: return ''
    parts=[]
    for h in hits:
        pl=h.get('payload',{})
        parts.append(f"- [{h.get('score',0):.3f}] {pl.get('uri','')}#{pl.get('chunk_index','?')}")
    return 'Top hits from Qdrant:\n'+'\n'.join(parts)
