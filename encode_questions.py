#!/usr/bin/env python3
import json, subprocess
import numpy as np
from pathlib import Path

SEED_JS = Path(__file__).parent / "seed-questions.js"
PUBLIC  = Path(__file__).parent / "public"
IMG_DIR = PUBLIC / "assets" / "images"
OUTPUT  = Path(__file__).parent / "seed-questions.js"
TEMPERATURE = 0.5
GRID_PAD = 12

def load_questions():
    r = subprocess.run(["node","-e","const q=require('./seed-questions.js');process.stdout.write(JSON.stringify(q))"],
        capture_output=True,text=True,cwd=str(SEED_JS.parent))
    if r.returncode!=0: raise RuntimeError(r.stderr)
    return json.loads(r.stdout)

def encode_all(questions):
    import torch, clip
    from PIL import Image
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading CLIP ViT-B/32 on {device} ...")
    model, preprocess = clip.load("ViT-B/32", device=device)
    model.eval()
    text_set = set()
    for q in questions:
        for cl in q["clusters"]: text_set.add(f"a photo of a {cl['name']}")
    text_list = sorted(text_set)
    print(f"Encoding {len(text_list)} text prompts ...")
    with torch.no_grad():
        tokens = clip.tokenize(text_list, truncate=True).to(device)
        feats = []
        for i in range(0, len(tokens), 64): feats.append(model.encode_text(tokens[i:i+64]).float())
        text_feats = torch.cat(feats, dim=0)
        text_feats = text_feats / text_feats.norm(dim=-1, keepdim=True)
    text_feats_np = text_feats.cpu().numpy()
    text_to_idx = {p:i for i,p in enumerate(text_list)}
    print(f"Encoding {len(questions)} specimen images ...")
    img_feats = {}
    for q in questions:
        qid = q["id"]
        if qid in img_feats: continue
        src = q["guess"]["src"]
        fpath = PUBLIC / src.lstrip("/")
        if not fpath.exists(): fpath = IMG_DIR / src.split("/")[-1]
        if not fpath.exists(): print(f"  MISSING: {fpath}"); continue
        img = preprocess(Image.open(fpath).convert("RGB")).unsqueeze(0).to(device)
        with torch.no_grad():
            feat = model.encode_image(img).float()
            feat = feat / feat.norm(dim=-1, keepdim=True)
        img_feats[qid] = feat.cpu().numpy().flatten()
        print(f"  {qid}")
    return text_list, text_feats_np, text_to_idx, img_feats

def mds_2d(sim_matrix):
    n = sim_matrix.shape[0]
    D2 = (1.0 - sim_matrix) ** 2
    H = np.eye(n) - np.ones((n,n))/n
    B = -0.5 * H @ D2 @ H
    eigvals, eigvecs = np.linalg.eigh(B)
    idx = np.argsort(eigvals)[::-1][:2]
    return eigvecs[:,idx] * np.sqrt(np.maximum(eigvals[idx], 0))

def scale_to_grid(coords, pad=GRID_PAD):
    mn, mx = coords.min(0), coords.max(0)
    rng = np.where(mx-mn < 1e-6, 1.0, mx-mn)
    return pad + (coords - mn) / rng * (100 - 2*pad)

def assign_positions(questions, text_list, text_feats, text_to_idx, img_feats):
    for q in questions:
        qid = q["id"]
        clusters = q["clusters"]
        n = len(clusters)
        prompts = [f"a photo of a {cl['name']}" for cl in clusters]
        cl_feats = np.array([text_feats[text_to_idx[p]] if p in text_to_idx else np.zeros(text_feats.shape[1]) for p in prompts])
        sim_matrix = cl_feats @ cl_feats.T
        cluster_2d = scale_to_grid(mds_2d(sim_matrix)) if n >= 2 else np.array([[50.0,50.0]]*n)
        if qid in img_feats:
            img_feat = img_feats[qid]
            sims = cl_feats @ img_feat
            std = sims.std()
            sims_norm = (sims - sims.mean()) / std if std > 1e-6 else np.zeros(n)
            weights = np.exp(sims_norm / TEMPERATURE); weights /= weights.sum()
            specimen_2d = np.clip(weights @ cluster_2d, 5, 95)
            order = np.argsort(sims)[::-1]
            best = clusters[order[0]]["name"]; second = clusters[order[1]]["name"] if n>1 else best
            q["why"] = f"CLIP: '{best}' ({sims[order[0]]:.3f}), '{second}' ({sims[order[1]]:.3f}). Weights: {[round(float(w),2) for w in weights]}."
            print(f"  {qid}: best='{best}' w={[round(float(w),2) for w in weights]} t={specimen_2d.round(1)}")
        else:
            specimen_2d = np.array([50.0, 50.0]); q["why"] = "Image not found."
        for i,cl in enumerate(clusters): cl["c"] = [round(float(cluster_2d[i][0]),1), round(float(cluster_2d[i][1]),1)]
        q["t"] = [round(float(specimen_2d[0]),1), round(float(specimen_2d[1]),1)]
    return questions

def write_seed_js(questions):
    cm = {"#FF4906":"O","#00E5FF":"C","#7C3AED":"P","#FF006E":"M","#22C55E":"G","#FBBF24":"Y","#FF7A3D":"S"}
    lines = ['// EmbedGuessr v4 -- text-text MDS + image-text similarity', f'// {len(questions)} questions',
             'const O="#FF4906",C="#00E5FF",P="#7C3AED",M="#FF006E",G="#22C55E",Y="#FBBF24",S="#FF7A3D";','module.exports = [']
    for q in questions:
        clp = [f'{{name:"{cl["name"]}",color:{cm.get(cl["color"],repr(cl["color"]))},c:[{cl["c"][0]},{cl["c"][1]}]}}' for cl in q["clusters"]]
        g = q["guess"]
        tut = "tutorial:true," if q.get("tutorial") else ""
        lines.append(f'{{id:"{q["id"]}",{tut}difficulty:"{q["difficulty"]}",dims:2,\n clusters:[{",".join(clp)}],\n guess:{{type:"{g["type"]}",src:"{g["src"]}",name:"{g["name"]}",caption:{json.dumps(g["caption"])}}},\n t:[{q["t"][0]},{q["t"][1]}],why:{json.dumps(q.get("why",""))}}},')
    lines.append('];')
    OUTPUT.write_text("\n".join(lines))
    print(f"\nWritten: {OUTPUT}\nNext: rm -f data/questions.json && npm start")

def main():
    questions = load_questions()
    print(f"Loaded {len(questions)} questions")
    text_list, text_feats, text_to_idx, img_feats = encode_all(questions)
    questions = assign_positions(questions, text_list, text_feats, text_to_idx, img_feats)
    write_seed_js(questions)

if __name__ == "__main__":
    main()
