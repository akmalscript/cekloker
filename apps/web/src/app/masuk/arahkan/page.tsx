import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Tujuan setelah login tanpa callbackUrl eksplisit: admin ke /admin, lainnya ke /riwayat.
// Dengan cacheComponents, akses sesi (cookies) harus berada di dalam Suspense.
async function Pengarah() {
  const session = await auth();

  if (!session?.user) {
    redirect("/masuk");
  }

  const role = session.user.role;
  const isAdmin =
    role === "ADMIN" ||
    role === "MODERATOR" ||
    Boolean(session.user.email?.startsWith("admin@"));

  return redirect(isAdmin ? "/admin" : "/riwayat");
}

export default function ArahkanSetelahMasuk() {
  return (
    <Suspense fallback={null}>
      <Pengarah />
    </Suspense>
  );
}
