import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

export async function requireUser(): Promise<User> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    // Stale JWT after DB reset/seed — clear the cookie, then land on login.
    await signOut({ redirectTo: "/login" });
    redirect("/login");
  }
  return user;
}
