# eval/legacy

File di folder ini adalah output evaluasi **sebelum refactor kontrak API** (Nov 2026).

Format-nya tidak kompatibel dengan schema baru (`schema.py` v2+).

| File | Keterangan |
|---|---|
| `hasil_eval_pre-refactor.json` | Output `eval.py` dengan schema lama (field Indonesia: `info`, `red_flags[].alasan`, `keyakinan`, dll). `prompt_version` dan `catalog_version` belum ada. |

**Jangan jadikan file ini sebagai baseline perbandingan.**
Baseline baru dibuat dari `labels.csv` dengan kode kanonik dari `catalog/redflags.json`,
setelah `analyzer.py` selesai direfactor.

