import type { PrismaClient } from "@prisma/client";

type Ing = {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  role: "BUY" | "PANTRY";
};

type MealDef = {
  catalogKey: string;
  name: string;
  method: string;
  cuisine: string;
  activeMinutes: number;
  totalMinutes: number;
  completePlate: boolean;
  variants: Array<{
    label: string;
    proteinGroup: string;
    isDefault?: boolean;
    ingredients: Ing[];
  }>;
  shared: Ing[];
  sides: Array<{ catalogKey: string; defaultSelected: boolean }>;
  keypoints: string[];
  steps: string[];
};

const SIDES: Array<{
  catalogKey: string;
  name: string;
  activeMinutes: number;
  ingredients: Ing[];
}> = [
  {
    catalogKey: "pasta",
    name: "Pasta",
    activeMinutes: 10,
    ingredients: [
      { name: "spaghetti", quantity: 300, unit: "G", role: "BUY" },
      { name: "salt", role: "PANTRY" },
    ],
  },
  {
    catalogKey: "green-salad",
    name: "Green salad",
    activeMinutes: 5,
    ingredients: [
      { name: "salad leaves", quantity: 80, unit: "G", role: "BUY" },
      { name: "lemon", quantity: 1, unit: "PIECE", role: "BUY" },
    ],
  },
  {
    catalogKey: "potatoes",
    name: "Potatoes",
    activeMinutes: 15,
    ingredients: [
      { name: "potatoes", quantity: 600, unit: "G", role: "BUY" },
      { name: "salt", role: "PANTRY" },
    ],
  },
  {
    catalogKey: "burger-buns",
    name: "Burger buns",
    activeMinutes: 0,
    ingredients: [
      { name: "burger buns", quantity: 3, unit: "PIECE", role: "BUY" },
    ],
  },
  {
    catalogKey: "bread",
    name: "Bread",
    activeMinutes: 0,
    ingredients: [{ name: "bread", quantity: 1, unit: "PIECE", role: "BUY" }],
  },
  {
    catalogKey: "lettuce",
    name: "Lettuce",
    activeMinutes: 5,
    ingredients: [
      { name: "lettuce", quantity: 1, unit: "PIECE", role: "BUY" },
    ],
  },
  {
    catalogKey: "yogurt",
    name: "Yogurt",
    activeMinutes: 0,
    ingredients: [
      { name: "plain yogurt", quantity: 150, unit: "G", role: "BUY" },
    ],
  },
];

