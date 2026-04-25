import fs from "fs";
import path from "path";
import XLSX from "xlsx";

const datasetDir = path.join(process.cwd(), "data", "raw", "dataset");

if (!fs.existsSync(datasetDir)) {
  console.error("Dataset folder not found:", datasetDir);
  process.exit(1);
}

const files = fs
  .readdirSync(datasetDir)
  .filter((file) => file.startsWith("Rdir_"))
  .filter((file) => file.endsWith(".xls") || file.endsWith(".ods"));

console.log(`Found ${files.length} dataset files`);

for (const file of files) {
  const filePath = path.join(datasetDir, file);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  console.log("\n--------------------------------");
  console.log("File:", file);
  console.log("Sheet:", sheetName);
  console.log("First 5 rows:");
  console.log(rows.slice(0, 5));
}
