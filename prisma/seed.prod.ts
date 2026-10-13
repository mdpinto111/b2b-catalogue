import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Production seed: creates ONLY the admin account (no demo data).
// Credentials come from environment variables, never from the code.
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans l'environnement.");
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD doit faire au moins 8 caractères.");
  }

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash: bcrypt.hashSync(password, 10) },
    create: { email, passwordHash: bcrypt.hashSync(password, 10), role: "admin" },
  });

  console.log(`Compte admin prêt : ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
