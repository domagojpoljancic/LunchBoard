import Link from "next/link";
import { NewMealForm } from "@/components/NewMealForm";
import { requireUser } from "@/lib/session";

export default async function NewMealPage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-[720px] space-y-6 p-6">
      <Link href="/week" className="btn-text muted">
        Board
      </Link>
      <h1 className="font-display text-4xl">New meal</h1>
      <NewMealForm />
    </main>
  );
}
