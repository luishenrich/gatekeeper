import { writeFileSync } from "node:fs";

async function fetchSmsSpam() {
  const rows: any[] = [];
  let offset = 0;
  const limit = 100;

  console.log("Fetching SMS spam dataset from HuggingFace...");

  while (offset < 500) {
    const url = `https://datasets-server.huggingface.co/rows?dataset=ucirvine/sms_spam&config=plain_text&split=train&offset=${offset}&length=${limit}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed at offset ${offset}: ${res.status}`);
      break;
    }
    const data = await res.json();
    if (!data.rows || data.rows.length === 0) break;
    rows.push(...data.rows);
    console.log(`Fetched ${rows.length} rows...`);
    offset += limit;
  }

  writeFileSync("data/sms_spam.local.json", JSON.stringify(rows, null, 2));
  console.log(`\nSaved ${rows.length} rows to data/sms_spam.local.json`);
  console.log("This file is gitignored (unknown license).");
}

fetchSmsSpam().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
