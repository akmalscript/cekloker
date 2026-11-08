/**
 * Konfigurasi & Helper Akses Demo Juri (CekLoker Live Demo Protection)
 * Digunakan untuk membatasi pemanggilan API LLM Gemini selama masa evaluasi/demo.
 */

export const DEMO_KEY = process.env.DEMO_KEY || "juri2026";
export const DEMO_COOKIE_NAME = "ck_demo_access";
export const DEMO_HEADER_NAME = "x-demo-key";

/**
 * Validasi apakah key yang diberikan cocok dengan kunci akses demo resmi
 */
export function isValidDemoKey(key?: string | null): boolean {
  if (!key) return false;
  return key.trim() === DEMO_KEY;
}
