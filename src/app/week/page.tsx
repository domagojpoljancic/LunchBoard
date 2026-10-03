import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { mondayOf } from "@/lib/weeks";

export default async function WeekIndexPage() {
  const user = await requireUser();
  const weekStart = mondayOf(new Date(), user.timezone || "UTC");
  redirect(`/week/${weekStart}`);
}
