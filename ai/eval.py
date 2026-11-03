import csv, json, mimetypes, sys, time
from pathlib import Path
from analyzer import analisis

FOLDER = Path(sys.argv[1] if len(sys.argv) > 1 else "contoh")
rows = list(csv.DictReader(open(FOLDER / "labels.csv", encoding="utf-8")))

tp = fn = fp = tn = 0
semua = []
for r in rows:
    p = FOLDER / r["file"]
    mime = mimetypes.guess_type(p.name)[0] or "image/png"
    harap = set(filter(None, r["red_flag_yang_diharapkan"].split(";")))
    try:
        h = analisis([(p.read_bytes(), mime)])
    except Exception as e:
        print(f"ERROR  {r['file']}: {str(e)[:100]}")
        continue
    dapat = {f["kode"] for f in h["red_flags"]}
    ditandai = h["risk_level"] != "Aman"
    if r["label"] == "jebakan":
        tp += ditandai; fn += (not ditandai)
    else:
        fp += ditandai; tn += (not ditandai)
    print(f"\n{r['file']}  [{r['label']}] -> {h['risk_level']} (skor {h['risk_score']})")
    print("  terlewat :", sorted(harap - dapat) or "-")
    print("  ekstra   :", sorted(dapat - harap) or "-")
    semua.append({"file": r["file"], "label": r["label"], "hasil": h})
    time.sleep(2)

print("\n=== RINGKASAN ===")
if tp + fn: print(f"Recall jebakan : {tp}/{tp+fn} = {tp/(tp+fn):.0%}")
if fp + tn: print(f"Alarm palsu    : {fp}/{fp+tn} = {fp/(fp+tn):.0%}")
json.dump(semua, open("hasil_eval.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)