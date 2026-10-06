import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMeal } from "@/app/actions/meals";
import { DeleteMealButton } from "@/components/DeleteMealButton";
import { IngredientEditor } from "@/components/IngredientEditor";
import { MealBasicsForm } from "@/components/MealBasicsForm";
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

      <MealBasicsForm meal={meal} />

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
