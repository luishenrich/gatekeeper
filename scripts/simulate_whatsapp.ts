import crypto from "crypto";

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
                profile: { name: "Test User" },
                wa_id: "447700900999",
              },
            ],
            messages: [
              {
                from: "447700900999",
                id: `wamid.test${Date.now()}`,
                timestamp: Math.floor(Date.now() / 1000).toString(),
                type: "text",
                text: {
                  body: "I'm building AI agents for procurement automation. Based in London, happy to demo at meetups.",
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

  console.log("Sending WhatsApp webhook simulation to", url);
  console.log("Payload:", JSON.stringify(payload, null, 2));

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
    console.log("Check /queue to see the scored application");
  } else {
    console.log("\n✗ Simulation failed");
  }
}

simulate().catch((e) => {
  console.error(e);
  process.exit(1);
});
