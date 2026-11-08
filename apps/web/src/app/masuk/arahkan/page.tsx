import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

// Tujuan setelah login tanpa callbackUrl eksplisit: admin ke /admin, lainnya ke /riwayat.
export default async function ArahkanSetelahMasuk() {
  const session = await auth();

  if (!session?.user) {
    redirect("/masuk");
  }

  const role = session.user.role;
  const isAdmin =
    role === "ADMIN" ||
    role === "MODERATOR" ||
    Boolean(session.user.email?.startsWith("admin@"));

  redirect(isAdmin ? "/admin" : "/riwayat");
}
