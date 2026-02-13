import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find existing user or create demo user
  let user = await prisma.user.findFirst({
    where: { email: { not: 'chef@yacht.example' } },
  });
  if (!user) {
    user = await prisma.user.upsert({
      where: { googleId: 'demo-google-id' },
      update: {},
      create: {
        email: 'chef@yacht.example',
        name: 'Chef Demo',
        googleId: 'demo-google-id',
        avatarUrl: null,
      },
    });
  }

  console.log('Created user:', user.email);

  // Seed inventory items
  const inventoryItems = [
    { name: 'Olive Oil', category: 'FOOD', quantity: 3, unit: 'bottles', reorderThreshold: 2, expiryDate: new Date('2026-06-15') },
    { name: 'Fresh Salmon', category: 'FOOD', quantity: 2, unit: 'kg', reorderThreshold: 1, expiryDate: new Date('2026-02-18') },
    { name: 'Prosecco', category: 'BEVERAGES', quantity: 12, unit: 'bottles', reorderThreshold: 6 },
    { name: 'Still Water', category: 'BEVERAGES', quantity: 24, unit: 'bottles', reorderThreshold: 12 },
    { name: 'All-Purpose Cleaner', category: 'CLEANING', quantity: 2, unit: 'bottles', reorderThreshold: 3 },
    { name: 'Deck Soap', category: 'CLEANING', quantity: 1, unit: 'bottles', reorderThreshold: 2 },
    { name: 'Hand Towels', category: 'TOILETRIES', quantity: 20, unit: 'pcs', reorderThreshold: 10 },
    { name: 'Sunscreen SPF50', category: 'TOILETRIES', quantity: 4, unit: 'bottles', reorderThreshold: 3 },
    { name: 'Dock Lines', category: 'DECK_SUPPLIES', quantity: 6, unit: 'pcs', reorderThreshold: 4 },
    { name: 'Fenders', category: 'DECK_SUPPLIES', quantity: 8, unit: 'pcs', reorderThreshold: 4 },
    { name: 'Chef Knife Set', category: 'GALLEY', quantity: 1, unit: 'pcs', reorderThreshold: 1 },
    { name: 'Cutting Boards', category: 'GALLEY', quantity: 3, unit: 'pcs', reorderThreshold: 2 },
    { name: 'First Aid Kit', category: 'SAFETY', quantity: 2, unit: 'pcs', reorderThreshold: 1 },
    { name: 'Flares', category: 'SAFETY', quantity: 6, unit: 'pcs', reorderThreshold: 4 },
    { name: 'Lemons', category: 'FOOD', quantity: 5, unit: 'pcs', reorderThreshold: 10, expiryDate: new Date('2026-02-20') },
    { name: 'Butter', category: 'FOOD', quantity: 1, unit: 'kg', reorderThreshold: 2, expiryDate: new Date('2026-03-01') },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.create({
      data: { ...item, userId: user.id },
    });
  }

  console.log(`Created ${inventoryItems.length} inventory items`);

  // Seed provisioning lists
  const weeklyList = await prisma.provisioningList.create({
    data: {
      userId: user.id,
      name: 'Weekly Galley Restock',
      description: 'Regular weekly provisions for the galley',
      status: 'ACTIVE',
      items: {
        create: [
          { name: 'Fresh Bread', category: 'FOOD', quantity: 4, unit: 'loaves' },
          { name: 'Eggs', category: 'FOOD', quantity: 3, unit: 'dozen' },
          { name: 'Milk', category: 'BEVERAGES', quantity: 6, unit: 'L', purchased: true, purchasedAt: new Date() },
          { name: 'Orange Juice', category: 'BEVERAGES', quantity: 4, unit: 'L' },
          { name: 'Paper Towels', category: 'CLEANING', quantity: 6, unit: 'rolls', purchased: true, purchasedAt: new Date() },
        ],
      },
    },
  });

  const guestList = await prisma.provisioningList.create({
    data: {
      userId: user.id,
      name: 'Guest Charter Prep',
      description: 'Provisions for upcoming 7-day charter with 8 guests',
      status: 'DRAFT',
      items: {
        create: [
          { name: 'Champagne', category: 'BEVERAGES', quantity: 6, unit: 'bottles' },
          { name: 'Wagyu Steak', category: 'FOOD', quantity: 4, unit: 'kg' },
          { name: 'Lobster Tails', category: 'FOOD', quantity: 16, unit: 'pcs' },
          { name: 'Premium Gin', category: 'BEVERAGES', quantity: 2, unit: 'bottles' },
          { name: 'Guest Amenity Kits', category: 'TOILETRIES', quantity: 8, unit: 'pcs' },
          { name: 'Pool Towels', category: 'DECK_SUPPLIES', quantity: 16, unit: 'pcs' },
        ],
      },
    },
  });

  console.log('Created provisioning lists:', weeklyList.name, guestList.name);
  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
