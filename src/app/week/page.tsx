import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { mondayOf } from "@/lib/weeks";

export default async function WeekIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ login?: string }>;
}) {
  const user = await requireUser();
  const { login } = await searchParams;
  const weekStart = mondayOf(new Date(), user.timezone || "UTC");
  const q = login === "1" ? "?login=1" : "";
  redirect(`/week/${weekStart}${q}`);
}
