import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

// Baca secret dari environment/.env.local; jangan simpan atau cetak secret.
for (const line of (await readFile(".env.local", "utf8")).split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^"|"$/g, "");
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error("GAGAL: SUPABASE URL atau SUPABASE_SERVICE_KEY tidak tersedia.");
  process.exit(1);
}

const protectedProfileIds = new Set([
  "8ffdb159-71f6-41b1-bd10-60b62930bcf1",
  "67fd72f6-8ea6-4800-8dda-c1984e7735c8",
  "97677143-7c26-4910-be7f-a10e06d6e258",
  "9ec5306d-a1cb-41a0-a6dd-3ffad29da8eb",
]);
const protectedTripIds = new Set([
  "889df989-374c-4a6f-bfd4-f56498d358d9",
  "104efbae-d1ac-4f68-8c43-61b94668db67",
]);
const tableNames = ["profiles", "trips", "trip_members", "itinerary_items", "expenses", "expense_splits"];
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const fail = (message) => {
  throw new Error(message);
};

const readTable = async (table) => {
  const { data, error, count } = await client.from(table).select("*", { count: "exact" });
  if (error) fail(`gagal membaca ${table}: ${error.message}`);
  if (!Array.isArray(data) || count !== data.length) fail(`hasil ${table} tidak lengkap: ${data.length}/${count ?? "unknown"}.`);
  return data;
};

const deleteOne = async (table, row, predicate, filters) => {
  const { data: freshRows, error: readError } = await client.from(table).select("*").match(filters);
  if (readError) fail(`gagal re-query ${table}: ${readError.message}`);
  if (freshRows.length !== 1 || !predicate(freshRows[0])) fail(`guard menolak ${table}: row live tepat sebelum delete tidak cocok predicate.`);
  const { data, error, count } = await client.from(table).delete({ count: "exact" }).match(filters).select();
  if (error) fail(`gagal menghapus ${table}: ${error.message}`);
  if (count !== 1 || data?.length !== 1) fail(`guard menolak ${table}: delete count bukan 1.`);
};

