"""Uji massal berdasarkan labels.csv.

Pemakaian:
  python eval.py contoh              semua file di folder contoh
  python eval.py contoh_chat halus   hanya file yang namanya memuat 'halus'

Hemat kuota: hasil mentah model disimpan di .cache/, jadi file yang sudah pernah
diuji (dengan prompt yang sama) tidak memanggil API lagi.
"""
import csv, json, mimetypes, os, sys, time

os.environ.setdefault("CEKLOKER_RAG_WAJIB", "1")  # eval: jangan diam-diam lewati RAG
from pathlib import Path

from analyzer import analisis

FOLDER = Path(sys.argv[1] if len(sys.argv) > 1 else "contoh")
FILTER = sys.argv[2] if len(sys.argv) > 2 else ""
JEDA = 8  # detik antar panggilan API (tidak berlaku untuk hasil dari cache)

print("Mode RAG:", "AKTIF" if os.getenv("CEKLOKER_RAG", "1") != "0" else "MATI (pembanding)")
rows = list(csv.DictReader(open(FOLDER / "labels.csv", encoding="utf-8")))

tp = fn = fp = tn = 0
modelpakai = {}
semua = []
for r in rows:
    if FILTER not in r["file"]:
        continue
    p = FOLDER / r["file"]
    mime = mimetypes.guess_type(p.name)[0] or "image/png"
    harap = set(filter(None, r["red_flag_yang_diharapkan"].split(";")))
    try:
        h = analisis([(p.read_bytes(), mime)])
    except Exception as e:
        print(f"ERROR  {r['file']}: {str(e)[:160]}")
        continue
    dapat = {f["kode"] for f in h["red_flags"]}
    ditandai = h["risk_level"] != "Aman"
    if r["label"] == "jebakan":
        tp += ditandai; fn += (not ditandai)
    else:
        fp += ditandai; tn += (not ditandai)
    sumber = "cache" if h["_dari_cache"] else f"{h['_model']}, {h['_detik']} dtk"
    print(f"\n{r['file']}  [{r['label']}] -> {h['risk_level']} (skor {h['risk_score']})  <{sumber}>")
    print("  terlewat :", sorted(harap - dapat) or "-")
    print("  ekstra   :", sorted(dapat - harap) or "-")
    print("  rujukan  :", [r["id"] for r in h.get("rujukan", [])] or "-")
    semua.append({"file": r["file"], "label": r["label"], "hasil": h})
    modelpakai[h.get("_model", "cache")] = modelpakai.get(h.get("_model", "cache"), 0) + 1
    if not h["_dari_cache"]:
        time.sleep(JEDA)

print("\n=== RINGKASAN ===")
print("Model penilai  :", modelpakai)
if tp + fn: print(f"Recall jebakan : {tp}/{tp+fn} = {tp/(tp+fn):.0%}")
if fp + tn: print(f"Alarm palsu    : {fp}/{fp+tn} = {fp/(fp+tn):.0%}")
json.dump(semua, open("hasil_eval.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
