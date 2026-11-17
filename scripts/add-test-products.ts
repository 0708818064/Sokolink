import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🚀 Adding high-quality Kenyan testing products to SokoLink...");

  // 1. Fetch categories
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  // 2. Fetch approved SMEs
  const smes = await prisma.sMEProfile.findMany({
    where: { status: "APPROVED" },
  });
  if (smes.length === 0) {
    console.error("❌ No approved SMEs found. Please verify SMEs exist.");
    return;
  }

  const smeMap = new Map(smes.map((s) => [s.businessSlug, s.id]));
  const defaultSmeId = smes[0].id;

  const testProducts = [
    // Fashion & Apparel
    {
      name: "Hand-Tailored Kitenge Blazer (Navy & Ochre Pattern)",
      slug: "hand-tailored-kitenge-blazer-navy-ochre",
      description: "Expertly tailored modern slim-fit blazer crafted from 100% authentic African Kitenge wax print. Features silk-lined interior pockets and brass button accents. Handcrafted by master tailors in Nairobi.",
      sku: "SKU-KTG-BLZ-01",
      price: 4500.0,
      discountedPrice: 3900.0,
      stock: 18,
      condition: "HANDMADE",
      weight: 0.85,
      location: "Nairobi",
      categorySlug: "fashion-apparel",
      smeSlug: "maasai-artisans-collective",
      rating: 4.9,
      reviewCount: 24,
      imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Kenyan Flag Safari Kikoy Beach Towel & Wrap",
      slug: "kenyan-flag-safari-kikoy-wrap",
      description: "Authentic double-weave Coastal Kikoy fringed wrap lined with ultra-absorbent terry cotton. Perfect for beach getaways, safari game drives, or relaxed home lounging.",
      sku: "SKU-KKY-WRAP-02",
      price: 1600.0,
      discountedPrice: 1350.0,
      stock: 45,
      condition: "HANDMADE",
      weight: 0.45,
      location: "Mombasa",
      categorySlug: "fashion-apparel",
      smeSlug: "maasai-artisans-collective",
      rating: 4.8,
      reviewCount: 38,
      imageUrl: "https://images.unsplash.com/photo-1607344645866-009c320b5ab8?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Handmade Kenyan Leather Safari Boots (Unisex)",
      slug: "handmade-kenyan-leather-safari-boots",
      description: "Classic safari desert boots made from full-grain Kenyan cowhide leather with crepe rubber traction soles. Durable, breathable, and designed for all-day comfort.",
      sku: "SKU-LTH-BOOT-03",
      price: 5800.0,
      discountedPrice: 4950.0,
      stock: 22,
      condition: "HANDMADE",
      weight: 1.2,
      location: "Nairobi",
      categorySlug: "fashion-apparel",
      smeSlug: "maasai-artisans-collective",
      rating: 4.9,
      reviewCount: 19,
      imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    },

    // Electronics & Gadgets
    {
      name: "Oraimo FreePods 4 Active Noise Cancellation Wireless Earphones",
      slug: "oraimo-freepods-4-anc-wireless-earphones",
      description: "Premium wireless earbuds with 30dB Active Noise Cancellation, 35.5-hour total playtime, low-latency gaming mode, and IPX5 splash resistance. Official Kenya warranty included.",
      sku: "SKU-ELC-ORP-04",
      price: 3499.0,
      discountedPrice: 2999.0,
      stock: 35,
      condition: "NEW",
      weight: 0.15,
      location: "Nairobi CBD",
      categorySlug: "electronics-gadgets",
      smeSlug: "nairobi-electronics-hub",
      rating: 4.7,
      reviewCount: 56,
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Fast-Charge 65W GaN Multi-Port USB-C Laptop & Phone Wall Charger",
      slug: "fast-charge-65w-gan-multi-port-charger",
      description: "Ultra-compact GaN III 65W fast charger with 2x Type-C Power Delivery ports and 1x USB-A Quick Charge 3.0 port. Charges MacBook, Dell, iPhone, Samsung, and Android tablets at peak speed.",
      sku: "SKU-ELC-GAN-05",
      price: 2850.0,
      discountedPrice: 2450.0,
      stock: 50,
      condition: "NEW",
      weight: 0.18,
      location: "Nairobi CBD",
      categorySlug: "electronics-gadgets",
      smeSlug: "nairobi-electronics-hub",
      rating: 4.8,
      reviewCount: 31,
      imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Smart Fitness Tracker Band with Heart Rate & Blood Oxygen Monitor",
      slug: "smart-fitness-band-heart-rate-monitor",
      description: "Sleek 1.47-inch AMOLED color touch display, 14-day battery life, 5ATM water resistance, continuous SpO2 and heart-rate monitoring, plus WhatsApp/SMS incoming call notifications.",
      sku: "SKU-ELC-FIT-06",
      price: 2200.0,
      discountedPrice: 1850.0,
      stock: 28,
      condition: "NEW",
      weight: 0.08,
      location: "Nairobi CBD",
      categorySlug: "electronics-gadgets",
      smeSlug: "nairobi-electronics-hub",
      rating: 4.6,
      reviewCount: 22,
      imageUrl: "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?auto=format&fit=crop&w=800&q=80",
    },

    // Fresh Groceries & Produce
    {
      name: "Organic Nyeri Mountain Single-Origin Arabica Coffee Beans (500g)",
      slug: "organic-nyeri-mountain-arabica-coffee-500g",
      description: "Grade AA hand-picked coffee beans from the volcanic slopes of Mt. Kenya in Nyeri County. Medium-dark roast offering vibrant blackcurrant, citrus, and caramel tasting notes.",
      sku: "SKU-GRC-NYR-07",
      price: 1350.0,
      discountedPrice: 1150.0,
      stock: 45,
      condition: "NEW",
      weight: 0.5,
      location: "Nyeri / Nairobi Hub",
      categorySlug: "fresh-groceries-produce",
      smeSlug: "kilimo-fresh-farm-produce",
      rating: 4.9,
      reviewCount: 47,
      imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Fresh Mombasa Coast Sweet Apple Mangoes (Carton of 12 Juicy Mangoes)",
      slug: "fresh-mombasa-sweet-apple-mangoes-carton",
      description: "Farm-ripe, sweet Apple Mangoes harvested directly from Coastal orchards in Kilifi and Malindi. Fiberless, aromatic, and rich in natural vitamins.",
      sku: "SKU-GRC-MNG-08",
      price: 950.0,
      discountedPrice: 850.0,
      stock: 60,
      condition: "NEW",
      weight: 3.5,
      location: "Mombasa / Nairobi Dispatch",
      categorySlug: "fresh-groceries-produce",
      smeSlug: "kilimo-fresh-farm-produce",
      rating: 4.9,
      reviewCount: 63,
      imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Export-Grade Murang'a Macadamia Nuts (Dry Roasted & Lightly Salted 250g)",
      slug: "export-grade-muranga-macadamia-nuts-250g",
      description: "Crunchy, buttery, jumbo whole-kernel macadamia nuts dry-roasted in small batches with Lake Elementaita natural mineral salt. Packed in an airtight resealable pouch.",
      sku: "SKU-GRC-MCD-09",
      price: 850.0,
      discountedPrice: 750.0,
      stock: 55,
      condition: "NEW",
      weight: 0.25,
      location: "Murang'a",
      categorySlug: "fresh-groceries-produce",
      smeSlug: "savannah-natural-honey",
      rating: 4.8,
      reviewCount: 35,
      imageUrl: "https://images.unsplash.com/photo-1543208541-0961a29a7516?auto=format&fit=crop&w=800&q=80",
    },

    // Home & Kitchenware
    {
      name: "Cast Aluminum Double Chapati Tawa Pan with Heat-Resistant Handle",
      slug: "cast-aluminum-double-chapati-tawa-pan",
      description: "Heavy-duty 4mm thick cast aluminum flat tawa engineered for perfectly golden, evenly flaked Kenyan chapatis, rotis, and pancakes. Non-stick seasoned surface with stay-cool Bakelite handle.",
      sku: "SKU-KTC-TWA-10",
      price: 2450.0,
      discountedPrice: 2100.0,
      stock: 30,
      condition: "NEW",
      weight: 1.4,
      location: "Nairobi",
      categorySlug: "home-kitchenware",
      smeSlug: "nairobi-electronics-hub",
      rating: 4.8,
      reviewCount: 29,
      imageUrl: "https://images.unsplash.com/photo-1584990347449-3990b7987829?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Handmade Kisii Soapstone Carved Coaster Set (Pack of 6)",
      slug: "handmade-kisii-soapstone-coaster-set",
      description: "Polished natural Kisii soapstone coasters engraved with traditional wildlife and geometric motifs. Padded velvet base protects fine dining tables from heat and moisture.",
      sku: "SKU-KTC-CST-11",
      price: 1800.0,
      discountedPrice: 1500.0,
      stock: 24,
      condition: "HANDMADE",
      weight: 0.9,
      location: "Kisii / Nairobi",
      categorySlug: "home-kitchenware",
      smeSlug: "maasai-artisans-collective",
      rating: 4.9,
      reviewCount: 16,
      imageUrl: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80",
    },

    // Beauty & Personal Care
    {
      name: "Raw Whipped Nilotica Shea Butter with Lemongrass Oil (250ml)",
      slug: "raw-whipped-shea-nilotica-butter-lemongrass",
      description: "Ultra-rich, creamy unrefined East African Nilotica Shea Butter infused with organic Kenyan lemongrass essential oil. Deeply moisturizes dry skin, eczematic patches, and curls.",
      sku: "SKU-BTY-SHEA-12",
      price: 1150.0,
      discountedPrice: 950.0,
      stock: 40,
      condition: "HANDMADE",
      weight: 0.3,
      location: "Nairobi",
      categorySlug: "beauty-personal-care",
      smeSlug: "savannah-natural-honey",
      rating: 4.9,
      reviewCount: 42,
      imageUrl: "https://images.unsplash.com/photo-1608248597359-4676106e2329?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Organic Cold-Pressed Kenyan Avocado & Tea Tree Hair & Scalp Oil (100ml)",
      slug: "organic-cold-pressed-avocado-tea-tree-hair-oil",
      description: "Formulated with pure Murang'a avocado oil and Nanyuki organic tea tree extracts. Stimulates rapid hair growth, banishes dandruff, and seals in moisture for natural locs and afro hair.",
      sku: "SKU-BTY-AVO-13",
      price: 850.0,
      discountedPrice: 720.0,
      stock: 50,
      condition: "NEW",
      weight: 0.15,
      location: "Nairobi",
      categorySlug: "beauty-personal-care",
      smeSlug: "savannah-natural-honey",
      rating: 4.7,
      reviewCount: 33,
      imageUrl: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80",
    },
  ];

  let addedCount = 0;
  for (const item of testProducts) {
    const categoryId = categoryMap.get(item.categorySlug) || categories[0]?.id;
    const smeId = smeMap.get(item.smeSlug) || defaultSmeId;

    if (!categoryId) {
      console.warn(`⚠️ Skipped ${item.name}: Category '${item.categorySlug}' not found.`);
      continue;
    }

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        price: item.price,
        discountedPrice: item.discountedPrice,
        stock: item.stock,
        rating: item.rating,
        reviewCount: item.reviewCount,
        isApproved: true,
        isActive: true,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        sku: item.sku,
        price: item.price,
        discountedPrice: item.discountedPrice,
        stock: item.stock,
        condition: item.condition,
        weight: item.weight,
        location: item.location,
        categoryId,
        smeId,
        rating: item.rating,
        reviewCount: item.reviewCount,
        isApproved: true,
        isActive: true,
      },
    });

    // Ensure product image exists
    const existingImg = await prisma.productImage.findFirst({
      where: { productId: product.id },
    });

    if (!existingImg) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: item.imageUrl,
          altText: item.name,
          isPrimary: true,
          displayOrder: 0,
        },
      });
    }

    addedCount++;
    console.log(`  ✅ Added/Updated: [${item.sku}] ${item.name} (KES ${item.price})`);
  }

  console.log(`\n🎉 Successfully processed ${addedCount} testing products!`);
}

main()
  .catch((e) => {
    console.error("❌ Error adding test products:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
