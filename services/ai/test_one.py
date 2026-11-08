"""Uji cepat satu gambar dan lihat hasilnya langsung.

Pemakaian: python test_one.py contoh/loker1.png
Hasil: cetak JSON + simpan gambar bertanda ke out_<nama>.png
"""
import mimetypes
import sys
from pathlib import Path

from PIL import Image, ImageDraw

from analyzer import AnalysisFailed, analisis


def main(path: str):
    p = Path(path)
    mime = mimetypes.guess_type(p.name)[0] or "image/png"
    try:
        hasil = analisis([(p.read_bytes(), mime)])
    except AnalysisFailed as e:
        sys.exit(f"Ditolak layanan (422): {e.error_code}: {e.message}")
    print(hasil.model_dump_json(indent=2))

    img = Image.open(p).convert("RGB")
    w, h = img.size
    d = ImageDraw.Draw(img)
    for f in hasil.red_flags:
        for reg in f.regions:
            if reg.image_index != 0:
                continue
            b = reg.bbox
            box = (b.x * w, b.y * h, (b.x + b.w) * w, (b.y + b.h) * h)
            d.rectangle(box, outline="red", width=3)
            d.text((box[0] + 4, max(box[1] - 14, 0)), f.label, fill="red")
    out = p.with_name(f"out_{p.stem}.png")
    img.save(out)
    print(f"\nGambar bertanda: {out}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Pemakaian: python test_one.py path/gambar.png")
    main(sys.argv[1])
