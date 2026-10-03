# Starter meals

Seed exactly these meals and sides for the dev user. Confidence is `RECIPE`. Base servings are 3. Amounts are for 3 portions.

Shared sides are created once and linked.

## Sides

| catalogKey | Name | Active min | Ingredients |
| --- | --- | --- | --- |
| pasta | Pasta | 10 | spaghetti 300 G BUY; salt PANTRY |
| green-salad | Green salad | 5 | salad leaves 80 G BUY; lemon 1 PIECE BUY |
| potatoes | Potatoes | 15 | potatoes 600 G BUY; salt PANTRY |
| burger-buns | Burger buns | 0 | burger buns 3 PIECE BUY |
| bread | Bread | 0 | bread 1 PIECE BUY |
| lettuce | Lettuce | 5 | lettuce 1 PIECE BUY |
| yogurt | Yogurt | 0 | plain yogurt 150 G BUY |

## 1. Bolognese

- catalogKey: `bolognese`
- method: `PAN` · cuisine: `italian` · active 35 · total 70 · completePlate: false
- Variants: **Beef mince** `BEEF` default, ingredient beef mince 450 G BUY. **Vegan mince** `VEGAN`, ingredient vegan mince 360 G BUY.
- Shared BUY: onion 1 PIECE, carrot 1 PIECE, passata 500 G
- Pantry: olive oil, salt, black pepper, garlic, dried oregano
- Sides: pasta `defaultSelected` true, green salad false
- Keypoints: Fine dice. Simmer until the sauce clings to a spoon. Salt at the end.
- Steps:
  1. Peel and finely chop the onion, carrot, and garlic.
  2. Warm a film of olive oil in a wide pan. Cook the onion and carrot until soft.
  3. Add the mince. Break it up and cook until it loses its raw look.
  4. Pour in the passata, oregano, salt, and pepper. Simmer about 30 minutes, until thick.
  5. If you are serving pasta, boil it in salted water and toss it with the sauce.

## 2. Goulash

- catalogKey: `goulash`
- method: `ONE_POT` · cuisine: `hungarian` · active 25 · total 90 · completePlate: true
- Variant: **Beef** `BEEF` default, beef chuck 600 G BUY
- Shared BUY: onion 2 PIECE, red pepper 2 PIECE, tomato 2 PIECE
- Pantry: oil, salt, sweet paprika, black pepper, garlic
- Sides: potatoes false
- Keypoints: Paprika goes in off the heat. The beef should yield to a spoon. Thicker than soup.
- Steps:
  1. Cut the beef into bite-size pieces. Slice the onions and peppers.
  2. Brown the beef in oil in a heavy pot, then set it aside.
  3. Cook the onions until soft. Take the pot off the heat and stir in the paprika.
  4. Return the beef. Add peppers, tomato, garlic, salt, and pepper, and enough water to barely cover.
  5. Cover and simmer until the beef is tender, about an hour. Taste for salt.

## 3. Lasagne

- catalogKey: `lasagne`
- method: `BAKE` · cuisine: `italian` · active 40 · total 80 · completePlate: true
- Variants: **Beef mince** `BEEF` default, beef mince 500 G BUY. **Vegan mince** `VEGAN`, vegan mince 400 G BUY.
- Shared BUY: lasagne sheets 200 G, passata 500 G, mozzarella 250 G, milk 500 ML, butter 40 G, flour 40 G, onion 1 PIECE
- Pantry: salt, black pepper, nutmeg, dried oregano, garlic, olive oil
- Sides: green salad false
- Keypoints: Meat sauce should be thick before it goes in the dish. White sauce coats the back of a spoon. Bake until the top is brown and the edge bubbles.
- Steps:
  1. Cook the onion and garlic in olive oil. Add the mince, oregano, and passata. Simmer until thick. Salt it.
  2. Melt the butter, stir in the flour, then whisk in the milk. Season with salt, pepper, and nutmeg.
  3. Layer meat sauce, sheets, and white sauce. Finish with white sauce and mozzarella.
  4. Bake until bubbling and brown, about 35 minutes. Rest 10 minutes before cutting.

## 4. Chicken grain bowl

