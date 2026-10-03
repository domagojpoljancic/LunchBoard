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
  const variantId =
    day.variantId ??
    meal?.variants.find((v) => v.isDefault)?.id ??
    meal?.variants[0]?.id ??
    null;

  const ingredients = meal
    ? [
        ...meal.ingredients.filter(
          (i) => !i.variantId || i.variantId === variantId,
        ),
        ...day.sides.flatMap((s) => s.side.ingredients),
      ].map((i) => ({
        name: i.name,
        quantity: scaleQuantity(
          i.quantity,
          i.unit,
          meal.baseServings,
          day.servings,
        ),
        unit: i.unit,
      }))
    : [];

  const keypoints =
    meal?.steps.filter((s) => s.kind === "KEYPOINT").map((s) => s.body) ?? [];
  const steps =
    meal?.steps.filter((s) => s.kind === "STEP").map((s) => s.body) ?? [];

  return (
    <div className="min-h-screen">
      <CookView
        dayId={day.id}
        weekStart={day.week.weekStart}
        meal={
          meal
            ? {
                id: meal.id,
                name: meal.name,
                confidence: meal.confidence,
                cookCount: meal.cookCount,
                nudgeDismissedAtCookCount: meal.nudgeDismissedAtCookCount,
              }
            : null
        }
        servings={day.servings}
        prepWindow={day.prepWindow}
        variantLabel={day.variant?.label ?? null}
        ingredients={ingredients}
        keypoints={keypoints}
        steps={steps}
      />
    </div>
  );
}