try {
  const before = {};
  const rows = {};
  for (const table of tableNames) {
    rows[table] = await readTable(table);
    before[table] = rows[table].length;
  }
  const { data: authData, error: authError } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authError) fail(`gagal membaca auth users: ${authError.message}`);
  const authUsers = authData.users;
  const beforeAuth = authUsers.length;

  const profiles = rows.profiles;
  const trips = rows.trips;
  const members = rows.trip_members;
  const e2eProfiles = profiles.filter((row) => row.name.startsWith("E2E-"));
  const e2eTrips = trips.filter((row) => row.title.startsWith("E2E Trip"));
  const e2eAuth = authUsers.filter((row) => (row.email || "").startsWith("e2e-"));
  for (const row of [...e2eProfiles, ...e2eTrips]) {
    if (protectedProfileIds.has(row.id) || protectedTripIds.has(row.id)) fail(`guard menolak candidate protected ID ${row.id}.`);
  }
  for (const row of profiles.filter((row) => protectedProfileIds.has(row.id))) {
    if (row.name.startsWith("E2E-")) fail(`guard menolak protected profile ${row.id}.`);
  }
  for (const row of trips.filter((row) => protectedTripIds.has(row.id))) {
    if (row.title.startsWith("E2E Trip")) fail(`guard menolak protected trip ${row.id}.`);
  }

  const e2eProfileIds = new Set(e2eProfiles.map((row) => row.id));
  const e2eTripIds = new Set(e2eTrips.map((row) => row.id));
  const e2eAuthIds = new Set(e2eAuth.map((row) => row.id));
  if (e2eProfiles.some((row) => !e2eAuthIds.has(row.id))) fail("guard menolak: E2E profile tanpa Auth user e2e-.");
  if (e2eAuth.some((row) => !e2eProfileIds.has(row.id))) fail("guard menolak: Auth user e2e- tanpa E2E profile.");

  const candidateMembers = members.filter((row) => e2eTripIds.has(row.trip_id));
  for (const row of candidateMembers) {
    if (!e2eTripIds.has(row.trip_id) || !e2eProfileIds.has(row.user_id)) fail(`guard menolak membership ambiguous: ${row.trip_id}/${row.user_id}.`);
  }
  const candidateItinerary = rows.itinerary_items.filter((row) => e2eTripIds.has(row.trip_id));
  const candidateExpenses = rows.expenses.filter((row) => e2eTripIds.has(row.trip_id));
  const candidateExpenseIds = new Set(candidateExpenses.map((row) => row.id));
  const candidateSplits = rows.expense_splits.filter((row) => candidateExpenseIds.has(row.expense_id));
  for (const row of candidateItinerary) if (!e2eTripIds.has(row.trip_id)) fail(`guard menolak itinerary ${row.id}.`);
  for (const row of candidateExpenses) if (!e2eTripIds.has(row.trip_id)) fail(`guard menolak expense ${row.id}.`);
  for (const row of candidateSplits) if (!candidateExpenseIds.has(row.expense_id) || !e2eProfileIds.has(row.user_id)) fail(`guard menolak split ${row.expense_id}/${row.user_id}.`);
  for (const row of e2eTrips) if (!e2eProfileIds.has(row.created_by)) fail(`guard menolak trip owner ambiguous: ${row.id}.`);

  console.log(`CANDIDATES profiles=${e2eProfiles.length} auth=${e2eAuth.length} trips=${e2eTrips.length} members=${candidateMembers.length} itinerary=${candidateItinerary.length} expenses=${candidateExpenses.length} splits=${candidateSplits.length}`);

  for (const row of candidateSplits) await deleteOne("expense_splits", row, (x) => candidateExpenseIds.has(x.expense_id) && e2eProfileIds.has(x.user_id), { expense_id: row.expense_id, user_id: row.user_id });
  for (const row of candidateExpenses) await deleteOne("expenses", row, (x) => e2eTripIds.has(x.trip_id), { id: row.id, trip_id: row.trip_id });
  for (const row of candidateItinerary) await deleteOne("itinerary_items", row, (x) => e2eTripIds.has(x.trip_id), { id: row.id, trip_id: row.trip_id });
  for (const row of candidateMembers) await deleteOne("trip_members", row, (x) => e2eTripIds.has(x.trip_id) && e2eProfileIds.has(x.user_id), { trip_id: row.trip_id, user_id: row.user_id });
  for (const row of e2eTrips) await deleteOne("trips", row, (x) => x.title.startsWith("E2E Trip") && e2eTripIds.has(x.id), { id: row.id });
  for (const row of e2eProfiles) await deleteOne("profiles", row, (x) => x.name.startsWith("E2E-") && e2eProfileIds.has(x.id), { id: row.id });
  for (const row of e2eAuth) {
    if (!row.email?.startsWith("e2e-") || !e2eProfileIds.has(row.id)) fail(`guard menolak Auth user ${row.id}.`);
    const { error } = await client.auth.admin.deleteUser(row.id);
    if (error) fail(`gagal menghapus Auth user: ${error.message}`);
  }

  const after = {};
  for (const table of tableNames) after[table] = (await readTable(table)).length;
  const { data: authAfterData, error: authAfterError } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authAfterError) fail(`gagal membaca Auth setelah cleanup: ${authAfterError.message}`);
  const afterAuth = authAfterData.users.length;
  for (const table of tableNames) {
    const remaining = await readTable(table);
    if (remaining.some((row) => table === "profiles" && e2eProfileIds.has(row.id))) fail(`verifikasi gagal: E2E profile tersisa.`);
    if (remaining.some((row) => table === "trips" && e2eTripIds.has(row.id))) fail(`verifikasi gagal: E2E trip tersisa.`);
    if (remaining.some((row) => table === "trip_members" && e2eTripIds.has(row.trip_id))) fail(`verifikasi gagal: E2E membership tersisa.`);
  }
  if (authAfterData.users.some((row) => e2eAuthIds.has(row.id))) fail("verifikasi gagal: E2E Auth user tersisa.");
  console.log(`BEFORE profiles=${before.profiles} trips=${before.trips} trip_members=${before.trip_members} itinerary_items=${before.itinerary_items} expenses=${before.expenses} expense_splits=${before.expense_splits} auth=${beforeAuth}`);
  console.log(`AFTER profiles=${after.profiles} trips=${after.trips} trip_members=${after.trip_members} itinerary_items=${after.itinerary_items} expenses=${after.expenses} expense_splits=${after.expense_splits} auth=${afterAuth}`);
} catch (error) {
  console.error(`GAGAL: ${error.message}`);
  process.exit(1);
}
