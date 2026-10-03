import Link from "next/link";
import { BuyList } from "@/components/BuyList";
import { TopBar } from "@/components/TopBar";
import { requireUser } from "@/lib/session";
import { ensureWeek } from "@/lib/week-service";

export default async function ListPage({
  params,
}: {
  params: Promise<{ weekStart: string }>;
}) {
  const { weekStart } = await params;
  const user = await requireUser();
  const week = await ensureWeek(user.id, weekStart);

  const planItems = week.shoppingItems.filter((i) => i.origin === "PLAN");
  const carriedItems = week.shoppingItems.filter((i) => i.origin === "CARRIED");

  return (
    <div className="min-h-screen">
      <TopBar
        weekStart={weekStart}
        right={
          <Link href={`/week/${weekStart}`} className="btn-text">
            Board
          </Link>
        }
      />
      <BuyList
        planItems={planItems}
        carriedItems={carriedItems}
        pantryItems={week.pantryItems}
      />
    </div>
  );
}
