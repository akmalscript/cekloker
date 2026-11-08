import csv, json, mimetypes, sys, time
from pathlib import Path
from analyzer import AnalysisFailed, analisis

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
        dapat = {f.code for f in h.red_flags}
        level, skor = h.risk_level, h.meta.risk_score
        ditandai = level != "aman"
        hasil = h.model_dump(mode="json")
    except AnalysisFailed as e:
        # Ditolak layanan (bukan lowongan, tanpa teks, buram): tidak ditandai berisiko
        dapat, level, skor, ditandai = set(), f"ditolak:{e.error_code}", 0, False
        hasil = {"ditolak": e.error_code}
    except Exception as e:
        print(f"ERROR  {r['file']}: {str(e)[:100]}")
        continue
    if r["label"] == "jebakan":
        tp += ditandai; fn += (not ditandai)
    else:
        fp += ditandai; tn += (not ditandai)
    print(f"\n{r['file']}  [{r['label']}] -> {level} (skor {skor})")
    print("  terlewat :", sorted(harap - dapat) or "-")
    print("  ekstra   :", sorted(dapat - harap) or "-")
    semua.append({"file": r["file"], "label": r["label"], "hasil": hasil})
    time.sleep(2)

print("\n=== RINGKASAN ===")
if tp + fn: print(f"Recall jebakan : {tp}/{tp+fn} = {tp/(tp+fn):.0%}")
if fp + tn: print(f"Alarm palsu    : {fp}/{fp+tn} = {fp/(fp+tn):.0%}")
json.dump(semua, open("hasil_eval.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
