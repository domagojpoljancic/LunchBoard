import { CookView } from "@/components/CookView";
import { prisma } from "@/lib/db";
import { scaleQuantity } from "@/lib/scaling";
import { requireUser } from "@/lib/session";
import { notFound } from "next/navigation";

export default async function CookPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  const user = await requireUser();
  const day = await prisma.dayPlan.findFirst({
    where: { id: dayId, week: { userId: user.id } },
    include: {
      week: true,
      variant: true,
      preparedDish: {
        include: {
          linkedMeal: {
            include: {
              steps: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
      sides: { include: { side: { include: { ingredients: true } } } },
      meal: {
        include: {
          ingredients: true,
          steps: { orderBy: { sortOrder: "asc" } },
          variants: true,
        },
      },
    },
  });
  if (!day) notFound();

  const meal = day.meal;
  const linked = day.preparedDish?.linkedMeal;
  const keypointSource = meal ?? linked;
  const variantId =
    day.variantId ??
    meal?.variants.find((v) => v.isDefault)?.id ??
    meal?.variants[0]?.id ??
    null;

  const scale = (quantity: number | null, unit: string | null) =>
    meal
      ? scaleQuantity(quantity, unit, meal.baseServings, day.servings)
      : quantity;

  const mealIngredients = meal
    ? meal.ingredients
        .filter((i) => !i.variantId || i.variantId === variantId)
        .filter((i) => i.role !== "PANTRY")
        .map((i) => ({
          name: i.name,
          quantity: scale(i.quantity, i.unit),
          unit: i.unit,
        }))
    : [];

  const sideGroups = day.sides.map((link) => ({
    name: link.side.name,
    ingredients: link.side.ingredients
      .filter((i) => i.role !== "PANTRY")
      .map((i) => ({
        name: i.name,
        quantity: scale(i.quantity, i.unit),
        unit: i.unit,
      })),
  }));

  const cupboardNames = new Set<string>();
  if (meal) {
    for (const i of meal.ingredients.filter(
      (ing) =>
        (!ing.variantId || ing.variantId === variantId) &&
        ing.role === "PANTRY",
    )) {
      cupboardNames.add(i.name);
    }
  }
  for (const link of day.sides) {
    for (const i of link.side.ingredients.filter(
      (ing) => ing.role === "PANTRY",
    )) {
      cupboardNames.add(i.name);
    }
  }

  const keypoints =
    keypointSource?.steps
      .filter((s) => s.kind === "KEYPOINT")
      .map((s) => s.body) ?? [];
  const steps =
    meal?.steps.filter((s) => s.kind === "STEP").map((s) => s.body) ?? [];

  return (
    <div className="min-h-screen">
      <CookView
        dayId={day.id}
        weekStart={day.week.weekStart}
        cookedAt={day.cookedAt?.toISOString() ?? null}
        meal={
          meal
            ? {
                id: meal.id,
                name: meal.name,
                confidence: meal.confidence,
                cookCount: meal.cookCount,
                nudgeDismissedAtCookCount: meal.nudgeDismissedAtCookCount,
              }
            : linked
              ? {
                  id: linked.id,
                  name: linked.name,
                  confidence: linked.confidence,
                  cookCount: linked.cookCount,
                  nudgeDismissedAtCookCount: linked.nudgeDismissedAtCookCount,
                }
              : null
        }
        servings={day.servings}
        prepWindow={day.prepWindow}
        variantLabel={day.variant?.label ?? null}
        mealIngredients={mealIngredients}
        sideGroups={sideGroups}
        cupboard={[...cupboardNames]}
        keypoints={keypoints}
        steps={meal?.confidence === "RECIPE" ? steps : []}
        cookKind={day.cookKind}
        preparedDishName={day.preparedDish?.name ?? null}
      />
    </div>
  );
}
