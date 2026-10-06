import { z } from "zod";

export const cuid = z.string().cuid();
export const confidenceSchema = z.enum(["KNOW", "PROMPT", "RECIPE"]);
export const prepWindowSchema = z.enum(["EVENING_BEFORE", "SAME_DAY"]);
export const roleSchema = z.enum(["BUY", "PANTRY"]);
export const unitSchema = z.enum(["G", "ML", "PIECE", "BUNCH"]).nullable();
export const servingsSchema = z.number().int().min(1).max(12);
export const nameSchema = z.string().trim().min(1).max(80);
export const proteinGroupSchema = z.enum([
  "BEEF",
  "WHITE_MEAT",
  "FISH",
  "VEGETARIAN",
  "VEGAN",
  "DAIRY",
  "OTHER",
]);

export const setConfidenceSchema = z.object({
  mealId: cuid,
  confidence: confidenceSchema,
});

export const createMealSchema = z.object({
  name: nameSchema,
  proteinGroup: proteinGroupSchema.optional(),
  activeMinutes: z.number().int().min(0).max(600).nullable().optional(),
  totalMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  ingredientsText: z.string().max(4000).optional(),
});

export const updateMealBasicsSchema = z.object({
  mealId: cuid,
  name: nameSchema,
  method: z.string().min(1).max(40),
  cuisine: z.string().max(80).nullable(),
  activeMinutes: z.number().int().min(0).max(600).nullable(),
  totalMinutes: z.number().int().min(0).max(1440).nullable(),
  completePlate: z.boolean(),
  baseServings: servingsSchema.optional(),
});

export const addIngredientSchema = z.object({
  mealId: cuid,
  name: nameSchema,
  quantity: z.number().min(0).nullable(),
  unit: unitSchema,
  role: roleSchema,
  variantId: cuid.nullable().optional(),
  sideId: cuid.nullable().optional(),
});

export const updateIngredientSchema = z.object({
  ingredientId: cuid,
  name: nameSchema.optional(),
  quantity: z.number().min(0).nullable().optional(),
  unit: unitSchema.optional(),
  role: roleSchema.optional(),
});

export const dayIdSchema = z.object({ dayId: cuid });
export const mealIdSchema = z.object({ mealId: cuid });
export const weekStartSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateDayVariantSchema = z.object({
  dayId: cuid,
  variantId: cuid,
});

export const setDaySidesSchema = z.object({
  dayId: cuid,
  sideIds: z.array(cuid),
});

export const updateDayServingsSchema = z.object({
  dayId: cuid,
  servings: servingsSchema,
});

export const updateDayPrepSchema = z.object({
  dayId: cuid,
  prepWindow: prepWindowSchema,
});

export const updateDayEnabledSchema = z.object({
  dayId: cuid,
  enabled: z.boolean(),
});

export const toggleItemSchema = z.object({
  itemId: cuid,
  checked: z.boolean(),
});

export const timezoneSchema = z.object({
  timezone: z.string().min(1).max(80),
});
