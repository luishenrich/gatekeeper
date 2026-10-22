import { getServiceClient } from "@/lib/supabase/server";

async function seed() {
  console.log("Resetting demo tables...");

  await getServiceClient().from("audit_log").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✓ Cleared audit_log");

  await getServiceClient().from("decisions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✓ Cleared decisions");

  await getServiceClient().from("applications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✓ Cleared applications");

  await getServiceClient().from("blocklist_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✓ Cleared blocklist_entries");

  console.log("\nDemo reset complete. Run the demo:");
  console.log("1. A21 applies to london-agent-builders → declined, reported");
  console.log("2. A22 applies to south-london-hack-nights → blocklist hit");
}

seed().then(() => {
  console.log("\nDone");
  process.exit(0);
}).catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
