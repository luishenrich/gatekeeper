import crypto from "crypto";

// A22 demo: same phone as A21 (+44 7700 900901 → 447700900901)
const A22_WA_ID = "447700900901";

const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "15550000000",
              phone_number_id: "PHONE_NUMBER_ID",
            },
            contacts: [
              {
                profile: { name: "Max Moonshot" },
                wa_id: A22_WA_ID,
              },
            ],
            messages: [
              {
                from: A22_WA_ID,
                id: `wamid.a22.${Date.now()}`,
                timestamp: Math.floor(Date.now() / 1000).toString(),
                type: "text",
                text: {
                  body: "Hello builders! Exclusive AI token presale, 10x guaranteed, message me for whitelist spot before it closes.",
                },
              },
            ],
          },
          field: "messages",
        },
      ],
    },
  ],
};

async function simulate() {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.error("WHATSAPP_APP_SECRET not set");
    process.exit(1);
  }

  const body = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", appSecret).update(body, "utf8").digest("hex");
  const signature = `sha256=${hmac}`;

  const url = process.env.GATEKEEPER_API_URL || "http://localhost:3000";

  console.log("Sending WhatsApp webhook simulation (A22 / same phone as A21) to", url);

  const res = await fetch(`${url}/api/whatsapp/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature-256": signature,
    },
    body,
  });

  console.log("\nResponse:", res.status, res.statusText);
  const text = await res.text();
  console.log("Body:", text);

  if (res.ok) {
    console.log("\n✓ Simulation successful");
    console.log("Check /queue for the whatsapp-channel application (blocklist hit if A21 was reported).");
  } else {
    console.log("\n✗ Simulation failed");
  }
}

simulate().catch((e) => {
  console.error(e);
  process.exit(1);
});
