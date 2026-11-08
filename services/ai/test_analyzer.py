"""Tes pemetaan output mentah model → AnalysisResult dan endpoint /analyze.
Tidak memanggil model sungguhan (panggil() diganti tiruan)."""
import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

import analyzer
import main
from analyzer import AnalysisFailed, bangun_hasil
from schema import AnalysisResult, RawAnalysis, RawExtracted, RawFlag


def _raw(flags=None, **kw) -> RawAnalysis:
    dasar = dict(
        summary="Ringkasan.",
        confidence=0.9,
        extracted_text="Dibutuhkan staf. Bayar Rp500.000 dulu",
        extracted=RawExtracted(country="Indonesia"),
        red_flags=flags or [],
    )
    dasar.update(kw)
    return RawAnalysis(**dasar)


def _hasil(raw, n=1, teks=None) -> AnalysisResult:
    return bangun_hasil(raw, model="m", jumlah_gambar=n, teks=teks, latency_ms=5)


def test_bbox_dikonversi_ke_xywh_skala_0_1():
    f = RawFlag(code="biaya_di_muka", quote="Bayar", reason="r", box_2d=[100, 200, 300, 600])
    r = _hasil(_raw([f])).red_flags[0].regions[0]
    assert (r.bbox.x, r.bbox.y) == (0.2, 0.1)
    assert (round(r.bbox.w, 6), round(r.bbox.h, 6)) == (0.4, 0.2)
    assert r.image_index == 0


@pytest.mark.parametrize("box", [None, [10, 10, 10, 50], [50, 50, 10, 10], [1, 2, 3], []])
def test_bbox_tidak_valid_dibuang_tanpa_error(box):
    f = RawFlag(code="biaya_di_muka", quote="x", reason="r", box_2d=box)
    assert _hasil(_raw([f])).red_flags[0].regions == []


def test_bbox_di_luar_batas_dijepit():
    f = RawFlag(code="biaya_di_muka", quote="x", reason="r", box_2d=[-50, -50, 1200, 1200])
    r = _hasil(_raw([f])).red_flags[0].regions[0]
    assert (r.bbox.x, r.bbox.y, r.bbox.w, r.bbox.h) == (0, 0, 1, 1)


def test_image_index_di_luar_jumlah_gambar_tanpa_region():
    f = RawFlag(code="biaya_di_muka", quote="x", reason="r", box_2d=[0, 0, 500, 500], image_index=2)
    assert _hasil(_raw([f]), n=2).red_flags[0].regions == []
    assert len(_hasil(_raw([f]), n=3).red_flags[0].regions) == 1


def test_input_teks_tidak_punya_region():
    f = RawFlag(code="biaya_di_muka", quote="x", reason="r", box_2d=[0, 0, 500, 500])
    assert _hasil(_raw([f]), n=0, teks="teks").red_flags[0].regions == []


def test_kode_tak_dikenal_dan_kode_data_resmi_dibuang():
    flags = [
        RawFlag(code="kode_ngawur", quote="x", reason="r"),
        RawFlag(code="tidak_ditemukan_jalur_resmi", quote="x", reason="r"),
        RawFlag(code="biaya_di_muka", quote="x", reason="r"),
    ]
    assert [f.code for f in _hasil(_raw(flags)).red_flags] == ["biaya_di_muka"]


def test_level_huruf_kecil_dan_skor_dari_katalog():
    flags = [RawFlag(code="paspor_ditahan", quote="x", reason="r")]
    h = _hasil(_raw(flags))
    assert h.risk_level == "bahaya"          # severity bahaya → langsung bahaya
    assert h.meta.risk_score == 4
    assert h.red_flags[0].severity == "bahaya"
    assert _hasil(_raw([])).risk_level == "aman"
    waspada = [RawFlag(code="biaya_di_muka", quote="x", reason="r")]
    assert _hasil(_raw(waspada)).risk_level == "waspada"   # skor 3


def test_kode_sama_dua_kali_dihitung_sekali():
    f = RawFlag(code="biaya_di_muka", quote="x", reason="r")
    assert _hasil(_raw([f, f])).meta.risk_score == 3


def test_needs_manual_check_dari_confidence():
    assert _hasil(_raw(confidence=0.4)).needs_manual_check is True
    assert _hasil(_raw(confidence=0.9)).needs_manual_check is False
    assert _hasil(_raw(confidence=7)).confidence == 1.0


def test_dasar_hukum_uu18_hanya_untuk_luar_negeri():
    f = RawFlag(code="tiket_tanpa_kontrak", quote="x", reason="r")  # katalog: UU 18
    dalam = _hasil(_raw([RawFlag(code="biaya_di_muka", quote="x", reason="r")]))
    assert dalam.red_flags[0].legal_basis is None
    luar = _hasil(_raw([f], extracted=RawExtracted(country="Malaysia")))
    assert luar.red_flags[0].legal_basis.startswith("UU No. 18")


