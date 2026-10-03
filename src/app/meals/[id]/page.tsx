import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMeal, setConfidence, updateMealBasics } from "@/app/actions/meals";
import { DeleteMealButton } from "@/components/DeleteMealButton";
import { IngredientEditor } from "@/components/IngredientEditor";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function MealEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const meal = await prisma.meal.findFirst({
    where: { id, userId: user.id },
    include: {
      variants: {
        orderBy: { sortOrder: "asc" },
        include: { ingredients: { orderBy: { sortOrder: "asc" } } },
      },
      ingredients: { orderBy: { sortOrder: "asc" } },
      steps: { orderBy: { sortOrder: "asc" } },
      mealSides: { include: { side: true } },
    },
  });
  if (!meal) notFound();

  const shared = meal.ingredients.filter((i) => !i.variantId);

  return (
    <main className="mx-auto max-w-[720px] space-y-6 p-6">
      <Link href="/week" className="btn-text muted">
        Board
      </Link>

      <form
        action={async (formData) => {
          "use server";
          await updateMealBasics(meal.id, {
            name: String(formData.get("name") || meal.name),
            method: String(formData.get("method") || meal.method),
            cuisine: String(formData.get("cuisine") || "") || null,
            activeMinutes: formData.get("activeMinutes")
              ? Number(formData.get("activeMinutes"))
              : null,
            totalMinutes: formData.get("totalMinutes")
              ? Number(formData.get("totalMinutes"))
              : null,
            completePlate: formData.get("completePlate") === "on",
          });
        }}
        className="sheet space-y-4 p-5"
      >
        <input
          name="name"
          defaultValue={meal.name}
          className="font-display h-14 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-[32px]"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="btn-outline"
            formAction={async () => {
              "use server";
              await setConfidence(meal.id, "KNOW");
            }}
          >
            I know how to cook this
          </button>
          <button
            type="submit"
            className="btn-outline"
            formAction={async () => {
              "use server";
              await setConfidence(meal.id, "PROMPT");
            }}
          >
            I roughly know this
          </button>
          <button
            type="submit"
            className="btn-outline"
            formAction={async () => {
              "use server";
              await setConfidence(meal.id, "RECIPE");
            }}
          >
            I need the recipe
          </button>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Confidence now: {meal.confidence}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="section-label">Hands-on minutes</span>
            <input
              name="activeMinutes"
              type="number"
              defaultValue={meal.activeMinutes ?? ""}
              className="mt-1 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3"
            />
          </label>
          <label>
            <span className="section-label">Total minutes</span>
            <input
              name="totalMinutes"
              type="number"
              defaultValue={meal.totalMinutes ?? ""}
              className="mt-1 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3"
            />
          </label>
        </div>
        <label>
          <span className="section-label">Method</span>
          <select
            name="method"
            defaultValue={meal.method}
            className="mt-1 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3"
          >
            {["ONE_POT", "TRAY", "PAN", "BAKE", "ASSEMBLE", "OTHER"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="section-label">Cuisine</span>
          <input
            name="cuisine"
            defaultValue={meal.cuisine ?? ""}
            className="mt-1 h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3"
          />
        </label>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            name="completePlate"
            defaultChecked={meal.completePlate}
          />
          Complete plate (one-pot / bowl)
        </label>
        <button type="submit" className="btn-primary">
          Save meal
        </button>
      </form>

      <div className="sheet space-y-8 p-5">
        <IngredientEditor
          mealId={meal.id}
          ingredients={shared}
          title="Always"
        />
        {meal.variants.map((variant) => (
          <IngredientEditor
            key={variant.id}
            mealId={meal.id}
            variantId={variant.id}
            ingredients={variant.ingredients}
            title={variant.label}
          />
        ))}
      </div>

      {meal.mealSides.length > 0 ? (
        <section className="sheet p-5">
          <h2 className="section-label mb-2">Sides</h2>
          <ul className="space-y-2">
            {meal.mealSides.map((ms) => (
              <li key={ms.sideId}>
                {ms.side.name}
                {ms.defaultSelected ? " · selected when placed" : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="sheet p-5">
        <h2 className="section-label mb-2">Keypoints</h2>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          {meal.steps
            .filter((s) => s.kind === "KEYPOINT")
            .map((s) => (
              <li key={s.id}>{s.body}</li>
            ))}
        </ul>
        <h2 className="section-label mb-2">Steps</h2>
        <ol className="list-decimal space-y-2 pl-5">
          {meal.steps
            .filter((s) => s.kind === "STEP")
            .map((s) => (
              <li key={s.id}>{s.body}</li>
            ))}
        </ol>
      </section>

      <DeleteMealButton
        name={meal.name}
        action={async () => {
          "use server";
          await deleteMeal(meal.id);
        }}
      />
    </main>
  );
}
