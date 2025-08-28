
import os, re, math
from collections import Counter
TOKEN_RE = re.compile(r"[A-Za-z0-9_]+")

def _tokenize(text: str):
    return [t.lower() for t in TOKEN_RE.findall(text)]

def _vec(text: str):
    toks = _tokenize(text)
    c = Counter(toks)
    import math
    norm = math.sqrt(sum(v*v for v in c.values())) or 1.0
    return c, norm

def _cosine(c1, n1, c2, n2):
    common = set(c1.keys()) & set(c2.keys())
    dot = sum(c1[k]*c2[k] for k in common)
    return dot/(n1*n2) if n1*n2 else 0.0

def load_kb(kb_dir: str):
    docs = []
    for root, _, files in os.walk(kb_dir):
        for f in files:
            if f.endswith((".md",".txt",".rst")):
                p = os.path.join(root, f)
                try:
                    docs.append((p, open(p, "r", encoding="utf-8").read()))
                except: pass
    return docs

def topk(query: str, docs, k: int = 4):
    qv = _vec(query)
    scored = []
    for path, text in docs:
        sv = _vec(text)
        scored.append((path, text, _cosine(qv[0], qv[1], sv[0], sv[1])))
    scored.sort(key=lambda x: x[2], reverse=True)
    return scored[:k]

def build_context(query: str, docs, k: int = 4) -> str:
    hits = topk(query, docs, k)
    out = []
    for path, text, score in hits:
        snippet = text[:800].strip()
        out.append(f"### {os.path.basename(path)} (score={score:.3f})\\n{snippet}")
    return "\\n\\n".join(out)
