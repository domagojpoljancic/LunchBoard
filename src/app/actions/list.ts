"use server";

import { prisma } from "@/lib/db";
import { revalidateApp } from "@/lib/revalidate-app";
import { requireUser } from "@/lib/session";

export async function toggleShoppingItem(itemId: string, checked: boolean) {
  const user = await requireUser();
  const item = await prisma.shoppingItem.findFirst({
    where: { id: itemId, week: { userId: user.id } },
    include: { week: true },
  });
  if (!item) throw new Error("Not found");
  await prisma.shoppingItem.update({
    where: { id: itemId },
    data: { checked },
  });
  revalidateApp();
}

export async function togglePantryItem(itemId: string, checked: boolean) {
  const user = await requireUser();
  const item = await prisma.pantryItem.findFirst({
    where: { id: itemId, week: { userId: user.id } },
    include: { week: true },
  });
  if (!item) throw new Error("Not found");
  await prisma.pantryItem.update({
    where: { id: itemId },
    data: { checked },
  });
  revalidateApp();
}
