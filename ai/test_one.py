"""Uji cepat satu gambar dan lihat hasilnya langsung.

Pemakaian: python test_one.py contoh/loker1.png
Hasil: cetak JSON + simpan gambar bertanda ke out_<nama>.png
"""
import json
import mimetypes
import sys
from pathlib import Path

from PIL import Image, ImageDraw

from analyzer import analisis


def main(path: str):
    p = Path(path)
    mime = mimetypes.guess_type(p.name)[0] or "image/png"
    hasil = analisis([(p.read_bytes(), mime)])
    print(json.dumps(hasil, ensure_ascii=False, indent=2))

    img = Image.open(p).convert("RGB")
    w, h = img.size
    d = ImageDraw.Draw(img)
    for f in hasil["red_flags"]:
        if f.get("box_2d") and len(f["box_2d"]) == 4:
            y1, x1, y2, x2 = f["box_2d"]
            box = (x1 / 1000 * w, y1 / 1000 * h, x2 / 1000 * w, y2 / 1000 * h)
            d.rectangle(box, outline="red", width=3)
            d.text((box[0] + 4, max(box[1] - 14, 0)), f["label"], fill="red")
    out = p.with_name(f"out_{p.stem}.png")
    img.save(out)
    print(f"\nGambar bertanda: {out}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Pemakaian: python test_one.py path/gambar.png")
    main(sys.argv[1])