def test_fingerprint_dan_meta():
    h = _hasil(_raw(extracted_text="Hubungi  WA.ME/628123  Sekarang"))
    assert h.fingerprint.raw_text == "Hubungi  WA.ME/628123  Sekarang"
    assert h.fingerprint.normalized_text == "hubungi wa.me/628123 sekarang"
    assert h.fingerprint.image_phash == []
    assert h.meta.model == "m" and h.meta.latency_ms == 5
    assert h.schema_version == "1.0"


def test_teks_pengguna_jadi_raw_text_bila_model_tidak_menyalin():
    h = _hasil(_raw(extracted_text=" "), n=0, teks="Teks dari pengguna")
    assert h.fingerprint.raw_text == "Teks dari pengguna"


@pytest.mark.parametrize("kode", ["not_a_job_posting", "no_text_found", "low_quality_image"])
def test_rejection_menjadi_analysis_failed(kode):
    with pytest.raises(AnalysisFailed) as e:
        _hasil(_raw(rejection=kode))
    assert e.value.error_code == kode


def test_tanpa_teks_dan_tanpa_flag_no_text_found():
    with pytest.raises(AnalysisFailed) as e:
        _hasil(_raw(extracted_text=""))
    assert e.value.error_code == "no_text_found"


# ───────────── endpoint ─────────────
@pytest.fixture
def klien(monkeypatch):
    main._riwayat.clear()
    main._harian.update(jumlah=0)
    monkeypatch.setattr(main, "API_KEY", "")
    return TestClient(main.app)


def _png(sisi=50) -> bytes:
    b = io.BytesIO()
    Image.new("RGB", (sisi, sisi), "white").save(b, format="PNG")
    return b.getvalue()


def _tiruan(raw):
    return lambda *a, **k: (raw, "model-tiruan")


def test_endpoint_200_sesuai_kontrak(klien, monkeypatch):
    f = RawFlag(code="biaya_di_muka", quote="Bayar", reason="r", box_2d=[0, 0, 500, 500])
    monkeypatch.setattr(analyzer, "_panggil_model", _tiruan(_raw([f])))
    monkeypatch.setattr(analyzer, "PAKAI_CACHE", False)
    r = klien.post("/analyze", files=[("files", ("a.png", _png(), "image/png"))])
    assert r.status_code == 200, r.text
    AnalysisResult.model_validate(r.json())
    assert r.json()["risk_level"] == "waspada"


def test_endpoint_422_untuk_bukan_lowongan(klien, monkeypatch):
    monkeypatch.setattr(analyzer, "_panggil_model", _tiruan(_raw(rejection="not_a_job_posting")))
    monkeypatch.setattr(analyzer, "PAKAI_CACHE", False)
    r = klien.post("/analyze", files=[("files", ("a.png", _png(), "image/png"))])
    assert r.status_code == 422
    assert r.json()["error_code"] == "not_a_job_posting"


def test_endpoint_batas_gambar_3(klien):
    files = [("files", (f"{i}.png", _png(), "image/png")) for i in range(4)]
    assert klien.post("/analyze", files=files).status_code == 400


def test_endpoint_teks_9000_karakter_diterima(klien, monkeypatch):
    monkeypatch.setattr(analyzer, "_panggil_model", _tiruan(_raw()))
    monkeypatch.setattr(analyzer, "PAKAI_CACHE", False)
    assert klien.post("/analyze", data={"teks": "a" * 9000}).status_code == 200
    assert klien.post("/analyze", data={"teks": "a" * 10001}).status_code == 400


def test_endpoint_api_key(klien, monkeypatch):
    monkeypatch.setattr(main, "API_KEY", "rahasia")
    assert klien.post("/analyze", data={"teks": "x"}).status_code == 401
    monkeypatch.setattr(analyzer, "_panggil_model", _tiruan(_raw()))
    monkeypatch.setattr(analyzer, "PAKAI_CACHE", False)
    ok = klien.post("/analyze", data={"teks": "x"}, headers={"X-API-Key": "rahasia"})
    assert ok.status_code == 200


def test_endpoint_error_model_502_tanpa_bocor_detail(klien, monkeypatch):
    def meledak(*a, **k):
        raise RuntimeError("rahasia internal")
    monkeypatch.setattr(analyzer, "_panggil_model", meledak)
    monkeypatch.setattr(analyzer, "PAKAI_CACHE", False)
    r = klien.post("/analyze", data={"teks": "x"})
    assert r.status_code == 502 and "rahasia" not in r.text


def test_endpoint_rate_limit(klien, monkeypatch):
    monkeypatch.setattr(main, "RATE_PER_MIN", 2)
    monkeypatch.setattr(analyzer, "_panggil_model", _tiruan(_raw()))
    monkeypatch.setattr(analyzer, "PAKAI_CACHE", False)
    kode = [klien.post("/analyze", data={"teks": "x"}).status_code for _ in range(3)]
    assert kode == [200, 200, 429]
