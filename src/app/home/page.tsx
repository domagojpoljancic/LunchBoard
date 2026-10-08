import Link from "next/link";
import { redirect } from "next/navigation";
import { AtHome } from "@/components/AtHome";
import { TopBar } from "@/components/TopBar";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ensureCurrentWeek } from "@/lib/week-service";

export default async function HomeStockPage() {
  const user = await requireUser();
  const week = await ensureCurrentWeek(user.id, user.timezone || "UTC");
  if (!week) redirect("/week");

  const [inventory, prepared, meals] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { userId: user.id },
      orderBy: [{ location: "asc" }, { name: "asc" }],
    }),
    prisma.preparedDish.findMany({
      where: { userId: user.id },
      include: { linkedMeal: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.meal.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <TopBar
        weekStart={week.weekStart}
        right={
          <>
            <Link href={`/week/${week.weekStart}`} className="btn-text">
              Board
            </Link>
            <Link href={`/list/${week.weekStart}`} className="btn-text">
              Lists
            </Link>
          </>
        }
      />
      <AtHome
        inventory={inventory.map((i) => ({
          id: i.id,
          name: i.name,
          location: i.location,
          quantity: i.quantity,
          unit: i.unit,
          warnBelow: i.warnBelow,
        }))}
        prepared={prepared.map((p) => ({
          id: p.id,
          name: p.name,
          location: p.location,
          portionsRemaining: p.portionsRemaining,
          linkedMealId: p.linkedMealId,
          linkedMealName: p.linkedMeal?.name ?? null,
          archivedAt: p.archivedAt?.toISOString() ?? null,
        }))}
        meals={meals}
      />
    </div>
  );
}