- catalogKey: `chicken-grain-bowl`
- method: `TRAY` · cuisine: `mediterranean` · active 25 · total 45 · completePlate: true
- Variant: **Chicken** `WHITE_MEAT` default, chicken breast 450 G BUY
- Shared BUY: quinoa 180 G, broccoli 250 G, zucchini 1 PIECE, cucumber 1 PIECE, plain yogurt 200 G
- Pantry: olive oil, lemon, garlic, salt, dried oregano
- Sides: none
- Keypoints: Chicken is done at a clear center. Quinoa is tender with a little bite. Lemon at the end.
- Steps:
  1. Heat the oven to 200°C. Toss broccoli and zucchini with olive oil and salt. Roast about 20 minutes.
  2. Rub the chicken with oil, oregano, salt, and garlic. Roast on the same tray until just cooked.
  3. Simmer the quinoa in salted water until tender. Drain.
  4. Slice the chicken and cucumber. Stir lemon and a pinch of salt into the yogurt. Serve the bowl with the yogurt on top.

## 5. Ginger chicken rice

- catalogKey: `ginger-chicken-rice`
- method: `PAN` · cuisine: `asian` · active 25 · total 35 · completePlate: true
- Variant: **Chicken** `WHITE_MEAT` default, chicken thigh 450 G BUY
- Shared BUY: rice 180 G, lime 1 PIECE
- Pantry: garlic, ginger, soy sauce, oil, salt
- Sides: lettuce false
- Keypoints: High heat, short cook. The rice is plain. Lime and soy do the seasoning.
- Steps:
  1. Start the rice in salted water.
  2. Slice the chicken. Fry it in a little oil until browned and cooked through.
  3. Add garlic and ginger. Stir for half a minute. Splash in soy sauce.
  4. Serve over the rice with lime. Add lettuce leaves if you turned that side on.

## 6. Bean and tuna salad

- catalogKey: `bean-tuna-salad`
- method: `ASSEMBLE` · cuisine: `mediterranean` · active 20 · total 20 · completePlate: true
- Variants: **Tuna** `FISH` default, tuna 240 G BUY. **Chicken** `WHITE_MEAT`, chicken breast 400 G BUY.
- Shared BUY: cannellini beans 240 G, cherry tomatoes 200 G, red onion 1 PIECE, parsley 1 PIECE
- Pantry: olive oil, lemon, salt, black pepper
- Sides: none
- Keypoints: Drain the beans and the tuna well. Dress it so it shines, not so it pools. Rest five minutes.
- Steps:
  1. Rinse and drain the beans. Drain the tuna, or cut the cooked chicken into pieces.
  2. Halve the tomatoes. Slice the onion thinly. Chop the parsley.
  3. Toss with olive oil, lemon, salt, and pepper.
  4. Taste. Add more lemon if it tastes flat.

For the chicken option, the step still reads. The ingredient line is chicken, not a second recipe.

## 7. Chicken burrito bowl

- catalogKey: `chicken-burrito-bowl`
- method: `ASSEMBLE` · cuisine: `mexican` · active 30 · total 35 · completePlate: true
- Variant: **Chicken** `WHITE_MEAT` default, chicken breast 450 G BUY
- Shared BUY: rice 180 G, black beans 240 G, sweetcorn 150 G, salsa 150 G, avocado 1 PIECE
- Pantry: cumin, salt, oil, lime, garlic
- Sides: none
- Keypoints: Season the chicken, not just the bowl. Avocado goes on at the end. Lime over everything.
- Steps:
  1. Cook the rice in salted water.
  2. Rub the chicken with oil, cumin, garlic, and salt. Pan-fry until cooked, then slice.
  3. Warm the beans and corn.
  4. Build the bowl: rice, beans, corn, chicken, salsa, avocado, lime.

## 8. Miso donburi

- catalogKey: `miso-donburi`
- method: `PAN` · cuisine: `japanese` · active 25 · total 30 · completePlate: true
- Variants: **Salmon** `FISH` default, salmon 360 G BUY. **Chicken** `WHITE_MEAT`, chicken thigh 450 G BUY.
- Shared BUY: rice 180 G, cucumber 1 PIECE, edamame 150 G
- Pantry: miso, soy sauce, sugar, sesame, oil
- Sides: none
- Keypoints: Miso glaze should bubble and turn glossy, not burn. Rice is warm. Cucumber stays cold.
- Steps:
  1. Cook the rice. Slice the cucumber. Thaw the edamame if frozen.
  2. Stir miso, a spoon of soy, and a pinch of sugar into a paste.
  3. Sear the salmon or chicken in a little oil, skin or smooth side down first.
  4. Brush on the miso. Cook until the glaze is shiny and the center is done.
  5. Serve over rice with cucumber, edamame, and sesame.

