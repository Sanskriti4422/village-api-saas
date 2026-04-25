import { prisma } from "../lib/db";
import { generateApiKey, hashApiKey } from "../lib/api-auth";

async function main() {
  const email = "demo-client@example.com";
  const rawApiKey = generateApiKey();
  const keyPrefix = rawApiKey.slice(0, 15);

  const user = await prisma.user.upsert({
    where: {
      email,
    },
    update: {},
    create: {
      name: "Demo Client",
      email,
      plan: "FREE",
      role: "CLIENT",
    },
  });

  await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: "Demo API Key",
      keyPrefix,
      keyHash: hashApiKey(rawApiKey),
    },
  });

  console.log("\nDemo API key created. Copy this now:");
  console.log(rawApiKey);
  console.log("\nUse it like this:");
  console.log(
    `http://localhost:3000/api/v1/autocomplete?q=ram&limit=5&api_key=${rawApiKey}`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
