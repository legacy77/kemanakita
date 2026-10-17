import { mkdir, cp, stat, writeFile, readdir, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createClient } from "@supabase/supabase-js";

// Baca secret dari environment; jangan simpan atau cetak secret.
const outputDir = process.env.BACKUP_DIR || join(tmpdir(), "opencode", "kemanakita-backup");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const bundleDir = join(outputDir, `kemanakita-${timestamp}`);
const dataPath = join(bundleDir, "data.json");
const schemaDir = join(bundleDir, "schema");
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const projectRef = process.env.SUPABASE_PROJECT_REF;
const migrationsDir = join(process.cwd(), "supabase", "migrations");
const pageSize = 1000;

// Muat .env.local hanya agar npm run backup:db bekerja tanpa shell loader; nilai tidak pernah dicetak.
const envPath = join(process.cwd(), ".env.local");
try {
  for (const line of (await readFile(envPath, "utf8")).split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^\"|\"$/g, "");
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const resolvedServiceKey = process.env.SUPABASE_SERVICE_KEY;
const resolvedSupabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const tables = [
  ["profiles", ["id", "name", "created_at"]],
  ["trips", ["id", "title", "destination", "start_date", "end_date", "invite_code", "created_by", "created_at"]],
  ["trip_members", ["trip_id", "user_id", "role", "joined_at"]],
  ["itinerary_items", ["id", "trip_id", "date", "time", "title", "notes", "location", "sort_order", "category", "created_at"]],
  ["expenses", ["id", "trip_id", "title", "amount", "paid_by", "date", "category", "kind", "created_at"]],
  ["expense_splits", ["expense_id", "user_id", "share_amount"]],
];

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { env: process.env, stdio: ["ignore", "ignore", "pipe"] });
  let errorText = "";
  child.stderr.on("data", (chunk) => { errorText += chunk.toString(); });
  child.on("error", reject);
  child.on("close", (code) => resolve({ code, errorText: errorText.trim() }));
});

const executable = async (command) => {
  try {
    const result = await run(process.platform === "win32" ? "where.exe" : "which", [command]);
    return result.code === 0;
  } catch {
    return false;
  }
};

const reportError = (message) => {
  console.error(`GAGAL: ${message}`);
  process.exit(1);
};

await mkdir(outputDir, { recursive: true });

if (resolvedServiceKey && resolvedSupabaseUrl) {
  const serviceKey = resolvedServiceKey;
  const supabaseUrl = resolvedSupabaseUrl;
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const exported = { format: 1, generated_at: new Date().toISOString(), tables: {} };
  const counts = {};

  for (const [table, columns] of tables) {
    const rows = [];
    let from = 0;
    let expected = null;
    while (true) {
      const { data, error, count } = await supabase.from(table).select("*", { count: "exact" }).range(from, from + pageSize - 1);
      if (error) reportError(`gagal membaca ${table}: ${error.message}`);
      if (!Array.isArray(data)) reportError(`respons ${table} bukan row set.`);
      if (expected === null) expected = count;
      if (count !== null && count !== undefined && count !== expected) reportError(`count ${table} berubah saat export.`);
      rows.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
      if (expected !== null && rows.length >= expected) break;
    }
    if (expected !== null && rows.length !== expected) reportError(`backup ${table} terpotong: ${rows.length}/${expected} row.`);
    if (rows.length > pageSize && rows.length % pageSize === 0) reportError(`backup ${table} mungkin terpotong pada batas API ${pageSize} row.`);
    exported.tables[table] = { columns, rows };
    counts[table] = rows.length;
  }

  await mkdir(schemaDir, { recursive: true });
  const migrationFiles = await readdir(migrationsDir);
  const sqlFiles = migrationFiles.filter((name) => name.endsWith(".sql")).sort();
  if (sqlFiles.length === 0) reportError("migration schema tidak ditemukan.");
  for (const file of sqlFiles) await cp(join(migrationsDir, file), join(schemaDir, file));
  await writeFile(dataPath, `${JSON.stringify(exported, null, 2)}\n`, { mode: 0o600 });
  const dataSize = (await stat(dataPath)).size;
  const schemaSize = (await Promise.all(sqlFiles.map(async (file) => (await stat(join(schemaDir, file))).size))).reduce((a, b) => a + b, 0);
  console.log(`BERHASIL: path data ${dataPath} (${dataSize} byte).`);
  console.log(`BERHASIL: schema ${schemaDir} (${sqlFiles.length} file, ${schemaSize} byte).`);
  for (const [table, count] of Object.entries(counts)) console.log(`ROW ${table}: ${count}`);
  // Sanity check terhadap data live yang didokumentasikan (3 user, 1 trip "Malay").
  // Bila data live sudah berubah (mis. agent E2E membuat user/trip), backup TETAP dianggap
  // berhasil — yang dilaporkan hanya peringatan, dan exit 0 karena export-nya lengkap.
  const malayTrip = exported.tables.trips.rows.find((row) => row.title === "Malay");
  const sanityOk = counts.profiles === 3 && counts.trips === 1 && Boolean(malayTrip);
  if (sanityOk) {
    console.log("SANITY: cocok dengan ekspektasi (3 profiles, 1 trip, title Malay).");
  } else {
    console.warn(
      `PERINGATAN: data live berbeda dari ekspektasi dokumen (profiles=${counts.profiles}, trips=${counts.trips}, ` +
        `trip "Malay"=${malayTrip ? "ada" : "TIDAK ada"}). Backup tetap lengkap sesuai isi database saat ini.`,
    );
  }
  process.exit(0);
}

// Fallback opsional bila pg_dump atau Supabase CLI tersedia.
const sqlPath = join(outputDir, `kemanakita-${timestamp}.sql`);
let result;
if (await executable("supabase") && projectRef) {
  result = await run("supabase", ["db", "dump", "--project-ref", projectRef, "-f", sqlPath]);
} else if (await executable("pg_dump") && connectionString) {
  result = await run("pg_dump", ["--format=plain", "--file", sqlPath, "--no-owner", "--no-privileges", connectionString]);
} else {
  reportError("SUPABASE_SERVICE_KEY dan URL belum diatur; fallback pg_dump/Supabase CLI juga tidak tersedia.");
}
if (result.code !== 0) reportError(`fallback gagal (exit ${result.code}).`);
const sqlSize = (await stat(sqlPath)).size;
if (sqlSize === 0) reportError("file fallback kosong.");
console.log(`BERHASIL: fallback ${sqlPath} (${sqlSize} byte).`);