const MEALS: MealDef[] = [
  {
    catalogKey: "bolognese",
    name: "Bolognese",
    method: "PAN",
    cuisine: "italian",
    activeMinutes: 35,
    totalMinutes: 70,
    completePlate: false,
    variants: [
      {
        label: "Beef mince",
        proteinGroup: "BEEF",
        isDefault: true,
        ingredients: [
          { name: "beef mince", quantity: 450, unit: "G", role: "BUY" },
        ],
      },
      {
        label: "Vegan mince",
        proteinGroup: "VEGAN",
        ingredients: [
          { name: "vegan mince", quantity: 360, unit: "G", role: "BUY" },
        ],
      },
    ],
    shared: [
      { name: "onion", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "carrot", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "passata", quantity: 500, unit: "G", role: "BUY" },
      { name: "olive oil", role: "PANTRY" },
      { name: "salt", role: "PANTRY" },
      { name: "black pepper", role: "PANTRY" },
      { name: "garlic", role: "PANTRY" },
      { name: "dried oregano", role: "PANTRY" },
    ],
    sides: [
      { catalogKey: "pasta", defaultSelected: true },
      { catalogKey: "green-salad", defaultSelected: false },
    ],
    keypoints: [
      "Fine dice.",
      "Simmer until the sauce clings to a spoon.",
      "Salt at the end.",
    ],
    steps: [
      "Peel and finely chop the onion, carrot, and garlic.",
      "Warm a film of olive oil in a wide pan. Cook the onion and carrot until soft.",
      "Add the mince. Break it up and cook until it loses its raw look.",
      "Pour in the passata, oregano, salt, and pepper. Simmer about 30 minutes, until thick.",
      "If you are serving pasta, boil it in salted water and toss it with the sauce.",
    ],
  },
  {
    catalogKey: "goulash",
    name: "Goulash",
    method: "ONE_POT",
    cuisine: "hungarian",
    activeMinutes: 25,
    totalMinutes: 90,
    completePlate: true,
    variants: [
      {
        label: "Beef",
        proteinGroup: "BEEF",
        isDefault: true,
        ingredients: [
          { name: "beef chuck", quantity: 600, unit: "G", role: "BUY" },
        ],
      },
    ],
    shared: [
      { name: "onion", quantity: 2, unit: "PIECE", role: "BUY" },
      { name: "red pepper", quantity: 2, unit: "PIECE", role: "BUY" },
      { name: "tomato", quantity: 2, unit: "PIECE", role: "BUY" },
      { name: "oil", role: "PANTRY" },
      { name: "salt", role: "PANTRY" },
      { name: "sweet paprika", role: "PANTRY" },
      { name: "black pepper", role: "PANTRY" },
      { name: "garlic", role: "PANTRY" },
    ],
    sides: [{ catalogKey: "potatoes", defaultSelected: false }],
    keypoints: [
      "Paprika goes in off the heat.",
      "The beef should yield to a spoon.",
      "Thicker than soup.",
    ],
    steps: [
      "Cut the beef into bite-size pieces. Slice the onions and peppers.",
      "Brown the beef in oil in a heavy pot, then set it aside.",
      "Cook the onions until soft. Take the pot off the heat and stir in the paprika.",
      "Return the beef. Add peppers, tomato, garlic, salt, and pepper, and enough water to barely cover.",
      "Cover and simmer until the beef is tender, about an hour. Taste for salt.",
    ],
  },
  {
    catalogKey: "lasagne",
    name: "Lasagne",
    method: "BAKE",
    cuisine: "italian",
    activeMinutes: 40,
    totalMinutes: 80,
    completePlate: true,
    variants: [
      {
        label: "Beef mince",
        proteinGroup: "BEEF",
        isDefault: true,
        ingredients: [
          { name: "beef mince", quantity: 500, unit: "G", role: "BUY" },
        ],
      },
      {
        label: "Vegan mince",
        proteinGroup: "VEGAN",
        ingredients: [
          { name: "vegan mince", quantity: 400, unit: "G", role: "BUY" },
        ],
      },
    ],
    shared: [
      { name: "lasagne sheets", quantity: 200, unit: "G", role: "BUY" },
      { name: "passata", quantity: 500, unit: "G", role: "BUY" },
      { name: "mozzarella", quantity: 250, unit: "G", role: "BUY" },
      { name: "milk", quantity: 500, unit: "ML", role: "BUY" },
      { name: "butter", quantity: 40, unit: "G", role: "BUY" },
      { name: "flour", quantity: 40, unit: "G", role: "BUY" },
      { name: "onion", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "salt", role: "PANTRY" },
      { name: "black pepper", role: "PANTRY" },
      { name: "nutmeg", role: "PANTRY" },
      { name: "dried oregano", role: "PANTRY" },
      { name: "garlic", role: "PANTRY" },
      { name: "olive oil", role: "PANTRY" },
    ],
    sides: [{ catalogKey: "green-salad", defaultSelected: false }],
    keypoints: [
      "Meat sauce should be thick before it goes in the dish.",
      "White sauce coats the back of a spoon.",
      "Bake until the top is brown and the edge bubbles.",
    ],
    steps: [
      "Cook the onion and garlic in olive oil. Add the mince, oregano, and passata. Simmer until thick. Salt it.",
      "Melt the butter, stir in the flour, then whisk in the milk. Season with salt, pepper, and nutmeg.",
      "Layer meat sauce, sheets, and white sauce. Finish with white sauce and mozzarella.",
      "Bake until bubbling and brown, about 35 minutes. Rest 10 minutes before cutting.",
    ],
  },
  {
    catalogKey: "chicken-grain-bowl",
    name: "Chicken grain bowl",
    method: "TRAY",
    cuisine: "mediterranean",
    activeMinutes: 25,
    totalMinutes: 45,
    completePlate: true,
    variants: [
      {
        label: "Chicken",
        proteinGroup: "WHITE_MEAT",
        isDefault: true,
        ingredients: [
          { name: "chicken breast", quantity: 450, unit: "G", role: "BUY" },
        ],
      },
    ],
    shared: [
      { name: "quinoa", quantity: 180, unit: "G", role: "BUY" },
      { name: "broccoli", quantity: 250, unit: "G", role: "BUY" },
      { name: "zucchini", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "cucumber", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "plain yogurt", quantity: 200, unit: "G", role: "BUY" },
      { name: "olive oil", role: "PANTRY" },
      { name: "lemon", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "garlic", role: "PANTRY" },
      { name: "salt", role: "PANTRY" },
      { name: "dried oregano", role: "PANTRY" },
    ],
    sides: [],
    keypoints: [
      "Chicken is done at a clear center.",
      "Quinoa is tender with a little bite.",
      "Lemon at the end.",
    ],
    steps: [
      "Heat the oven to 200°C. Toss broccoli and zucchini with olive oil and salt. Roast about 20 minutes.",
      "Rub the chicken with oil, oregano, salt, and garlic. Roast on the same tray until just cooked.",
      "Simmer the quinoa in salted water until tender. Drain.",
      "Slice the chicken and cucumber. Stir lemon and a pinch of salt into the yogurt. Serve the bowl with the yogurt on top.",
    ],
  },
  {
    catalogKey: "ginger-chicken-rice",
    name: "Ginger chicken rice",
    method: "PAN",
    cuisine: "asian",
    activeMinutes: 25,
    totalMinutes: 35,
    completePlate: true,
    variants: [
      {
        label: "Chicken",
        proteinGroup: "WHITE_MEAT",
        isDefault: true,
        ingredients: [
          { name: "chicken thigh", quantity: 450, unit: "G", role: "BUY" },
        ],
      },
    ],
    shared: [
      { name: "rice", quantity: 180, unit: "G", role: "BUY" },
      { name: "lime", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "garlic", role: "PANTRY" },
      { name: "ginger", role: "PANTRY" },
      { name: "soy sauce", role: "PANTRY" },
      { name: "oil", role: "PANTRY" },
      { name: "salt", role: "PANTRY" },
    ],
    sides: [{ catalogKey: "lettuce", defaultSelected: false }],
    keypoints: [
      "High heat, short cook.",
      "The rice is plain.",
      "Lime and soy do the seasoning.",
    ],
    steps: [
      "Start the rice in salted water.",
      "Slice the chicken. Fry it in a little oil until browned and cooked through.",
      "Add garlic and ginger. Stir for half a minute. Splash in soy sauce.",
      "Serve over the rice with lime. Add lettuce leaves if you turned that side on.",
    ],
  },
  {
    catalogKey: "bean-tuna-salad",
    name: "Bean and tuna salad",
    method: "ASSEMBLE",
    cuisine: "mediterranean",
    activeMinutes: 20,
    totalMinutes: 20,
    completePlate: true,
    variants: [
      {
        label: "Tuna",
        proteinGroup: "FISH",
        isDefault: true,
        ingredients: [
          { name: "tuna", quantity: 240, unit: "G", role: "BUY" },
        ],
      },
      {
        label: "Chicken",
        proteinGroup: "WHITE_MEAT",
        ingredients: [
          { name: "chicken breast", quantity: 400, unit: "G", role: "BUY" },
        ],
      },
    ],
    shared: [
      { name: "cannellini beans", quantity: 240, unit: "G", role: "BUY" },
      { name: "cherry tomatoes", quantity: 200, unit: "G", role: "BUY" },
      { name: "red onion", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "parsley", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "olive oil", role: "PANTRY" },
      { name: "lemon", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "salt", role: "PANTRY" },
      { name: "black pepper", role: "PANTRY" },
    ],
    sides: [],
    keypoints: [
      "Drain the beans and the tuna well.",
      "Dress it so it shines, not so it pools.",
      "Rest five minutes.",
    ],
    steps: [
      "Rinse and drain the beans. Drain the tuna, or cut the cooked chicken into pieces.",
      "Halve the tomatoes. Slice the onion thinly. Chop the parsley.",
      "Toss with olive oil, lemon, salt, and pepper.",
      "Taste. Add more lemon if it tastes flat.",
    ],
  },
  {
    catalogKey: "chicken-burrito-bowl",
    name: "Chicken burrito bowl",
    method: "ASSEMBLE",
    cuisine: "mexican",
    activeMinutes: 30,
    totalMinutes: 35,
    completePlate: true,
    variants: [
      {
        label: "Chicken",
        proteinGroup: "WHITE_MEAT",
        isDefault: true,
        ingredients: [
          { name: "chicken breast", quantity: 450, unit: "G", role: "BUY" },
        ],
      },
    ],
    shared: [
      { name: "rice", quantity: 180, unit: "G", role: "BUY" },
      { name: "black beans", quantity: 240, unit: "G", role: "BUY" },
      { name: "sweetcorn", quantity: 150, unit: "G", role: "BUY" },
      { name: "salsa", quantity: 150, unit: "G", role: "BUY" },
      { name: "avocado", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "cumin", role: "PANTRY" },
      { name: "salt", role: "PANTRY" },
      { name: "oil", role: "PANTRY" },
      { name: "lime", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "garlic", role: "PANTRY" },
    ],
    sides: [],
    keypoints: [
      "Season the chicken, not just the bowl.",
      "Avocado goes on at the end.",
      "Lime over everything.",
    ],
    steps: [
      "Cook the rice in salted water.",
      "Rub the chicken with oil, cumin, garlic, and salt. Pan-fry until cooked, then slice.",
      "Warm the beans and corn.",
      "Build the bowl: rice, beans, corn, chicken, salsa, avocado, lime.",
    ],
  },
  {
    catalogKey: "miso-donburi",
    name: "Miso donburi",
    method: "PAN",
    cuisine: "japanese",
    activeMinutes: 25,
    totalMinutes: 30,
    completePlate: true,
    variants: [
      {
        label: "Salmon",
        proteinGroup: "FISH",
        isDefault: true,
        ingredients: [
          { name: "salmon", quantity: 360, unit: "G", role: "BUY" },
        ],
      },
      {
        label: "Chicken",
        proteinGroup: "WHITE_MEAT",
        ingredients: [
          { name: "chicken thigh", quantity: 450, unit: "G", role: "BUY" },
        ],
      },
    ],
    shared: [
      { name: "rice", quantity: 180, unit: "G", role: "BUY" },
      { name: "cucumber", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "edamame", quantity: 150, unit: "G", role: "BUY" },
      { name: "miso", role: "PANTRY" },
      { name: "soy sauce", role: "PANTRY" },
      { name: "sugar", role: "PANTRY" },
      { name: "sesame", role: "PANTRY" },
      { name: "oil", role: "PANTRY" },
    ],
    sides: [],
    keypoints: [
      "Miso glaze should bubble and turn glossy, not burn.",
      "Rice is warm.",
      "Cucumber stays cold.",
    ],
    steps: [
      "Cook the rice. Slice the cucumber. Thaw the edamame if frozen.",
      "Stir miso, a spoon of soy, and a pinch of sugar into a paste.",
      "Sear the salmon or chicken in a little oil, skin or smooth side down first.",
      "Brush on the miso. Cook until the glaze is shiny and the center is done.",
      "Serve over rice with cucumber, edamame, and sesame.",
    ],
  },
  {
    catalogKey: "mince-burger",
    name: "Mince burger",
    method: "PAN",
    cuisine: "american",
    activeMinutes: 25,
    totalMinutes: 30,
    completePlate: false,
    variants: [
      {
        label: "Beef mince",
        proteinGroup: "BEEF",
        isDefault: true,
        ingredients: [
          { name: "beef mince", quantity: 450, unit: "G", role: "BUY" },
        ],
      },
      {
        label: "Vegan mince",
        proteinGroup: "VEGAN",
        ingredients: [
          { name: "vegan mince", quantity: 360, unit: "G", role: "BUY" },
        ],
      },
    ],
    shared: [
      { name: "lettuce", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "onion", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "salt", role: "PANTRY" },
      { name: "black pepper", role: "PANTRY" },
      { name: "oil", role: "PANTRY" },
    ],
    sides: [
      { catalogKey: "burger-buns", defaultSelected: true },
      { catalogKey: "green-salad", defaultSelected: false },
    ],
    keypoints: [
      "Season the mince.",
      "One flip.",
      "Rest a minute before you cut one open.",
    ],
    steps: [
      "Season the mince with salt and pepper. Form three patties about 2 cm thick.",
      "Heat a film of oil in a pan until hot. Cook the patties, turning once, until done to your liking.",
      "Slice the onion. Separate the lettuce.",
      "Toast the buns if you are using them. Build the burgers.",
    ],
  },
  {
    catalogKey: "lentil-soup",
    name: "Lentil soup",
    method: "ONE_POT",
    cuisine: "mediterranean",
    activeMinutes: 20,
    totalMinutes: 40,
    completePlate: true,
    variants: [
      {
        label: "Red lentils",
        proteinGroup: "VEGETARIAN",
        isDefault: true,
        ingredients: [
          { name: "red lentils", quantity: 300, unit: "G", role: "BUY" },
        ],
      },
    ],
    shared: [
      { name: "onion", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "carrot", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "tomato", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "cumin", role: "PANTRY" },
      { name: "salt", role: "PANTRY" },
      { name: "olive oil", role: "PANTRY" },
      { name: "garlic", role: "PANTRY" },
      { name: "black pepper", role: "PANTRY" },
    ],
    sides: [{ catalogKey: "bread", defaultSelected: false }],
    keypoints: [
      "Lentils collapse into the soup.",
      "It should be thick enough for a spoon to stand, almost.",
      "Acid or pepper at the end if you have lemon; the seed does not require it.",
    ],
    steps: [
      "Chop the onion, carrot, and garlic. Dice the tomato.",
      "Cook the onion and carrot in olive oil until soft. Stir in the cumin and garlic.",
      "Add the lentils, tomato, and about 1 litre of water. Salt it.",
      "Simmer until the lentils fall apart, about 20 minutes. Taste for salt and pepper.",
    ],
  },
  {
    catalogKey: "chicken-pesto-pasta",
    name: "Chicken pesto pasta",
    method: "PAN",
    cuisine: "italian",
    activeMinutes: 25,
    totalMinutes: 30,
    completePlate: true,
    variants: [
      {
        label: "Chicken",
        proteinGroup: "WHITE_MEAT",
        isDefault: true,
        ingredients: [
          { name: "chicken breast", quantity: 400, unit: "G", role: "BUY" },
        ],
      },
    ],
    shared: [
      { name: "pasta", quantity: 300, unit: "G", role: "BUY" },
      { name: "pesto", quantity: 90, unit: "G", role: "BUY" },
      { name: "cherry tomatoes", quantity: 200, unit: "G", role: "BUY" },
      { name: "salt", role: "PANTRY" },
      { name: "olive oil", role: "PANTRY" },
      { name: "black pepper", role: "PANTRY" },
    ],
    sides: [],
    keypoints: [
      "Pasta water loosens the pesto.",
      "Chicken is sliced so it cooks quickly.",
      "Tomatoes can stay raw.",
    ],
    steps: [
      "Boil the pasta in well-salted water. Save a cup of the water.",
      "Slice the chicken. Fry it in olive oil with salt until just cooked.",
      "Halve the tomatoes.",
      "Toss the pasta with pesto, a splash of pasta water, the chicken, and the tomatoes. Pepper it.",
    ],
  },
  {
    catalogKey: "chickpea-tray",
    name: "Chickpea tray",
    method: "TRAY",
    cuisine: "mediterranean",
    activeMinutes: 20,
    totalMinutes: 40,
    completePlate: true,
    variants: [
      {
        label: "Chickpeas",
        proteinGroup: "VEGAN",
        isDefault: true,
        ingredients: [
          { name: "chickpeas", quantity: 240, unit: "G", role: "BUY" },
        ],
      },
    ],
    shared: [
      { name: "red pepper", quantity: 2, unit: "PIECE", role: "BUY" },
      { name: "red onion", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "rice", quantity: 180, unit: "G", role: "BUY" },
      { name: "cumin", role: "PANTRY" },
      { name: "paprika", role: "PANTRY" },
      { name: "salt", role: "PANTRY" },
      { name: "olive oil", role: "PANTRY" },
      { name: "lemon", quantity: 1, unit: "PIECE", role: "BUY" },
      { name: "garlic", role: "PANTRY" },
    ],
    sides: [{ catalogKey: "yogurt", defaultSelected: false }],
    keypoints: [
      "The tray should brown, not steam.",
      "Lemon after roasting.",
      "Rice can cook while the oven runs.",
    ],
    steps: [
      "Heat the oven to 200°C. Start the rice.",
      "Toss chickpeas, peppers, and onion with olive oil, cumin, paprika, garlic, and salt.",
      "Roast until the peppers soften and the chickpeas color, about 25 minutes.",
      "Squeeze lemon over the tray. Serve with the rice. Add yogurt if you turned that side on.",
    ],
  },
];

