import "dotenv/config";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Partials,
  type GuildMember,
  type Interaction,
  type TextChannel,
} from "discord.js";
import { checkBlocklist } from "./check.js";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.GuildMember],
});

function formatDate(iso?: string): string {
  if (!iso) return "unknown date";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

async function postFlag(
  channel: TextChannel,
  member: GuildMember | { user: { id: string; username: string; tag?: string } },
  result: Awaited<ReturnType<typeof checkBlocklist>>
) {
  const matchedOn = (result.matched_on ?? ["unknown"]).join(", ");
  const embed = new EmbedBuilder()
    .setColor(0xdc2626)
    .setTitle("Gatekeeper blocklist match")
    .setDescription(
      `⚠️ <@${member.user.id}> matched the shared Gatekeeper blocklist on **${matchedOn}** (status **${result.status ?? "confirmed"}**, reported ${formatDate(result.reported_at)}).`
    )
    .addFields(
      { name: "Handle", value: member.user.username, inline: true },
      { name: "User ID", value: member.user.id, inline: true }
    )
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`gk_draft:${member.user.id}`)
      .setLabel("Draft removal")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`gk_dismiss:${member.user.id}`)
      .setLabel("Dismiss")
      .setStyle(ButtonStyle.Secondary)
  );

  await channel.send({ embeds: [embed], components: [row] });
  console.log(`[flag] posted for ${member.user.username} (${member.user.id})`);
}

client.once(Events.ClientReady, (c) => {
  console.log(`[ready] logged in as ${c.user.tag}`);
});

client.on(Events.GuildMemberAdd, async (member) => {
  console.log(`[join] ${member.user.username} (${member.user.id})`);
  try {
    const result = await checkBlocklist(member.user.username);
    console.log(`[check] join ${member.user.username} ->`, result);
    if (!result.match) return;

    const channel = await client.channels.fetch(requireEnv("DISCORD_MOD_CHANNEL_ID"));
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      console.error("[flag] mod channel missing or not text");
      return;
    }
    await postFlag(channel as TextChannel, member, result);
  } catch (err) {
    console.error("[join] check failed", err);
  }
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === "gatekeeper") {
      const sub = interaction.options.getSubcommand();
      if (sub !== "check") return;
      const handle = interaction.options.getString("handle", true).replace(/^@/, "");
      await interaction.deferReply({ ephemeral: true });
      const result = await checkBlocklist(handle);
      console.log(`[slash] check ${handle} ->`, result);

      if (!result.match) {
        await interaction.editReply(`No blocklist match for \`${handle}\`.`);
        return;
      }

      const channel = await client.channels.fetch(requireEnv("DISCORD_MOD_CHANNEL_ID"));
      if (channel && channel.isTextBased() && !channel.isDMBased()) {
        await postFlag(
          channel as TextChannel,
          { user: { id: interaction.user.id, username: handle } },
          result
        );
      }
      await interaction.editReply(
        `Match for \`${handle}\` on ${(result.matched_on ?? []).join(", ") || "unknown"} · flagged in mod channel.`
      );
      return;
    }

    if (!interaction.isButton()) return;
    const [action, userId] = interaction.customId.split(":");
    if (!userId) return;

    if (action === "gk_dismiss") {
      console.log(`[dismiss] ${userId} by ${interaction.user.tag}`);
      await interaction.update({
        content: `Dismissed by <@${interaction.user.id}>.`,
        embeds: interaction.message.embeds,
        components: [],
      });
      return;
    }

    if (action === "gk_draft") {
      console.log(`[draft] ${userId} by ${interaction.user.tag}`);
      const draft = new EmbedBuilder()
        .setColor(0xf59e0b)
        .setTitle("Draft removal")
        .setDescription(
          `Proposed removal for <@${userId}>:\n\n> You matched a shared community blocklist entry. A moderator will remove you if they confirm.`
        );
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`gk_kick:${userId}`)
          .setLabel("Kick now")
          .setStyle(ButtonStyle.Danger)
      );
      await interaction.reply({ embeds: [draft], components: [row] });
      return;
    }

    if (action === "gk_kick") {
      console.log(`[kick] attempt ${userId} by ${interaction.user.tag}`);
      if (!interaction.guild) {
        await interaction.reply({ content: "No guild context.", ephemeral: true });
        return;
      }
      const member = await interaction.guild.members.fetch(userId).catch(() => null);
      if (!member) {
        await interaction.reply({
          content: "Member not found (already left?).",
          ephemeral: true,
        });
        return;
      }
      await member.kick("Gatekeeper: human-confirmed blocklist removal");
      console.log(`[kick] success ${userId}`);
      await interaction.update({
        content: `Kicked <@${userId}> by <@${interaction.user.id}>.`,
        embeds: [],
        components: [],
      });
    }
  } catch (err) {
    console.error("[interaction] failed", err);
    if (interaction.isRepliable() && !interaction.replied) {
      await interaction.reply({ content: "Something went wrong.", ephemeral: true }).catch(() => {});
    }
  }
});

client.login(requireEnv("DISCORD_BOT_TOKEN"));
