import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId || !guildId) {
  console.error("Need DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("gatekeeper")
    .setDescription("Gatekeeper moderation helpers")
    .addSubcommand((sub) =>
      sub
        .setName("check")
        .setDescription("Check a handle against the shared blocklist")
        .addStringOption((opt) =>
          opt.setName("handle").setDescription("Discord username / handle").setRequired(true)
        )
    )
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(token);

await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
console.log("Registered /gatekeeper check for guild", guildId);
