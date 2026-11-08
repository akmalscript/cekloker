"""Adaptor penyedia LLM. analyzer.py hanya memanggil `panggil(...)`; penyedia dipilih
lewat .env (LLM_PROVIDER). Taksonomi, skor, RAG, dan eval tidak bergantung pada penyedia.

Penyedia:
- gemini     : Google AI Studio langsung (google-genai). Bawaan.
- openrouter : API kompatibel OpenAI di openrouter.ai. Bisa memanggil Gemini yang sama
               (google/gemini-3.6-flash) atau model lain, termasuk model gratis ':free'.

Input netral: daftar bagian ("img", bytes, mime) atau ("txt", str).
"""
import base64
import json
import os
import re

import httpx
from pydantic import BaseModel


class ModelError(Exception):
    """Galat dari penyedia, dengan kode HTTP (429 = kuota/limit, 5xx = server sibuk)."""

    def __init__(self, code: int | None, pesan: str):
        super().__init__(pesan)
        self.code = code


# ---------------------------------------------------------------- Gemini langsung
_gemini_client = None


def _gemini(model: str, bagian: list, system_prompt: str, skema: type[BaseModel]) -> BaseModel:
    global _gemini_client
    from google import genai
    from google.genai import types

    if _gemini_client is None:
        _gemini_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    contents = [
        types.Part.from_bytes(data=b[1], mime_type=b[2]) if b[0] == "img" else b[1]
        for b in bagian
    ]
    try:
        resp = _gemini_client.models.generate_content(
            model=model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=skema,
                temperature=0.1,
            ),
        )
    except Exception as e:  # samakan bentuk galat untuk analyzer
        raise ModelError(getattr(e, "code", None), str(e)) from e
    return resp.parsed or skema.model_validate_json(resp.text)


# ---------------------------------------------------------------- OpenRouter
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
_http = httpx.Client(timeout=180)


def _isi_json(teks: str) -> str:
    """Ambil JSON dari jawaban model (buang ```json ... ``` bila ada)."""
    teks = teks.strip()
    m = re.search(r"```(?:json)?\s*(.*?)```", teks, re.S)
    return m.group(1).strip() if m else teks


def _post_openrouter(body: dict) -> dict:
    r = _http.post(
        OPENROUTER_URL,
        headers={
            "Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}",
            "X-Title": "CekLoker",
        },
        json=body,
    )
    if r.status_code >= 400:
        raise ModelError(r.status_code, r.text[:500])
    data = r.json()
    if "error" in data:  # OpenRouter kadang membalas 200 berisi galat
        err = data["error"]
        raise ModelError(err.get("code") if isinstance(err.get("code"), int) else None, json.dumps(err)[:500])
    return data


def _openrouter(model: str, bagian: list, system_prompt: str, skema: type[BaseModel]) -> BaseModel:
    konten = []
    for b in bagian:
        if b[0] == "img":
            url = f"data:{b[2]};base64,{base64.b64encode(b[1]).decode()}"
            konten.append({"type": "image_url", "image_url": {"url": url}})
        else:
            konten.append({"type": "text", "text": b[1]})
    skema_json = skema.model_json_schema()
    body = {
        "model": model,
        "temperature": 0.1,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": konten},
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": skema.__name__, "schema": skema_json, "strict": False},
        },
    }
    # Pembatas opsional (diatur lewat .env): batasi keluaran dan tingkat "berpikir" model
    if os.getenv("OPENROUTER_MAX_TOKENS"):
        body["max_tokens"] = int(os.environ["OPENROUTER_MAX_TOKENS"])
    nalar = os.getenv("OPENROUTER_REASONING", "").strip().lower()
    if nalar:
        body["reasoning"] = {"enabled": False} if nalar in ("off", "none", "false") else {"effort": nalar}
    try:
        data = _post_openrouter(body)
    except ModelError as e:
        # Model yang tidak mendukung json_schema: minta JSON biasa + skema di prompt
        if e.code != 400:
            raise
        body["response_format"] = {"type": "json_object"}
        body["messages"][0]["content"] = (
            system_prompt
            + "\n\nJawab HANYA dengan satu objek JSON yang sesuai skema berikut:\n"
            + json.dumps(skema_json, ensure_ascii=False)
        )
        data = _post_openrouter(body)
    isi = data["choices"][0]["message"]["content"] or ""
    try:
        return skema.model_validate_json(_isi_json(isi))
    except Exception as e:
        raise ModelError(None, f"Jawaban model bukan JSON yang sesuai skema: {isi[:300]}") from e


# ---------------------------------------------------------------- pintu masuk
def panggil(provider: str, model: str, bagian: list, system_prompt: str, skema: type[BaseModel]) -> BaseModel:
    if provider == "gemini":
        return _gemini(model, bagian, system_prompt, skema)
    if provider == "openrouter":
        return _openrouter(model, bagian, system_prompt, skema)
    raise ValueError(f"LLM_PROVIDER tidak dikenal: {provider} (pilih gemini atau openrouter)")
