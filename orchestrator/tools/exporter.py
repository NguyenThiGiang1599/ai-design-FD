
import os, zipfile

def export_zip(out_dir: str) -> str:
    zip_path = out_dir.rstrip("/")+ ".zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(out_dir):
            for f in files:
                p = os.path.join(root, f)
                arc = os.path.relpath(p, out_dir)
                z.write(p, arc)
    return zip_path
