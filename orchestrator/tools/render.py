
from jinja2 import Environment, FileSystemLoader, select_autoescape
import os

def _env():
    here = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    tpl_dir = os.path.join(here, "templates")
    return Environment(
        loader=FileSystemLoader(tpl_dir),
        autoescape=select_autoescape([]),
        trim_blocks=True,
        lstrip_blocks=True,
    )

def _write(path: str, content: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

def render_designpack(module: str, req: dict, out_dir: str, extra: dict=None):
    env = _env()
    files = []

    # Common context
    ctx = {
        "project": req.get("project", "WMS"),
        "domain": req.get("domain", "WMS"),
        "module": module,
        "integrations": req.get("integrations", []),
        "constraints": req.get("constraints", {}),
        "tech": req.get("tech", {}),
        "users": req.get("users", 50),
        "warehouses": req.get("warehouses", 1),
        "non_functional": req.get("non_functional", {}),
    }
    if extra:
        ctx.update(extra)

    # Overview / NFR / UI
    t = env.get_template("common/overview.md.j2")
    _write(os.path.join(out_dir, "overview.md"), t.render(**ctx)); files.append("overview.md")
    t = env.get_template("common/nfr.md.j2")
    _write(os.path.join(out_dir, "nfr.md"), t.render(**ctx)); files.append("nfr.md")
    t = env.get_template("common/ui_wireframes.md.j2")
    _write(os.path.join(out_dir, "ui_wireframes.md"), t.render(**ctx)); files.append("ui_wireframes.md")

    # Module templates
    mod = module.lower()
    if mod not in ["inbound","outbound","inventory","cyclecount"]:
        raise ValueError("Unsupported module")

    base_names = [
        "c4_context.mmd.j2",
        "c4_container.mmd.j2",
        f"sequence_{mod}.mmd.j2",
        f"erd_{mod}.mmd.j2",
        "deployment.mmd.j2",
        f"openapi_{mod}.json.j2",
        f"backlog_{mod}.md.j2",
    ]
    for name in base_names:
        t = env.get_template(f"{mod}/{name}")
        out_name = name.replace(".j2","")
        _write(os.path.join(out_dir, out_name), t.render(**ctx)); files.append(out_name)

    # Assumptions
    if "assumptions_md" in ctx:
        _write(os.path.join(out_dir, "assumptions.md"), ctx["assumptions_md"]); files.append("assumptions.md")

    return files