async function upsertSide(
  prisma: PrismaClient,
  userId: string,
  side: (typeof SIDES)[number],
) {
  const existing = await prisma.side.findUnique({
    where: { userId_catalogKey: { userId, catalogKey: side.catalogKey } },
  });
  if (existing) return existing;

  return prisma.side.create({
    data: {
      userId,
      catalogKey: side.catalogKey,
      name: side.name,
      activeMinutes: side.activeMinutes,
      ingredients: {
        create: side.ingredients.map((ing, sortOrder) => ({
          name: ing.name,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          role: ing.role,
          sortOrder,
        })),
      },
    },
  });
}

export async function seedMeals(prisma: PrismaClient, userId: string) {
  const sideIds = new Map<string, string>();
  for (const side of SIDES) {
    const row = await upsertSide(prisma, userId, side);
    sideIds.set(side.catalogKey, row.id);
  }

  for (const meal of MEALS) {
    const existing = await prisma.meal.findUnique({
      where: { userId_catalogKey: { userId, catalogKey: meal.catalogKey } },
      include: { variants: true },
    });
    if (existing) continue;

    const created = await prisma.meal.create({
      data: {
        userId,
        catalogKey: meal.catalogKey,
        name: meal.name,
        confidence: "RECIPE",
        method: meal.method,
        cuisine: meal.cuisine,
        activeMinutes: meal.activeMinutes,
        totalMinutes: meal.totalMinutes,
        completePlate: meal.completePlate,
        baseServings: 3,
        ingredients: {
          create: meal.shared.map((ing, sortOrder) => ({
            name: ing.name,
            quantity: ing.quantity ?? null,
            unit: ing.unit ?? null,
            role: ing.role,
            sortOrder,
          })),
        },
        steps: {
          create: [
            ...meal.keypoints.map((body, sortOrder) => ({
              kind: "KEYPOINT",
              body,
              sortOrder,
            })),
            ...meal.steps.map((body, sortOrder) => ({
              kind: "STEP",
              body,
              sortOrder,
            })),
          ],
        },
        mealSides: {
          create: meal.sides.map((s) => ({
            sideId: sideIds.get(s.catalogKey)!,
            defaultSelected: s.defaultSelected,
          })),
        },
      },
    });

    for (const [i, variant] of meal.variants.entries()) {
      const v = await prisma.proteinVariant.create({
        data: {
          mealId: created.id,
          label: variant.label,
          proteinGroup: variant.proteinGroup,
          isDefault: variant.isDefault ?? i === 0,
          sortOrder: i,
        },
      });
      for (const [sortOrder, ing] of variant.ingredients.entries()) {
        await prisma.ingredient.create({
          data: {
            mealId: created.id,
            variantId: v.id,
            name: ing.name,
            quantity: ing.quantity ?? null,
            unit: ing.unit ?? null,
            role: ing.role,
            sortOrder,
          },
        });
      }
    }
  }
}
