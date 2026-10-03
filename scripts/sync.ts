import { syncPricesFromCsv } from "../lib/services/ingest";

const url =
  process.env.GOOGLE_SHEET_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR2FpVthO9AT7A2YgCwgk14P3fuffjcXYFI7DFp0SsaeL6Pezc0KGMp1oWSw_5kX9lbbwdRnIni4ZNO/pub?output=csv";

async function run() {
  console.log("Fetching and syncing prices from Google Sheet...");
  const res = await syncPricesFromCsv(url);
  console.log("Sync completed!", res);
}

run().catch((err) => {
  console.error("Error during sync:", err);
  process.exit(1);
});
