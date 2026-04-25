import fs from "fs";
import path from "path";
import XLSX from "xlsx";

const datasetDir = path.join(process.cwd(), "data", "raw", "dataset");

function clean(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function getStateFromFileName(file: string) {
  return file
    .replace(/^Rdir_2011_\d+_/, "")
    .replace(/\.(xls|ods)$/i, "")
    .replace(/_and_/g, " and ")
    .replace(/_/g, " ")
    .trim();
}

const files = fs
  .readdirSync(datasetDir)
  .filter((file) => file.startsWith("Rdir_"))
  .filter((file) => file.endsWith(".xls") || file.endsWith(".ods"));

let totalRows = 0;

for (const file of files) {
  const stateName = getStateFromFileName(file);
  const filePath = path.join(datasetDir, file);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  console.log("\n==============================");
  console.log("State:", stateName);
  console.log("File:", file);
  console.log("Rows:", rows.length);

  for (const row of rows.slice(0, 10)) {
    console.log(row.map(clean));
  }

  totalRows += rows.length;
}

console.log("\nTotal raw rows:", totalRows);
