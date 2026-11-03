import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
c = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

for m in ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash",
          "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]:
    try:
        r = c.models.generate_content(model=m, contents="Balas satu kata: halo")
        print("OK   ", m, "->", r.text.strip()[:30])
    except Exception as e:
        print("GAGAL", m, "->", getattr(e, "code", None), str(e)[:80])