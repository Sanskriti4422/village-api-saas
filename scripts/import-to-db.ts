import fs from "fs";
import path from "path";
import crypto from "crypto";
import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const datasetDir = path.join(process.cwd(), "data", "raw", "dataset");

type VillageInsert = {
  id: string;
  code: string | null;
  name: string;
  slug: string;
  displayName: string;
  searchText: string;
  subDistrictId: string;
  createdAt: Date;
  updatedAt: Date;
};

function clean(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function slugify(value: string) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCase(value: string) {
  return clean(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStateFromFileName(file: string) {
  return file
    .replace(/^Rdir_2011_\d+_/, "")
    .replace(/\.(xls|ods)$/i, "")
    .replace(/_and_/g, " and ")
    .replace(/_/g, " ")
    .trim();
}

async function insertVillageBatch(villages: VillageInsert[]) {
  if (villages.length === 0) {
    return;
  }

  const columns = [
    "id",
    "code",
    "name",
    "slug",
    "displayName",
    "searchText",
    "subDistrictId",
    "createdAt",
    "updatedAt",
  ];

  const placeholders = villages
    .map(() => `(${columns.map(() => "?").join(", ")})`)
    .join(", ");

  const values = villages.flatMap((village) => [
    village.id,
    village.code,
    village.name,
    village.slug,
    village.displayName,
    village.searchText,
    village.subDistrictId,
    village.createdAt,
    village.updatedAt,
  ]);

  await prisma.$executeRawUnsafe(
    `INSERT OR IGNORE INTO "Village" (${columns
      .map((column) => `"${column}"`)
      .join(", ")}) VALUES ${placeholders}`,
    ...values
  );
}

async function main() {
  if (!fs.existsSync(datasetDir)) {
    throw new Error(`Dataset folder not found: ${datasetDir}`);
  }

  const files = fs
    .readdirSync(datasetDir)
    .filter((file) => file.startsWith("Rdir_"))
    .filter((file) => file.endsWith(".xls") || file.endsWith(".ods"));

  console.log(`Found ${files.length} files`);

  for (const file of files) {
    const stateName = titleCase(getStateFromFileName(file));
    const stateSlug = slugify(stateName);

    console.log(`\nImporting ${stateName}...`);

    const state = await prisma.state.upsert({
      where: { slug: stateSlug },
      update: { name: stateName },
      create: {
        name: stateName,
        slug: stateSlug,
      },
    });

    const existingDistricts = await prisma.district.findMany({
      where: { stateId: state.id },
      select: { id: true, slug: true },
    });

    const districtCache = new Map(
      existingDistricts.map((district) => [district.slug, district.id])
    );
    const subDistrictCache = new Map<string, string>();

    const filePath = path.join(datasetDir, file);
    const workbook = XLSX.readFile(filePath);
    const sheetsWithRows = workbook.SheetNames.map((sheetName) => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
        defval: "",
      }) as unknown[][];

      return { sheetName, rows };
    });

    const largestSheet = sheetsWithRows.sort(
      (a, b) => b.rows.length - a.rows.length
    )[0];

    const rows = largestSheet.rows;
    console.log(`Using sheet "${largestSheet.sheetName}" with ${rows.length} rows`);

    let queuedVillages = 0;
    let batch: VillageInsert[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (i % 1000 === 0) {
        console.log(`${stateName}: checked ${i}/${rows.length}, queued ${queuedVillages}`);
      }

      const districtName = titleCase(clean(row[3]));
      const subDistrictName = titleCase(clean(row[5]));
      const villageName = titleCase(clean(row[7]));
      const villageCode = clean(row[8]) || clean(row[6]);

      if (!districtName || !subDistrictName || !villageName) {
        continue;
      }

      if (
        districtName.toLowerCase().includes("district") &&
        villageName.toLowerCase().includes("village")
      ) {
        continue;
      }

      const districtSlug = slugify(districtName);
      const subDistrictSlug = slugify(subDistrictName);
      const villageSlug = slugify(villageName);

      if (!districtSlug || !subDistrictSlug || !villageSlug) {
        continue;
      }

      let districtId = districtCache.get(districtSlug);

      if (!districtId) {
        const district = await prisma.district.upsert({
          where: {
            stateId_slug: {
              stateId: state.id,
              slug: districtSlug,
            },
          },
          update: { name: districtName },
          create: {
            name: districtName,
            slug: districtSlug,
            stateId: state.id,
          },
        });

        districtId = district.id;
        districtCache.set(districtSlug, districtId);
      }

      const subDistrictKey = `${districtId}:${subDistrictSlug}`;
      let subDistrictId = subDistrictCache.get(subDistrictKey);

      if (!subDistrictId) {
        const subDistrict = await prisma.subDistrict.upsert({
          where: {
            districtId_slug: {
              districtId,
              slug: subDistrictSlug,
            },
          },
          update: { name: subDistrictName },
          create: {
            name: subDistrictName,
            slug: subDistrictSlug,
            districtId,
          },
        });

        subDistrictId = subDistrict.id;
        subDistrictCache.set(subDistrictKey, subDistrictId);
      }

      const now = new Date();
      const displayName = `${villageName}, ${subDistrictName}, ${districtName}, ${stateName}, India`;

      batch.push({
        id: crypto.randomUUID(),
        code: villageCode || null,
        name: villageName,
        slug: villageSlug,
        displayName,
        searchText: displayName.toLowerCase(),
        subDistrictId,
        createdAt: now,
        updatedAt: now,
      });

      queuedVillages++;

      if (batch.length >= 500) {
        await insertVillageBatch(batch);
        batch = [];
      }
    }

    await insertVillageBatch(batch);
    console.log(`Finished ${stateName}. Queued villages: ${queuedVillages}`);
  }
}

main()
  .then(async () => {
    const [states, districts, subDistricts, villages] = await Promise.all([
      prisma.state.count(),
      prisma.district.count(),
      prisma.subDistrict.count(),
      prisma.village.count(),
    ]);

    console.log("\nImport completed");
    console.log({ states, districts, subDistricts, villages });

    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
