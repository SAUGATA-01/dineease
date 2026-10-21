const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const cities = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai"];

  for (const name of cities) {
    await prisma.city.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const passwordHash = await bcrypt.hash("Admin@12345", 10);

  await prisma.user.upsert({
    where: { phone: "9999999999" },
    update: {},
    create: {
      name: "Super Admin",
      phone: "9999999999",
      email: "admin@dineease.com",
      passwordHash,
      role: "ADMIN",
      isVerified: true,
    },
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());