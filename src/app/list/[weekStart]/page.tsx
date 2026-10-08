import Link from "next/link";
import { redirect } from "next/navigation";
import { BuyList } from "@/components/BuyList";
import { TopBar } from "@/components/TopBar";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ensureWeek } from "@/lib/week-service";
import { normalizeWeekStart } from "@/lib/weeks";

export default async function ListPage({
  params,
}: {
  params: Promise<{ weekStart: string }>;
}) {
  const { weekStart } = await params;
  const normalized = normalizeWeekStart(weekStart);
  if (!normalized) redirect("/week");
  if (normalized !== weekStart) redirect(`/list/${normalized}`);

  const user = await requireUser();
  const week = await ensureWeek(user.id, normalized);
  const inventory = await prisma.inventoryItem.findMany({
    where: { userId: user.id },
  });
  const fresh = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { addPurchaseToInventory: true },
  });

  const planItems = week.shoppingItems.filter((i) => i.origin === "PLAN");
  const carriedItems = week.shoppingItems.filter((i) => i.origin === "CARRIED");

  return (
    <div className="min-h-screen">
      <TopBar
        weekStart={normalized}
        right={
          <>
            <Link href="/home" className="btn-text">
              At home
            </Link>
            <Link href={`/week/${normalized}`} className="btn-text">
              Board
            </Link>
          </>
        }
      />
      <BuyList
        planItems={planItems}
        carriedItems={carriedItems}
        pantryItems={week.pantryItems}
        inventory={inventory.map((i) => ({
          id: i.id,
          nameKey: i.nameKey,
          unit: i.unit,
          location: i.location,
          quantity: i.quantity,
        }))}
        addPurchasePreference={fresh.addPurchaseToInventory}
        applyStockMode
      />
    </div>
  );
}
