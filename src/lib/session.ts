import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("Unauthorized");
  return user;
}
