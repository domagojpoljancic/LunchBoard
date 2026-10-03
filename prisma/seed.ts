import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedMeals } from "./seed-meals";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("lunchboard", 10);
  const user = await prisma.user.upsert({
    where: { email: "cook@lunchboard.local" },
    update: {},
    create: {
      email: "cook@lunchboard.local",
      passwordHash,
      timezone: "UTC",
    },
  });

  await seedMeals(prisma, user.id);
  console.log(`Seeded user ${user.email} with starter meals.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
