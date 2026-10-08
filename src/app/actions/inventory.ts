"use server";

import { prisma } from "@/lib/db";
import {
  applyInventoryIncrement,
  normalizeInventoryUnit,
  UNDO_WINDOW_MS,
} from "@/lib/inventory";
import { nameKey } from "@/lib/name-key";
import { revalidateApp } from "@/lib/revalidate-app";
import { requireUser } from "@/lib/session";
import { z } from "zod";

const locationSchema = z.enum(["PANTRY", "FREEZER", "FRIDGE"]);
const unitSchema = z.enum(["G", "ML", "PIECE", "BUNCH", ""]).nullable();

const upsertSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1).max(80),
  location: locationSchema,
  quantity: z.number().min(0).nullable(),
  unit: unitSchema,
  roleHint: z.enum(["BUY", "PANTRY"]).nullable().optional(),
  notes: z.string().max(200).nullable().optional(),
  warnBelow: z.number().min(0).nullable().optional(),
});

export async function upsertInventoryItem(input: z.infer<typeof upsertSchema>) {
  const parsed = upsertSchema.parse(input);
  const user = await requireUser();
  const key = nameKey(parsed.name);
  const unit = normalizeInventoryUnit(parsed.unit);
  if (parsed.quantity != null && !unit) {
    throw new Error("Unit required when quantity is set");
  }

  if (parsed.id) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id: parsed.id, userId: user.id },
    });
    if (!existing) throw new Error("Not found");
    const before = existing.quantity;
    const updated = await prisma.inventoryItem.update({
      where: { id: existing.id },
      data: {
        name: parsed.name,
        nameKey: key,
        location: parsed.location,
        quantity: parsed.quantity,
        unit,
        roleHint: parsed.roleHint ?? null,
        notes: parsed.notes ?? null,
        warnBelow: parsed.warnBelow ?? null,
      },
    });
    if (
      parsed.quantity != null &&
      before != null &&
      parsed.quantity !== before
    ) {
      await prisma.inventoryMutation.create({
        data: {
          userId: user.id,
          inventoryItemId: updated.id,
          delta: parsed.quantity - before,
          reason: "MANUAL",
        },
      });
    }
    revalidateApp();
    return updated;
  }

  const created = await prisma.inventoryItem.upsert({
    where: {
      userId_nameKey_unit_location: {
        userId: user.id,
        nameKey: key,
        unit,
        location: parsed.location,
      },
    },
    create: {
      userId: user.id,
      name: parsed.name,
      nameKey: key,
      location: parsed.location,
      quantity: parsed.quantity,
      unit,
      roleHint: parsed.roleHint ?? null,
      notes: parsed.notes ?? null,
      warnBelow: parsed.warnBelow ?? null,
    },
    update: {
      name: parsed.name,
      quantity: parsed.quantity,
      roleHint: parsed.roleHint ?? null,
      notes: parsed.notes ?? null,
      warnBelow: parsed.warnBelow ?? null,
    },
  });

  await prisma.inventoryMutation.create({
    data: {
      userId: user.id,
      inventoryItemId: created.id,
      delta: parsed.quantity ?? 0,
      reason: "MANUAL",
    },
  });

  revalidateApp();
  return created;
}

export async function deleteInventoryItem(id: string) {
  const parsed = z.object({ id: z.string().cuid() }).parse({ id });
  const user = await requireUser();
  const item = await prisma.inventoryItem.findFirst({
    where: { id: parsed.id, userId: user.id },
  });
  if (!item) throw new Error("Not found");
  await prisma.inventoryItem.delete({ where: { id: item.id } });
  revalidateApp();
}

export async function adjustInventoryQuantity(
  id: string,
  quantity: number | null,
) {
  const parsed = z
    .object({
      id: z.string().cuid(),
      quantity: z.number().min(0).nullable(),
    })
    .parse({ id, quantity });
  const user = await requireUser();
  const item = await prisma.inventoryItem.findFirst({
    where: { id: parsed.id, userId: user.id },
  });
  if (!item) throw new Error("Not found");
  const before = item.quantity ?? 0;
  const after = parsed.quantity;
  await prisma.inventoryItem.update({
    where: { id: item.id },
    data: { quantity: after },
  });
  if (after != null) {
    await prisma.inventoryMutation.create({
      data: {
        userId: user.id,
        inventoryItemId: item.id,
        delta: after - before,
        reason: "MANUAL",
      },
    });
  }
  revalidateApp();
}

const purchaseSchema = z.object({
  shoppingItemId: z.string().cuid(),
  location: locationSchema.default("PANTRY"),
  remember: z.boolean().optional(),
});

export async function addPurchaseToInventory(
  input: z.infer<typeof purchaseSchema>,
) {
  const parsed = purchaseSchema.parse(input);
  const user = await requireUser();
  const item = await prisma.shoppingItem.findFirst({
    where: { id: parsed.shoppingItemId, week: { userId: user.id } },
  });
  if (!item) throw new Error("Not found");
  if (item.quantity == null) throw new Error("No quantity");

  const unit = normalizeInventoryUnit(item.unit);
  const key = item.nameKey || nameKey(item.name);

  const existing = await prisma.inventoryItem.findUnique({
    where: {
      userId_nameKey_unit_location: {
        userId: user.id,
        nameKey: key,
        unit,
        location: parsed.location,
      },
    },
  });

  const nextQty = applyInventoryIncrement(
    existing?.quantity ?? 0,
    item.quantity,
  );

  const row = existing
    ? await prisma.inventoryItem.update({
        where: { id: existing.id },
        data: { quantity: nextQty, name: item.name },
      })
    : await prisma.inventoryItem.create({
        data: {
          userId: user.id,
          name: item.name,
          nameKey: key,
          location: parsed.location,
          quantity: nextQty,
          unit,
        },
      });

  await prisma.inventoryMutation.create({
    data: {
      userId: user.id,
      inventoryItemId: row.id,
      delta: item.quantity,
      reason: "PURCHASE_ADD",
      shoppingItemId: item.id,
      reversibleUntil: new Date(Date.now() + UNDO_WINDOW_MS),
    },
  });

  if (parsed.remember !== undefined) {
    await prisma.user.update({
      where: { id: user.id },
      data: { addPurchaseToInventory: parsed.remember },
    });
  }

  revalidateApp();
  return row;
}

export async function setAddPurchasePreference(prefer: boolean | null) {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { addPurchaseToInventory: prefer },
  });
  revalidateApp();
}