## 9. Mince burger

- catalogKey: `mince-burger`
- method: `PAN` · cuisine: `american` · active 25 · total 30 · completePlate: false
- Variants: **Beef mince** `BEEF` default, beef mince 450 G BUY. **Vegan mince** `VEGAN`, vegan mince 360 G BUY.
- Shared BUY: lettuce 1 PIECE, onion 1 PIECE
- Pantry: salt, black pepper, oil
- Sides: burger buns true, green salad false
- Keypoints: Season the mince. One flip. Rest a minute before you cut one open.
- Steps:
  1. Season the mince with salt and pepper. Form three patties about 2 cm thick.
  2. Heat a film of oil in a pan until hot. Cook the patties, turning once, until done to your liking.
  3. Slice the onion. Separate the lettuce.
  4. Toast the buns if you are using them. Build the burgers.

## 10. Lentil soup

- catalogKey: `lentil-soup`
- method: `ONE_POT` · cuisine: `mediterranean` · active 20 · total 40 · completePlate: true
- Variant: **Red lentils** `VEGETARIAN` default, red lentils 300 G BUY
- Shared BUY: onion 1 PIECE, carrot 1 PIECE, tomato 1 PIECE
- Pantry: cumin, salt, olive oil, garlic, black pepper
- Sides: bread false
- Keypoints: Lentils collapse into the soup. It should be thick enough for a spoon to stand, almost. Acid or pepper at the end if you have lemon; the seed does not require it.
- Steps:
  1. Chop the onion, carrot, and garlic. Dice the tomato.
  2. Cook the onion and carrot in olive oil until soft. Stir in the cumin and garlic.
  3. Add the lentils, tomato, and about 1 litre of water. Salt it.
  4. Simmer until the lentils fall apart, about 20 minutes. Taste for salt and pepper.

## 11. Chicken pesto pasta

- catalogKey: `chicken-pesto-pasta`
- method: `PAN` · cuisine: `italian` · active 25 · total 30 · completePlate: true
- Variant: **Chicken** `WHITE_MEAT` default, chicken breast 400 G BUY
- Shared BUY: pasta 300 G, pesto 90 G, cherry tomatoes 200 G
- Pantry: salt, olive oil, black pepper
- Sides: none
- Keypoints: Pasta water loosens the pesto. Chicken is sliced so it cooks quickly. Tomatoes can stay raw.
- Steps:
  1. Boil the pasta in well-salted water. Save a cup of the water.
  2. Slice the chicken. Fry it in olive oil with salt until just cooked.
  3. Halve the tomatoes.
  4. Toss the pasta with pesto, a splash of pasta water, the chicken, and the tomatoes. Pepper it.

## 12. Chickpea tray

- catalogKey: `chickpea-tray`
- method: `TRAY` · cuisine: `mediterranean` · active 20 · total 40 · completePlate: true
- Variant: **Chickpeas** `VEGAN` default, chickpeas 240 G BUY
- Shared BUY: red pepper 2 PIECE, red onion 1 PIECE, rice 180 G
- Pantry: cumin, paprika, salt, olive oil, lemon, garlic
- Sides: yogurt false
- Keypoints: The tray should brown, not steam. Lemon after roasting. Rice can cook while the oven runs.
- Steps:
  1. Heat the oven to 200°C. Start the rice.
  2. Toss chickpeas, peppers, and onion with olive oil, cumin, paprika, garlic, and salt.
  3. Roast until the peppers soften and the chickpeas color, about 25 minutes.
  4. Squeeze lemon over the tray. Serve with the rice. Add yogurt if you turned that side on.

## Seed rules

- Garlic in pantry lines is the dried or jar measure the cook already keeps, except where a recipe’s shared BUY list names a fresh ingredient. These recipes list garlic as pantry.
- Do not attach a side that is not in the table above.
- Do not invent a second set of steps for the vegan or chicken variant.
