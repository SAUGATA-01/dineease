const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const SLOTS = ["12:00", "13:00", "14:00", "19:00", "20:00", "21:00"];
const TABLE_CAPACITIES = [2, 2, 4, 4, 4, 6, 6, 8];

const MENUS = {
  north: [
    ["Starters", "Paneer Tikka", 260, true],
    ["Starters", "Chicken Tikka", 320, false],
    ["Main Course", "Dal Makhani", 240, true],
    ["Main Course", "Butter Chicken", 340, false],
    ["Breads", "Butter Naan", 60, true],
    ["Desserts", "Gulab Jamun", 120, true],
  ],
  south: [
    ["Breakfast", "Masala Dosa", 120, true],
    ["Breakfast", "Idli Vada", 90, true],
    ["Meals", "Full Meals", 220, true],
    ["Meals", "Chicken Chettinad", 300, false],
    ["Drinks", "Filter Coffee", 50, true],
  ],
  chinese: [
    ["Starters", "Veg Manchurian", 200, true],
    ["Starters", "Chilli Chicken", 280, false],
    ["Main Course", "Hakka Noodles", 220, true],
    ["Main Course", "Schezwan Fried Rice", 240, true],
    ["Soups", "Hot and Sour Soup", 120, true],
  ],
  cafe: [
    ["Snacks", "Veg Sandwich", 150, true],
    ["Snacks", "Peri Peri Fries", 160, true],
    ["Mains", "Pasta Alfredo", 280, true],
    ["Mains", "Grilled Chicken Burger", 300, false],
    ["Drinks", "Cold Coffee", 140, true],
    ["Desserts", "Brownie with Ice Cream", 180, true],
  ],
};

const RESTAURANTS = [
  { 
    city: "Bengaluru", 
    name: "Spice Junction", 
    cuisine: "North Indian", 
    menu: "north", 
    cost: 800, 
    address: "12, MG Road, Bengaluru", 
    description: "Serving rich gravies and authentic kebabs fresh from the tandoor. Perfect for family dinners." 
  },
  { 
    city: "Bengaluru", 
    name: "Dosa Darbar", 
    cuisine: "South Indian", 
    menu: "south", 
    cost: 400, 
    address: "45, Jayanagar 4th Block, Bengaluru", 
    description: "Famous for crispy dosas and aromatic filter coffee. Always bustling, whether for breakfast or dinner." 
  },
  { 
    city: "Bengaluru", 
    name: "Dragon Wok", 
    cuisine: "Chinese", 
    menu: "chinese", 
    cost: 700, 
    address: "8, Indiranagar, Bengaluru", 
    description: "Authentic Indo-Chinese delicacies prepared over high-flame woks." 
  },
  { 
    city: "Mumbai", 
    name: "Marine Drive Cafe", 
    cuisine: "Cafe", 
    menu: "cafe", 
    cost: 900, 
    address: "Marine Drive, Mumbai", 
    description: "Enjoy premium coffee and delicious snacks paired with an exquisite oceanfront view." 
  },
  { 
    city: "Mumbai", 
    name: "Punjabi Tadka", 
    cuisine: "North Indian", 
    menu: "north", 
    cost: 650, 
    address: "Andheri West, Mumbai", 
    description: "Homestyle Punjabi food served in generous portions." 
  },
  { 
    city: "Delhi", 
    name: "Chandni Chowk Rasoi", 
    cuisine: "North Indian", 
    menu: "north", 
    cost: 600, 
    address: "Connaught Place, Delhi", 
    description: "Experience the classic flavors of Delhi under a single roof." 
  },
];

const REVIEWS = [
  [5, "The food was absolutely delicious and the service was very fast."],
  [4, "Great experience, although we had to wait a little bit for our table."],
  [5, "Visited with family and everyone thoroughly enjoyed the food."],
  [3, "The food was average, and it felt a bit overpriced."],
];

async function main() {
  const passwordHash = await bcrypt.hash("Demo@12345", 10);

  const owner = await prisma.user.upsert({
    where: { phone: "9888888888" },
    update: {},
    create: { name: "Demo Owner", phone: "9888888888", passwordHash, role: "RESTAURANT", isVerified: true },
  });

  const customers = [];
  for (let i = 0; i < 4; i++) {
    const c = await prisma.user.upsert({
      where: { phone: `977777777${i}` },
      update: {},
      create: { name: `Demo Customer ${i + 1}`, phone: `977777777${i}`, passwordHash, role: "CUSTOMER", isVerified: true },
    });
    customers.push(c);
  }

  for (const r of RESTAURANTS) {
    const exists = await prisma.restaurant.findFirst({ where: { name: r.name, ownerId: owner.id } });
    if (exists) continue;

    const city = await prisma.city.findUnique({ where: { name: r.city } });
    if (!city) continue;

    const restaurant = await prisma.restaurant.create({
      data: {
        ownerId: owner.id,
        cityId: city.id,
        name: r.name,
        cuisine: r.cuisine,
        address: r.address,
        description: r.description,
        costForTwo: r.cost,
        status: "APPROVED",
      },
    });

    await prisma.restaurantTable.createMany({
      data: TABLE_CAPACITIES.map((capacity, i) => ({
        restaurantId: restaurant.id,
        tableNumber: i + 1,
        capacity,
      })),
    });

    await prisma.slot.createMany({
      data: SLOTS.map((time) => ({ restaurantId: restaurant.id, time })),
    });

    await prisma.menuItem.createMany({
      data: MENUS[r.menu].map(([category, name, price, isVeg]) => ({
        restaurantId: restaurant.id,
        category,
        name,
        price,
        isVeg,
      })),
    });

    await prisma.review.createMany({
      data: customers.map((c, i) => ({
        customerId: c.id,
        restaurantId: restaurant.id,
        rating: REVIEWS[i][0],
        comment: REVIEWS[i][1],
      })),
    });
  }

  console.log("Demo data ready");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
