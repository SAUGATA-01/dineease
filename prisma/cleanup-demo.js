const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEMO_PHONES = [
  "9888888888",
  "9777777770",
  "9777777771",
  "9777777772",
  "9777777773",
];

async function main() {
  const users = await prisma.user.findMany({ where: { phone: { in: DEMO_PHONES } } });
  const userIds = users.map((u) => u.id);

  const restaurants = await prisma.restaurant.findMany({ where: { ownerId: { in: userIds } } });
  const restIds = restaurants.map((r) => r.id);

  await prisma.$transaction([
    prisma.booking.deleteMany({
      where: { OR: [{ customerId: { in: userIds } }, { restaurantId: { in: restIds } }] },
    }),
    prisma.review.deleteMany({
      where: { OR: [{ customerId: { in: userIds } }, { restaurantId: { in: restIds } }] },
    }),
    // tables, slots, menu, holidays restaurant ke saath apne aap delete ho jaate hain
    prisma.restaurant.deleteMany({ where: { id: { in: restIds } } }),
    prisma.otp.deleteMany({ where: { phone: { in: DEMO_PHONES } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ]);

  console.log(`Deleted ${users.length} demo users and ${restaurants.length} demo restaurants`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());