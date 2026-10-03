import Link from "next/link";
import { createMeal } from "@/app/actions/meals";
import { defaultRole } from "@/lib/pantry-dictionary";
import { requireUser } from "@/lib/session";

export default async function NewMealPage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-[720px] space-y-6 p-6">
      <Link href="/week" className="btn-text muted">
        Board
      </Link>
      <h1 className="font-display text-4xl">New meal</h1>
      <form
        className="sheet space-y-4 p-5"
        action={async (formData) => {
          "use server";
          const name = String(formData.get("name") || "");
          const raw = String(formData.get("ingredients") || "");
          const lines = raw
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .map((line) => {
              const match = line.match(
                /^(.*?)(?:\s+(\d+(?:\.\d+)?)\s*(g|ml|piece|pcs)?)?$/i,
              );
              const itemName = (match?.[1] || line).trim();
              const qty = match?.[2] ? Number(match[2]) : null;
              const unitRaw = (match?.[3] || "").toLowerCase();
              const unit =
                unitRaw === "g"
                  ? "G"
                  : unitRaw === "ml"
                    ? "ML"
                    : unitRaw
                      ? "PIECE"
                      : null;
              return {
                name: itemName,
                quantity: qty,
                unit: unit as "G" | "ML" | "PIECE" | null,
                role: defaultRole(itemName),
              };
            });
          const proteinGroup = String(formData.get("proteinGroup") || "") || null;
          const active = String(formData.get("activeMinutes") || "");
          const total = String(formData.get("totalMinutes") || "");
          await createMeal({
            name,
            ingredients: lines,
            proteinGroup,
            activeMinutes: active ? Number(active) : null,
            totalMinutes: total ? Number(total) : null,
          });
        }}
      >
        <label className="block">
          <span className="section-label">Name</span>
          <input
            name="name"
            required
            placeholder="Burrata pasta"
            className="font-display mt-1 h-14 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-[32px]"
          />
        </label>
        <label className="block">
          <span className="section-label">Ingredients</span>
          <textarea
            name="ingredients"
            required
            rows={6}
            placeholder={"pasta 300 g\nburrata 200 g\ncherry tomatoes 200 g\nbasil\nGrana Padano 40 g"}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="section-label">Protein</span>
          <select
            name="proteinGroup"
            className="mt-1 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3"
          >
            <option value="">No specific protein</option>
            <option value="BEEF">Beef</option>
            <option value="WHITE_MEAT">White meat</option>
            <option value="FISH">Fish</option>
            <option value="VEGETARIAN">Vegetarian</option>
            <option value="VEGAN">Vegan</option>
            <option value="DAIRY">Dairy</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="section-label">Hands-on minutes</span>
            <input
              name="activeMinutes"
              type="number"
              className="mt-1 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3"
            />
          </label>
          <label>
            <span className="section-label">Total minutes</span>
            <input
              name="totalMinutes"
              type="number"
              className="mt-1 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3"
            />
          </label>
        </div>
        <button type="submit" className="btn-primary">
          Save meal
        </button>
      </form>
    </main>
  );
}
