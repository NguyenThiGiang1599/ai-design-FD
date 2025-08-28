
import json, re

def validate_openapi(openapi_path: str):
    issues = []
    try:
        data = json.load(open(openapi_path,"r"))
        try:
            from openapi_spec_validator import validate_spec  # optional
            validate_spec(data)
        except Exception as e:
            if "openapi" not in data: issues.append("Missing 'openapi' field.")
            if "paths" not in data: issues.append("Missing 'paths' object.")
    except Exception as e:
        issues.append(f"Cannot parse OpenAPI JSON: {e}")
    return issues

def _parse_erd_fields(erd_text: str):
    fields = []
    entity_block_re = re.compile(r"\{\{(.+?)\}\}", re.DOTALL)
    for block in entity_block_re.findall(erd_text):
        for line in block.splitlines():
            parts = line.strip().split()
            if len(parts) >= 2:
                fields.append(parts[1])
    return list(sorted(set([f for f in fields if f.isidentifier()])))

def _openapi_props(data):
    props = set()
    def walk(node):
        if isinstance(node, dict):
            for k,v in node.items():
                if k == "properties" and isinstance(v, dict):
                    for p in v.keys():
                        props.add(p)
                walk(v)
        elif isinstance(node, list):
            for it in node:
                walk(it)
    walk(data)
    return sorted(props)

def check_api_vs_erd(openapi_json_path: str, erd_path: str):
    issues = []
    try:
        data = json.load(open(openapi_json_path,"r"))
        props = set(_openapi_props(data))
    except Exception as e:
        return [f"OpenAPI parse failed: {e}"]

    try:
        erd_text = open(erd_path,"r",encoding="utf-8").read()
        fields = set(_parse_erd_fields(erd_text))
    except Exception as e:
        return [f"ERD parse failed: {e}"]

    must_have = {"lpn","sku","qty","bin"}
    missing = (must_have & props) - fields
    if missing:
        issues.append(f"ERD missing fields that appear in API: {sorted(list(missing))}")
    if not (props & fields):
        issues.append("No overlap between API properties and ERD fields (check naming).")
    return issues

def check_nfr_vs_deployment(nfr_md_path: str, deployment_mmd_path: str):
    issues = []
    try:
        nfr = open(nfr_md_path,"r",encoding="utf-8").read().lower()
        dep = open(deployment_mmd_path,"r",encoding="utf-8").read().lower()
    except Exception as e:
        return [f"Read error: {e}"]

    m = re.search(r"latency.*?(\d+)\s*ms", nfr)
    if m:
        target = int(m.group(1))
        if target <= 300:
            if "rabbitmq" not in dep and "kafka" not in dep:
                issues.append("NFR 300ms target but no message queue in deployment diagram.")
            if "api gateway" not in dep and "gateway" not in dep:
                issues.append("NFR 300ms target but API Gateway not present in deployment.")
    return issues
