/**
 * Rate Limiter untuk Pengguna Tanpa Login (FR-AKN-02)
 * Tamu dibatasi maksimal 3 kali cek per 24 jam.
 * Jatah hanya berkurang jika pemeriksaan berhasil (HTTP 200).
 */

const MAX_GUEST_CHECKS = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 jam

interface UsageRecord {
  count: number;
  firstUsedAt: number;
}

// In-memory tracker untuk runtime
const guestUsageMap = new Map<string, UsageRecord>();

export interface QuotaStatus {
  allowed: boolean;
  remaining: number;
  total: number;
  resetAt: Date;
}

export function checkGuestQuota(guestId: string): QuotaStatus {
  const now = Date.now();
  const record = guestUsageMap.get(guestId);

  // Jika belum pernah atau window 24 jam sudah terlewati -> reset
  if (!record || now - record.firstUsedAt > WINDOW_MS) {
    return {
      allowed: true,
      remaining: MAX_GUEST_CHECKS,
      total: MAX_GUEST_CHECKS,
      resetAt: new Date(now + WINDOW_MS),
    };
  }

  const remaining = Math.max(0, MAX_GUEST_CHECKS - record.count);
  return {
    allowed: remaining > 0,
    remaining,
    total: MAX_GUEST_CHECKS,
    resetAt: new Date(record.firstUsedAt + WINDOW_MS),
  };
}

export function consumeGuestQuota(guestId: string): QuotaStatus {
  const now = Date.now();
  let record = guestUsageMap.get(guestId);

  if (!record || now - record.firstUsedAt > WINDOW_MS) {
    record = { count: 1, firstUsedAt: now };
  } else {
    record.count += 1;
  }

  guestUsageMap.set(guestId, record);

  const remaining = Math.max(0, MAX_GUEST_CHECKS - record.count);
  return {
    allowed: remaining > 0,
    remaining,
    total: MAX_GUEST_CHECKS,
    resetAt: new Date(record.firstUsedAt + WINDOW_MS),
  };
}
