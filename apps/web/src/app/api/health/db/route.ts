import { connection, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Health check that performs a real read against the database (Supabase).
// Used by UptimeRobot so each ping counts as database activity and the free
// tier project is not auto-paused for inactivity.
const DB_TIMEOUT_MS = 3000;
const NO_STORE = { "Cache-Control": "no-store" };

class DbTimeoutError extends Error {
  constructor() {
    super("database query timed out");
    this.name = "DbTimeoutError";
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new DbTimeoutError()), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function GET() {
  // Opt out of prerendering so every request runs a fresh database query.
  await connection();
  const startedAt = performance.now();
  try {
    // Cheap read of one existing table; only the id is selected and never returned.
    await withTimeout(prisma.user.findFirst({ select: { id: true } }), DB_TIMEOUT_MS);

    return NextResponse.json(
      {
        status: "ok",
        db: "ok",
        latency_ms: Math.round(performance.now() - startedAt),
      },
      { headers: NO_STORE },
    );
  } catch (err) {
    // Log only the error type, never the message or connection details.
    console.error("[health/db] database check failed:", err instanceof Error ? err.name : "unknown");

    return NextResponse.json(
      {
        status: "error",
        db: "error",
        error: err instanceof DbTimeoutError ? "database timeout" : "database unreachable",
      },
      { status: 503, headers: NO_STORE },
    );
  }
}
