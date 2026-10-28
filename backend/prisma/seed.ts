import { Role, UserStatus, SmeStatus, DeliveryStatusEnum } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting SokoLink Kenya seed script...");

  // 1. Password hash
  const adminPassword = await bcrypt.hash("Admin@2026!", 12);
  const smePassword = await bcrypt.hash("Sme@2026!", 12);
  const deliveryPassword = await bcrypt.hash("Rider@2026!", 12);
  const customerPassword = await bcrypt.hash("Customer@2026!", 12);

  // 2. Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@sokolink.co.ke" },
    update: {},
    create: {
      email: "admin@sokolink.co.ke",
      passwordHash: adminPassword,
      name: "SokoLink Administrator",
      phone: "+254700000001",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log("✅ Admin user ready:", admin.email);

  // 3. SME Users & Profiles
  // SME 1: Nairobi Electronics Hub
  const sme1User = await prisma.user.upsert({
    where: { email: "kazi@nairobielectronics.co.ke" },
    update: {},
    create: {
      email: "kazi@nairobielectronics.co.ke",
      passwordHash: smePassword,
      name: "David Mwangi",
      phone: "+254711100001",
      role: Role.SME,
      status: UserStatus.ACTIVE,
    },
  });

  const sme1 = await prisma.sMEProfile.upsert({
    where: { userId: sme1User.id },
    update: {},
    create: {
      userId: sme1User.id,
      businessName: "Nairobi Electronics Hub",
      businessSlug: "nairobi-electronics-hub",
      businessDescription: "Kenya's trusted provider of tested solar accessories, powerbanks, audio accessories, and smartphones.",
      category: "Electronics & Gadgets",
      registrationNumber: "BN-2023-99881",
      taxPin: "P051234567A",
      phone: "+254711100001",
      location: "Nairobi CBD",
      address: "Luthuli Avenue, Munyu Trade Centre, Shop G12",
      status: SmeStatus.APPROVED,
      commissionRate: 5.0,
      isFeatured: true,
      rating: 4.8,
      ratingCount: 42,
    },
  });

  // SME 2: Maasai Artisans Collective
  const sme2User = await prisma.user.upsert({
    where: { email: "sales@maasaicrafts.co.ke" },
    update: {},
    create: {
      email: "sales@maasaicrafts.co.ke",
      passwordHash: smePassword,
      name: "Naisula Ole Sakuda",
      phone: "+254722200002",
      role: Role.SME,
      status: UserStatus.ACTIVE,
    },
  });

  const sme2 = await prisma.sMEProfile.upsert({
    where: { userId: sme2User.id },
    update: {},
    create: {
      userId: sme2User.id,
      businessName: "Maasai Artisans Collective",
      businessSlug: "maasai-artisans-collective",
      businessDescription: "Handmade authentic beaded jewelry, leather sandals, kiondos, and wooden carvings by artisan women from Kajiado and Narok.",
      category: "Handmade Crafts & Gifts",
      registrationNumber: "BN-2022-44120",
      taxPin: "P052345678B",
      phone: "+254722200002",
      location: "Westlands, Nairobi",
      address: "Sarit Centre Maasai Market, Booth 14",
      status: SmeStatus.APPROVED,
      commissionRate: 5.0,
      isFeatured: true,
      rating: 4.9,
      ratingCount: 88,
    },
  });

  // SME 3: Kilimo Fresh Farm Produce
  const sme3User = await prisma.user.upsert({
    where: { email: "mama@kilimogreen.co.ke" },
    update: {},
    create: {
      email: "mama@kilimogreen.co.ke",
      passwordHash: smePassword,
      name: "Grace Njeri",
      phone: "+254733300003",
      role: Role.SME,
      status: UserStatus.ACTIVE,
    },
  });

  const sme3 = await prisma.sMEProfile.upsert({
    where: { userId: sme3User.id },
    update: {},
    create: {
      userId: sme3User.id,
      businessName: "Kilimo Fresh Farm Produce",
      businessSlug: "kilimo-fresh-farm-produce",
      businessDescription: "Direct-from-farm organic vegetables, ripe hass avocados, local honey, and cold-pressed cooking oils harvested in Limuru and Kinangop.",
      category: "Fresh Groceries & Produce",
      registrationNumber: "BN-2024-11002",
      taxPin: "P053456789C",
      phone: "+254733300003",
      location: "Limuru / Nairobi Distribution",
      address: "Limuru Road, Farm Depot B5",
      status: SmeStatus.APPROVED,
      commissionRate: 4.5,
      isFeatured: true,
      rating: 4.7,
      ratingCount: 65,
    },
  });

  // SME 4 (Pending Approval for admin verification demo)
  const sme4User = await prisma.user.upsert({
    where: { email: "pending@savannahgoods.co.ke" },
    update: {},
    create: {
      email: "pending@savannahgoods.co.ke",
      passwordHash: smePassword,
      name: "Brian Otieno",
      phone: "+254744400004",
      role: Role.SME,
      status: UserStatus.PENDING,
    },
  });

  await prisma.sMEProfile.upsert({
    where: { userId: sme4User.id },
    update: {},
    create: {
      userId: sme4User.id,
      businessName: "Savannah Natural Honey & Spices",
      businessSlug: "savannah-natural-honey",
      businessDescription: "Raw unrefined acacia honey from Baringo and organic coastal spices from Kilifi.",
      category: "Fresh Groceries & Produce",
      registrationNumber: "BN-2025-00123",
      taxPin: "P054567890D",
      phone: "+254744400004",
      location: "Upper Hill, Nairobi",
      address: "Mara Road, Suite 204",
      status: SmeStatus.PENDING,
      commissionRate: 5.0,
      isFeatured: false,
      rating: 0.0,
      ratingCount: 0,
    },
  });

  // 4. Delivery Personnel
  const deliveryUser = await prisma.user.upsert({
    where: { email: "rider@sokolink.co.ke" },
    update: {},
    create: {
      email: "rider@sokolink.co.ke",
      passwordHash: deliveryPassword,
      name: "Juma Ochieng",
      phone: "+254755500005",
      role: Role.DELIVERY,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.deliveryProfile.upsert({
    where: { userId: deliveryUser.id },
    update: {},
    create: {
      userId: deliveryUser.id,
      vehicleType: "Motorbike (Boxed Courier)",
      vehiclePlate: "KMDF 452X",
      idNumber: "32981044",
      licenseNumber: "DL-NRB-2021-99",
      status: DeliveryStatusEnum.AVAILABLE,
      isApproved: true,
      rating: 4.95,
      completedOrders: 154,
    },
  });
  console.log("✅ Delivery rider ready:", deliveryUser.email);

  // 5. Customer User & Address
  const customerUser = await prisma.user.upsert({
    where: { email: "wambui.kamau@gmail.com" },
    update: {},
    create: {
      email: "wambui.kamau@gmail.com",
      passwordHash: customerPassword,
      name: "Wambui Kamau",
      phone: "+254799900009",
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    },
  });

  const customerAddress = await prisma.address.create({
    data: {
      userId: customerUser.id,
      title: "Apartment",
      recipientName: "Wambui Kamau",
      phone: "+254799900009",
      county: "Nairobi",
      subCounty: "Kilimani",
      estateOrStreet: "Argwings Kodhek Rd, Silver Harbor Apts, Door 4B",
      landmark: "Near Yaya Centre",
      isDefault: true,
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: customerUser.id },
    update: { defaultAddressId: customerAddress.id },
    create: {
      userId: customerUser.id,
      defaultAddressId: customerAddress.id,
    },
  });
  console.log("✅ Customer ready:", customerUser.email);

  // 6. Categories
  const categoriesData = [
    {
      name: "Electronics & Gadgets",
      slug: "electronics-gadgets",
      description: "Smartphones, solar kits, soundbars, power supplies, and accessories for home and work.",
      imageUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80",
      icon: "Cpu",
    },
    {
      name: "Handmade Crafts & Gifts",
      slug: "handmade-crafts-gifts",
      description: "Authentic Kenyan beadwork, woven kiondo baskets, soapstone, and wood art.",
      imageUrl: "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80",
      icon: "Sparkles",
    },
    {
      name: "Fresh Groceries & Produce",
      slug: "fresh-groceries-produce",
      description: "Farm fresh vegetables, high-grade avocados, pure honey, and staple pantry essentials.",
      imageUrl: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80",
      icon: "Apple",
    },
    {
      name: "Fashion & Apparel",
      slug: "fashion-apparel",
      description: "Kitenge designs, modern African streetwear, Maasai shukas, and handmade leather sandals.",
      imageUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80",
      icon: "Shirt",
    },
    {
      name: "Home & Kitchenware",
      slug: "home-kitchenware",
      description: "Ceramics, eco-cookware, solar home lamps, and handcrafted home furnishings.",
      imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
      icon: "Home",
    },
    {
      name: "Beauty & Personal Care",
      slug: "beauty-personal-care",
      description: "Shea butter, cold-pressed coconut oil, organic soaps, and Kenyan botanical skincare.",
      imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      icon: "Heart",
    },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoryMap.set(cat.slug, created.id);
  }
  console.log("✅ Categories populated");

  // 7. Products
  const productsData = [
    // Electronics
    {
      smeId: sme1.id,
      categoryId: categoryMap.get("electronics-gadgets")!,
      name: "Solar King 20,000mAh Rugged Solar Powerbank",
      slug: "solar-king-20000mah-rugged-solar-powerbank",
      description: "Dual USB-C fast charging with integrated monocrystalline solar panel, bright LED camping torch, and shockproof rubber casing. Ideal for safari, travel, and load-shedding backup in Kenya.",
      sku: "NEH-SOL-20K",
      price: 3850.0,
      discountedPrice: 3299.0,
      stock: 45,
      condition: "NEW",
      location: "Nairobi CBD",
      images: [
        "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      smeId: sme1.id,
      categoryId: categoryMap.get("electronics-gadgets")!,
      name: "BassPro Wireless Bluetooth Speaker 40W",
      slug: "basspro-wireless-bluetooth-speaker-40w",
      description: "IPX7 waterproof portable speaker with rich bass, FM radio tuner, USB drive playback, and 12-hour continuous battery life.",
      sku: "NEH-SPK-40W",
      price: 4950.0,
      discountedPrice: 4400.0,
      stock: 28,
      condition: "NEW",
      location: "Nairobi CBD",
      images: [
        "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      smeId: sme1.id,
      categoryId: categoryMap.get("electronics-gadgets")!,
      name: "TrueSound ENC Noise Cancelling Earbuds",
      slug: "truesound-enc-noise-cancelling-earbuds",
      description: "Crystal clear call microphone, low latency gaming mode, touch controls, and compact charging case.",
      sku: "NEH-EBD-PRO",
      price: 2400.0,
      discountedPrice: 1999.0,
      stock: 60,
      condition: "NEW",
      location: "Nairobi CBD",
      images: [
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
      ],
    },

    // Crafts
    {
      smeId: sme2.id,
      categoryId: categoryMap.get("handmade-crafts-gifts")!,
      name: "Traditional Handwoven Sisal & Leather Kiondo Bag",
      slug: "traditional-handwoven-sisal-leather-kiondo-bag",
      description: "Carefully woven from natural coastal sisal fiber with durable Kenyan cowhide leather straps and zip lining. Fashionable, eco-friendly, and supports women weavers.",
      sku: "MAC-KND-01",
      price: 3200.0,
      discountedPrice: 2800.0,
      stock: 18,
      condition: "HANDMADE",
      location: "Westlands, Nairobi",
      images: [
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      smeId: sme2.id,
      categoryId: categoryMap.get("handmade-crafts-gifts")!,
      name: "Authentic Maasai Beaded Choker & Cuff Set",
      slug: "authentic-maasai-beaded-choker-cuff-set",
      description: "Exquisite hand-threaded glass bead necklace and matching wrist cuff representing traditional cultural symbols of harmony and celebration.",
      sku: "MAC-CHK-07",
      price: 1850.0,
      discountedPrice: 1500.0,
      stock: 35,
      condition: "HANDMADE",
      location: "Westlands, Nairobi",
      images: [
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      smeId: sme2.id,
      categoryId: categoryMap.get("handmade-crafts-gifts")!,
      name: "Hand-Carved Olive Wood Salad Servers Set",
      slug: "hand-carved-olive-wood-salad-servers-set",
      description: "Artisan salad spoon and fork hand-carved from wild olive wood with batik cow bone handles.",
      sku: "MAC-WD-SLD",
      price: 1450.0,
      discountedPrice: 1250.0,
      stock: 22,
      condition: "HANDMADE",
      location: "Westlands, Nairobi",
      images: [
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      ],
    },

    // Groceries
    {
      smeId: sme3.id,
      categoryId: categoryMap.get("fresh-groceries-produce")!,
      name: "Premium Limuru Hass Avocados (Box of 8 Extra-Large)",
      slug: "premium-limuru-hass-avocados-box-of-8",
      description: "Directly harvested rich, buttery, export-grade Hass avocados grown with organic compost in the fertile red soils of Limuru.",
      sku: "KFG-AVO-08",
      price: 650.0,
      discountedPrice: 550.0,
      stock: 75,
      condition: "NEW",
      location: "Limuru / Nairobi",
      images: [
        "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      smeId: sme3.id,
      categoryId: categoryMap.get("fresh-groceries-produce")!,
      name: "Raw Pure Baringo Acacia Honey (1kg Glass Jar)",
      slug: "raw-pure-baringo-acacia-honey-1kg",
      description: "100% natural unfiltered honey harvested by traditional beekeepers in the arid acacia woodlands of Baringo. Zero additives or added sugars.",
      sku: "KFG-HNY-1KG",
      price: 1200.0,
      discountedPrice: 1100.0,
      stock: 40,
      condition: "NEW",
      location: "Limuru / Nairobi",
      images: [
        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
      ],
    },
    {
      smeId: sme3.id,
      categoryId: categoryMap.get("fresh-groceries-produce")!,
      name: "Organic Farm Fresh Vegetable Basket (Weekly Family Pack)",
      slug: "organic-farm-fresh-vegetable-basket-weekly-pack",
      description: "Includes fresh sukuma wiki, spinach, coriander, sweet carrots, red onions, capsicum, and vine-ripened tomatoes. Farm harvested morning of delivery.",
      sku: "KFG-VEG-BSK",
      price: 1800.0,
      discountedPrice: 1650.0,
      stock: 30,
      condition: "NEW",
      location: "Limuru / Nairobi",
      images: [
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
      ],
    },
  ];

  for (const prod of productsData) {
    const { images, ...productFields } = prod;
    const existing = await prisma.product.findUnique({ where: { slug: prod.slug } });
    let productId = existing?.id;

    if (!existing) {
      const created = await prisma.product.create({
        data: {
          ...productFields,
          isApproved: true,
          isActive: true,
          rating: 4.8,
          reviewCount: 12,
        },
      });
      productId = created.id;

      // Add image
      for (let i = 0; i < images.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: created.id,
            url: images[i],
            isPrimary: i === 0,
            displayOrder: i,
          },
        });
      }

      // Initial Inventory movement
      await prisma.inventoryMovement.create({
        data: {
          productId: created.id,
          changeType: "RESTOCK",
          quantityChange: prod.stock,
          previousStock: 0,
          newStock: prod.stock,
          notes: "Initial inventory setup from supplier",
          createdBy: "SEED_SYSTEM",
        },
      });
    }
  }
  console.log("✅ Sample products populated with inventory & images");

  // 8. Coupons
  await prisma.coupon.upsert({
    where: { code: "KARIBU10" },
    update: {},
    create: {
      code: "KARIBU10",
      description: "Welcome to SokoLink! Enjoy 10% discount on your first order.",
      discountType: "PERCENTAGE",
      discountValue: 10.0,
      minOrderValue: 1500.0,
      maxDiscount: 1000.0,
      validFrom: new Date("2025-01-01"),
      validUntil: new Date("2027-12-31"),
      usageLimit: 1000,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "SOKO500" },
    update: {},
    create: {
      code: "SOKO500",
      description: "Flat KES 500 discount for orders over KES 3,000.",
      discountType: "FIXED_AMOUNT",
      discountValue: 500.0,
      minOrderValue: 3000.0,
      validFrom: new Date("2025-01-01"),
      validUntil: new Date("2027-12-31"),
      usageLimit: 500,
      isActive: true,
    },
  });
  console.log("✅ Coupons initialized (KARIBU10, SOKO500)");

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
