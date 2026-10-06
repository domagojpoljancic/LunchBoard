"use server";

import { prisma } from "@/lib/db";
import { rebuildWeek } from "@/lib/rebuild";
import { revalidateApp } from "@/lib/revalidate-app";
import { toggleItemSchema } from "@/lib/schemas";
import { requireUser } from "@/lib/session";
import { shiftWeek } from "@/lib/weeks";

export async function toggleShoppingItem(itemId: string, checked: boolean) {
  const parsed = toggleItemSchema.parse({ itemId, checked });
  const user = await requireUser();
  const item = await prisma.shoppingItem.findFirst({
    where: { id: parsed.itemId, week: { userId: user.id } },
    include: { week: true },
  });
  if (!item) throw new Error("Not found");
  await prisma.shoppingItem.update({
    where: { id: parsed.itemId },
    data: { checked: parsed.checked },
  });

  const nextStart = shiftWeek(item.week.weekStart, 1);
  const next = await prisma.week.findUnique({
    where: {
      userId_weekStart: { userId: user.id, weekStart: nextStart },
    },
    select: { id: true },
  });
  if (next) {
    await rebuildWeek(next.id);
  }

  revalidateApp();
}

export async function togglePantryItem(itemId: string, checked: boolean) {
  const parsed = toggleItemSchema.parse({ itemId, checked });
  const user = await requireUser();
  const item = await prisma.pantryItem.findFirst({
    where: { id: parsed.itemId, week: { userId: user.id } },
  });
  if (!item) throw new Error("Not found");
  await prisma.pantryItem.update({
    where: { id: parsed.itemId },
    data: { checked: parsed.checked },
  });
  revalidateApp();
}
