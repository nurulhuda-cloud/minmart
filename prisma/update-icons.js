const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating category icons to Emojis...');

  const updates = [
    { name: 'Makanan', icon: '🍔' },
    { name: 'Minuman', icon: '🥤' },
    { name: 'Kebutuhan Harian', icon: '🧼' },
    { name: 'Elektronik', icon: '📱' }
  ];

  for (const item of updates) {
    const category = await prisma.category.findFirst({
      where: { name: item.name }
    });

    if (category) {
      await prisma.category.update({
        where: { id: category.id },
        data: { icon: item.icon }
      });
      console.log(`Updated category ${item.name} to use icon ${item.icon}`);
    } else {
      console.log(`Category ${item.name} not found.`);
    }
  }

  console.log('Category icons updated successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
