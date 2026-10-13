import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // --- Admin ---
  await prisma.adminUser.upsert({
    where: { email: "admin@exemple.com" },
    update: {},
    create: { email: "admin@exemple.com", passwordHash: hash("admin123"), role: "admin" },
  });

  // --- Categories ---
  const boissons = await prisma.category.upsert({
    where: { slug: "boissons" },
    update: {},
    create: { nom: "Boissons", slug: "boissons", position: 1 },
  });
  const epicerie = await prisma.category.upsert({
    where: { slug: "epicerie" },
    update: {},
    create: { nom: "Épicerie", slug: "epicerie", position: 2 },
  });
  const hygiene = await prisma.category.upsert({
    where: { slug: "hygiene" },
    update: {},
    create: { nom: "Hygiène", slug: "hygiene", position: 3 },
  });

  // --- Produits (prix en centimes) ---
  const products = [
    { sku: "CAF-1KG", titre: "Café en grains 1kg", categoryId: boissons.id, prixBase: 1890, description: "Café arabica torréfié artisanalement." },
    { sku: "THE-250", titre: "Thé vert bio 250g", categoryId: boissons.id, prixBase: 950, description: "Thé vert bio en vrac." },
    { sku: "JUS-1L", titre: "Jus d'orange 1L", categoryId: boissons.id, prixBase: 320, description: "100% pur jus, sans sucre ajouté." },
    { sku: "HUI-75", titre: "Huile d'olive 75cl", categoryId: epicerie.id, prixBase: 1250, description: "Vierge extra, première pression à froid." },
    { sku: "PAT-500", titre: "Pâtes artisanales 500g", categoryId: epicerie.id, prixBase: 480, description: "Pâtes au blé dur." },
    { sku: "RIZ-5KG", titre: "Riz basmati 5kg", categoryId: epicerie.id, prixBase: 2200, description: "Riz long grain parfumé." },
    { sku: "MIE-500", titre: "Miel de fleurs 500g", categoryId: epicerie.id, prixBase: 890, description: "Miel toutes fleurs récolté en France." },
    { sku: "SAV-300", titre: "Savon de Marseille 300g", categoryId: hygiene.id, prixBase: 590, description: "72% d'huile végétale." },
    { sku: "SHA-SOL", titre: "Shampooing solide", categoryId: hygiene.id, prixBase: 780, description: "Sans sulfates, longue durée." },
    { sku: "DEN-MEN", titre: "Dentifrice menthe", categoryId: hygiene.id, prixBase: 410, description: "Au fluor, goût menthe fraîche." },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: { ...p, images: [], actif: true },
    });
  }

  // --- Clients ---
  const clientsData = [
    { email: "dupont@exemple.com", raisonSociale: "Épicerie Dupont", defaultDiscount: 0 },
    { email: "marche@exemple.com", raisonSociale: "Restaurant Le Marché", defaultDiscount: 10 },
    { email: "belvedere@exemple.com", raisonSociale: "Hôtel Belvédère", defaultDiscount: 0 },
    { email: "cafe@exemple.com", raisonSociale: "Café des Arts", defaultDiscount: 5 },
  ];
  for (const c of clientsData) {
    await prisma.client.upsert({
      where: { email: c.email },
      update: {},
      create: { ...c, passwordHash: hash("client123"), actif: true },
    });
  }

  // --- A few price / visibility exceptions ---
  const dupont = await prisma.client.findUnique({ where: { email: "dupont@exemple.com" } });
  const belvedere = await prisma.client.findUnique({ where: { email: "belvedere@exemple.com" } });
  const cafe1kg = await prisma.product.findUnique({ where: { sku: "CAF-1KG" } });
  const riz = await prisma.product.findUnique({ where: { sku: "RIZ-5KG" } });

  if (dupont && cafe1kg) {
    await prisma.clientProductPricing.upsert({
      where: { clientId_productId: { clientId: dupont.id, productId: cafe1kg.id } },
      update: { prix: 1690 },
      create: { clientId: dupont.id, productId: cafe1kg.id, prix: 1690, visible: true },
    });
  }
  if (belvedere && riz) {
    // Rice is hidden for Hôtel Belvédère
    await prisma.clientProductPricing.upsert({
      where: { clientId_productId: { clientId: belvedere.id, productId: riz.id } },
      update: { visible: false },
      create: { clientId: belvedere.id, productId: riz.id, prix: null, visible: false },
    });
  }

  // --- "About us" page content ---
  const siteContent = {
    titre: "Qui sommes-nous",
    intro: [
      "Maison Dupont approvisionne depuis 1994 les restaurants, hôtels et épiceries fines de la région. Nous sélectionnons nous-mêmes chaque référence, directement auprès des producteurs.",
      "Notre équipe de six personnes prépare et livre vos commandes en circuit court. Vous disposez de tarifs négociés, visibles dès votre connexion à ce catalogue.",
    ].join("\n\n"),
    adresse: "12 rue des Halles\n69002 Lyon",
    telephone: "04 72 00 00 00",
    email: "contact@exemple.com",
    horaires: "Lundi – vendredi : 8h – 18h\nSamedi : 9h – 12h",
    chiffres: [
      { valeur: "30 ans", libelle: "au service des professionnels" },
      { valeur: "500+", libelle: "références au catalogue" },
      { valeur: "48h", libelle: "de délai de livraison" },
    ],
  };
  await prisma.siteContent.upsert({
    where: { id: 1 },
    update: siteContent,
    create: { id: 1, ...siteContent },
  });

  console.log("Seed terminé.");
  console.log("Admin : admin@exemple.com / admin123");
  console.log("Client : dupont@exemple.com / client123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
