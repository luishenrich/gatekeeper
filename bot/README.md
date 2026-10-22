# Gatekeeper Discord bot

Join-check bot for the shared HMAC blocklist. Flags matches in a mod channel; **never kicks without a human click**.

## Developer Portal setup

1. Create an application at https://discord.com/developers/applications
2. **Bot** → Add Bot → copy token → `DISCORD_BOT_TOKEN`
3. Under **Privileged Gateway Intents**, enable **Server Members Intent** (required for `guildMemberAdd`)
4. **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: **Kick Members**, **Send Messages**, **Embed Links**, **View Channels**
5. Open the invite URL, add the bot to your test server
6. Copy Application ID → `DISCORD_CLIENT_ID`, server ID → `DISCORD_GUILD_ID`, mod channel ID → `DISCORD_MOD_CHANNEL_ID`

## Run

```bash
cp .env.example .env
# fill values; point GATEKEEPER_API_URL at local or prod; set BOT_API_TOKEN to match the API
npm install
npm run register   # guild slash commands
npm run dev
```

Demo fallback when you can't join with a second account:

```
/gatekeeper check cryptomax_alpha1
```

## Behaviour

- `guildMemberAdd` → `POST /api/blocklist/check` with `Authorization: Bearer BOT_API_TOKEN`
- On match → embed in mod channel with **Draft removal** / **Dismiss**
- Draft removal → pre-written message + **Kick now** (only then `member.kick()`)
