const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // 1. Create Default Admin
  const adminEmail = 'admin@toko.com';
  const adminPassword = 'admin123'; // In production, this should be hashed. For this project, the auth endpoint checks raw equality or simple check.
  
  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      password: adminPassword,
      name: 'Administrator Minmart'
    },
    create: {
      email: adminEmail,
      password: adminPassword,
      name: 'Administrator Minmart'
    }
  });
  console.log('Admin user seeded:', admin.email);

  // 2. Create Default Store Settings
  const storeSetting = await prisma.storeSetting.findFirst();
  let settings;
  if (!storeSetting) {
    settings = await prisma.storeSetting.create({
      data: {
        storeName: 'MinMart Indonesia',
        storeSlug: 'minmart',
        logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
        whatsappNumber: '6281234567890',
        address: 'Gedung Reka Jaya, Jl. Sudirman No. 45, Jakarta Selatan',
        operatingHours: '08:00 - 22:00 WIB',
        shippingPerKm: 3000,
        themeColor: '#10b981', // Emerald-500
        instagram: 'minmart.id',
        facebook: 'minmart.indonesia',
        tiktok: 'minmart.official',
        bankAccount: '123-456-7890',
        bankName: 'BCA',
        bankHolder: 'PT Minmart Retailindo',
        isOpen: true
      }
    });
    console.log('Store Settings created:', settings.storeName);
  } else {
    settings = storeSetting;
    console.log('Store Settings already exists:', settings.storeName);
  }

  // 3. Create Categories
  const categoriesData = [
    { name: 'Makanan', icon: 'Utensils', sortOrder: 1 },
    { name: 'Minuman', icon: 'CupSoda', sortOrder: 2 },
    { name: 'Kebutuhan Harian', icon: 'ShoppingBag', sortOrder: 3 },
    { name: 'Elektronik', icon: 'Smartphone', sortOrder: 4 },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.create({
      data: cat
    });
    categories.push(createdCat);
  }
  console.log(`Seeded ${categories.length} categories.`);

  // Map categories by name for easy reference
  const catMap = {};
  categories.forEach(c => {
    catMap[c.name] = c.id;
  });

  // 4. Create Banners
  const bannersData = [
    {
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80',
      title: 'Diskon Pembukaan Toko!',
      subtitle: 'Dapatkan potongan harga hingga 50% untuk produk kebutuhan harian.',
      link: '/toko?v=search',
      sortOrder: 1,
      active: true
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
      title: 'Gratis Ongkir Wilayah Jakarta',
      subtitle: 'Belanja minimal Rp 50.000, gratis biaya kirim antar langsung ke rumah Anda.',
      link: '/toko?v=search',
      sortOrder: 2,
      active: true
    }
  ];

  for (const b of bannersData) {
    await prisma.banner.create({
      data: b
    });
  }
  console.log('Seeded promo banners.');

  // 5. Create Products
  const productsData = [
    // Makanan
    {
      name: 'Indomie Goreng Spesial 85g',
      slug: 'indomie-goreng-spesial-85g',
      description: 'Mie instan goreng lezat rasa spesial khas Nusantara dengan bumbu komplit dan bawang goreng renyah.',
      categoryId: catMap['Makanan'],
      sku: 'IND-GOR-001',
      basePrice: 2800,
      sellPrice: 3500,
      stock: 120,
      minStock: 10,
      images: JSON.stringify(['https://images.unsplash.com/photo-1612966608997-30d411b4837d?w=500&auto=format&fit=crop&q=80']),
      isActive: true
    },
    {
      name: 'Biskuit Oreo Vanilla 133g',
      slug: 'biskuit-oreo-vanilla-133g',
      description: 'Biskuit sandwich cokelat dengan krim rasa vanila yang lezat. Nikmat dicelup susu!',
      categoryId: catMap['Makanan'],
      sku: 'ORE-VAN-002',
      basePrice: 7500,
      sellPrice: 9500,
      discountPrice: 8500,
      discountPercent: 10,
      stock: 45,
      minStock: 8,
      images: JSON.stringify(['https://images.unsplash.com/photo-1599490659213-e2b9527b0f76?w=500&auto=format&fit=crop&q=80']),
      isActive: true
    },
    // Minuman
    {
      name: 'Aqua Air Mineral Botol 600ml',
      slug: 'aqua-air-mineral-botol-600ml',
      description: 'Air minum dalam kemasan yang diproses dari sumber mata air alami pilihan yang terjaga kemurniannya.',
      categoryId: catMap['Minuman'],
      sku: 'AQU-600-001',
      basePrice: 2000,
      sellPrice: 3000,
      stock: 200,
      minStock: 20,
      images: JSON.stringify(['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80']),
      isActive: true
    },
    {
      name: 'Susu UHT Ultra Milk Cokelat 250ml',
      slug: 'susu-uht-ultra-milk-cokelat-250ml',
      description: 'Susu cair segar berkualitas tinggi dengan nutrisi alami yang seimbang dikombinasikan dengan rasa cokelat lezat.',
      categoryId: catMap['Minuman'],
      sku: 'ULT-COK-002',
      basePrice: 5200,
      sellPrice: 6500,
      stock: 80,
      minStock: 10,
      images: JSON.stringify(['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=80']),
      isActive: true
    },
    // Kebutuhan Harian
    {
      name: 'Sabun Mandi Cair Lifebuoy Merah 400ml',
      slug: 'sabun-mandi-cair-lifebuoy-merah-400ml',
      description: 'Sabun mandi cair antibakteri yang memberikan perlindungan total terhadap kuman dan menjaga kulit tetap segar.',
      categoryId: catMap['Kebutuhan Harian'],
      sku: 'LIF-RED-400',
      basePrice: 21000,
      sellPrice: 25000,
      discountPrice: 22000,
      discountPercent: 12,
      stock: 35,
      minStock: 5,
      images: JSON.stringify(['https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&auto=format&fit=crop&q=80']),
      isActive: true
    },
    {
      name: 'Minyak Goreng Bimoli Spesial 2L',
      slug: 'minyak-goreng-bimoli-spesial-2l',
      description: 'Minyak goreng berkualitas tinggi yang diproses dari kelapa sawit pilihan, membuat masakan lebih renyah dan gurih.',
      categoryId: catMap['Kebutuhan Harian'],
      sku: 'BIM-2L-001',
      basePrice: 32000,
      sellPrice: 38000,
      stock: 4, // low stock warning test
      minStock: 5,
      images: JSON.stringify(['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80']),
      isActive: true
    },
    // Elektronik
    {
      name: 'Kabel Data Type-C Anker PowerLine II',
      slug: 'kabel-data-type-c-anker-powerline-ii',
      description: 'Kabel pengisian daya cepat dan transfer data yang tahan lama dan memiliki ketahanan tinggi terhadap lekukan.',
      categoryId: catMap['Elektronik'],
      sku: 'ANK-TYC-01',
      basePrice: 75000,
      sellPrice: 99000,
      discountPrice: 89000,
      discountPercent: 10,
      stock: 15,
      minStock: 3,
      images: JSON.stringify(['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=80']),
      isActive: true
    }
  ];

  for (const prod of productsData) {
    const createdProduct = await prisma.product.create({
      data: prod
    });
    
    // Also create an initial stock movement for tracking
    await prisma.stockMovement.create({
      data: {
        productId: createdProduct.id,
        type: 'in',
        quantity: prod.stock,
        note: 'Stok awal dari inisialisasi system'
      }
    });
  }
  console.log('Seeded default products and initial stock movements.');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
