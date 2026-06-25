import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function img(seed: string) {
  return `https://placehold.co/600x600/1F3A2E/F2EDE1?text=${encodeURIComponent(seed)}&font=raleway`;
}

const categoryNames = [
  "Plants", "Seeds", "Tools", "Pots & Planters",
  "Soil & Fertilizer", "Outdoor Decor", "Watering & Irrigation",
];

const products = [
  { slug: "monstera-deliciosa", name: "Monstera Deliciosa", price: 34.99, category: "Plants", description: "A statement houseplant with dramatic split leaves. Easygoing, fast-growing, and forgiving of the occasional missed watering.", details: ["6-inch nursery pot", "Bright, indirect light", "Pet-safe: no"], stock: 14, badge: "Popular", sku: "PLT-001" },
  { slug: "snake-plant", name: "Snake Plant", price: 24.99, category: "Plants", description: "Architectural, upright leaves that tolerate low light and irregular watering. About as close to unkillable as houseplants get.", details: ["4-inch nursery pot", "Low to bright light", "Pet-safe: no"], stock: 21, badge: null, sku: "PLT-002" },
  { slug: "heirloom-tomato-seeds", name: "Heirloom Tomato Seeds", price: 4.99, category: "Seeds", description: "A hand-picked mix of three heirloom varieties — Brandywine, Cherokee Purple, and Green Zebra. Open-pollinated, non-GMO.", details: ["~30 seeds per packet", "Start indoors 6 weeks before last frost", "Days to maturity: 75–85"], stock: 60, badge: "Popular", sku: "SED-001" },
  { slug: "basil-seed-starter-kit", name: "Basil Seed Starter Kit", price: 12.99, category: "Seeds", description: "Everything you need to start Genovese basil from seed: biodegradable pots, seed-starting mix, and a humidity dome.", details: ["6-cell tray", "Includes seed-starting mix", "Days to germination: 5–10"], stock: 32, badge: null, sku: "SED-002" },
  { slug: "stainless-hand-trowel", name: "Stainless Steel Hand Trowel", price: 14.99, category: "Tools", description: "A rust-resistant trowel with a contoured beech handle. Etched depth markings make bulb planting a one-step job.", details: ["Forged stainless steel head", "Beech wood handle", "Length: 12 in"], stock: 40, badge: null, sku: "TLS-001" },
  { slug: "bypass-pruning-shears", name: "Bypass Pruning Shears", price: 19.99, category: "Tools", description: "Sharp, clean cuts for live stems up to half an inch thick. A locking safety catch keeps the blade closed in storage.", details: ["Hardened carbon-steel blade", "Cushioned non-slip grip", "Cutting capacity: 0.5 in"], stock: 27, badge: "Popular", sku: "TLS-002" },
  { slug: "terracotta-pot-trio", name: "Terracotta Pot Trio (6 in)", price: 22.99, category: "Pots & Planters", description: "Three classic unglazed terracotta pots with saucers, in graduated sizes. Porous clay helps roots breathe.", details: ["Sizes: 4 in, 5 in, 6 in", "Includes matching saucers", "Drainage hole in each pot"], stock: 18, badge: null, sku: "POT-001" },
  { slug: "self-watering-ceramic-planter", name: "Self-Watering Ceramic Planter", price: 38.00, category: "Pots & Planters", description: "A glazed stoneware planter with a built-in water reservoir, so your plants can go up to two weeks between waterings.", details: ["Diameter: 8 in", "Reservoir capacity: 500 ml", "Water-level indicator window"], stock: 9, badge: "New", sku: "POT-002" },
  { slug: "organic-potting-soil", name: "Organic All-Purpose Potting Soil", price: 16.50, category: "Soil & Fertilizer", description: "A peat-free blend of compost, coir, and perlite for healthy drainage and steady moisture retention. OMRI-listed organic.", details: ["20 L bag", "Peat-free, OMRI-listed", "Suitable for containers and raised beds"], stock: 50, badge: null, sku: "SFL-001" },
  { slug: "slow-release-fertilizer", name: "Slow-Release Granular Fertilizer", price: 11.25, category: "Soil & Fertilizer", description: "A balanced 10-10-10 formula that feeds steadily for up to three months. One application covers most container gardens.", details: ["1.5 kg resealable bag", "NPK 10-10-10", "Feeds for up to 90 days"], stock: 35, badge: null, sku: "SFL-002" },
  { slug: "solar-garden-path-lights", name: "Solar Garden Path Lights (Set of 4)", price: 29.99, category: "Outdoor Decor", description: "Warm-white LED stake lights that charge by day and switch on automatically at dusk. No wiring required.", details: ["Set of 4", "Up to 8 hours of runtime", "Weatherproof to IP65"], stock: 24, badge: null, sku: "DCR-001" },
  { slug: "plant-stake-markers", name: "Hand-Forged Plant Markers (Set of 10)", price: 9.99, category: "Outdoor Decor", description: "Copper-finished steel markers that weather gracefully over a season. Write on them with the included grease pencil.", details: ["Set of 10", "Includes grease pencil", "Height: 6 in"], stock: 45, badge: "Sale", sku: "DCR-002" },
  { slug: "brass-watering-can", name: "Brass Watering Can", price: 27.50, category: "Watering & Irrigation", description: "A 1.5-liter watering can with a long, narrow spout for precise pours around delicate seedlings.", details: ["Capacity: 1.5 L", "Solid brass spout", "Removable rose head"], stock: 16, badge: null, sku: "WTR-001" },
  { slug: "soaker-hose-25ft", name: "Soaker Hose (25 ft)", price: 18.99, category: "Watering & Irrigation", description: "Porous hose that delivers water directly to the root zone, cutting evaporation versus an overhead sprinkler.", details: ["Length: 25 ft", "Made from recycled rubber", "Connects to any standard spigot"], stock: 22, badge: null, sku: "WTR-002" },
];

async function main() {
  console.log("Seeding categories…");
  const categoryIdByName = new Map<string, string>();
  for (const name of categoryNames) {
    const slug = slugify(name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    categoryIdByName.set(name, category.id);
  }

  console.log("Seeding products…");
  for (const product of products) {
    const categoryId = categoryIdByName.get(product.category);
    if (!categoryId) throw new Error(`Unknown category: ${product.category}`);

    const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
    if (existing) {
      await prisma.product.update({
        where: { slug: product.slug },
        data: {
          name: product.name, price: product.price, description: product.description,
          details: product.details, stock: product.stock, badge: product.badge,
          sku: product.sku, status: "PUBLISHED", categoryId,
        },
      });
      // Only seed images if none exist yet
      const imgCount = await prisma.productImage.count({ where: { productId: existing.id } });
      if (imgCount === 0) {
        await prisma.productImage.create({
          data: { productId: existing.id, url: img(product.name), sortOrder: 0, isFeatured: true },
        });
      }
    } else {
      const created = await prisma.product.create({
        data: {
          slug: product.slug, name: product.name, price: product.price,
          description: product.description, details: product.details,
          stock: product.stock, badge: product.badge, sku: product.sku,
          status: "PUBLISHED", categoryId,
        },
      });
      await prisma.productImage.create({
        data: { productId: created.id, url: img(product.name), sortOrder: 0, isFeatured: true },
      });
    }
  }

  console.log(`Done — ${categoryNames.length} categories, ${products.length} products.`);

  console.log("Seeding hero slides…");
  const defaultSlides = [
    {
      title: "Grow something worth tending.",
      subtitle: "Plants, seeds, and tools for gardens that reward patience — picked by people who actually get their hands dirty.",
      ctaLabel: "Shop the collection",
      ctaUrl: "/products",
      imageUrl: null,
      bgColor: "#1F3A2E",
      sortOrder: 0,
      isActive: true,
    },
    {
      title: "Tools that last a lifetime.",
      subtitle: "Hand-forged, rust-resistant, and built for the long haul. No plastic handles.",
      ctaLabel: "Browse tools",
      ctaUrl: "/products?category=Tools",
      imageUrl: null,
      bgColor: "#3B2A1F",
      sortOrder: 1,
      isActive: true,
    },
    {
      title: "Grow from seed.",
      subtitle: "Heirloom varieties, open-pollinated and non-GMO. Everything you need to start from scratch.",
      ctaLabel: "Shop seeds",
      ctaUrl: "/products?category=Seeds",
      imageUrl: null,
      bgColor: "#2D4A3E",
      sortOrder: 2,
      isActive: true,
    },
  ];

  // Only seed slides if none exist — don't overwrite admin changes
  const existingSlides = await prisma.heroSlide.count();
  if (existingSlides === 0) {
    await prisma.heroSlide.createMany({ data: defaultSlides });
    console.log(`Created ${defaultSlides.length} default hero slides.`);
  } else {
    console.log(`Skipped hero slides (${existingSlides} already exist).`);
  }
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
