const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require("discord.js");

// ===== ENV =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ===== CLIENT =====
const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

// ===== TIME =====
function parseTime(str) {
let total = 0;
const matches = str.match(/\d+[hm]/g);
if (!matches) return 0;

for (const m of matches) {
if (m.endsWith("h")) total += parseInt(m) * 3600000;
if (m.endsWith("m")) total += parseInt(m) * 60000;
}

return total;
}

function formatTime(ms) {
let s = Math.floor(ms / 1000);
let h = Math.floor(s / 3600);
let m = Math.floor((s % 3600) / 60);
let sec = s % 60;
return `${h}h ${m}m ${sec}s`;
}

// ===== COMMAND =====
client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;
if (interaction.commandName !== "celle") return;

try {
// 🔥 SVAR MED DET SAMME (INGEN THINKING BUG)
await interaction.reply("⏳ Starter...");

```
const cell = interaction.options.getString("celle") || "ukendt";
const timeStr = interaction.options.getString("tid") || "1m";

const ms = parseTime(timeStr);
if (!ms) {
  return interaction.editReply("❌ Ugyldig tid");
}

const end = Date.now() + ms;

const embed = new EmbedBuilder()
  .setTitle("⏳ Celle Nedtælling")
  .setColor(0x00ff00)
  .addFields([
    { name: "Celle", value: cell, inline: true },
    { name: "Tid tilbage", value: formatTime(ms), inline: true }
  ])
  .setFooter({ text: "Bot virker 🔥" });

const msg = await interaction.editReply({ content: "", embeds: [embed] });

const interval = setInterval(async () => {
  try {
    const remaining = end - Date.now();

    if (remaining <= 0) {
      clearInterval(interval);

      embed.setFields([
        { name: "Celle", value: cell, inline: true },
        { name: "Tid tilbage", value: "❌ Færdig", inline: true }
      ]);

      await msg.edit({ embeds: [embed] });
      return;
    }

    embed.setFields([
      { name: "Celle", value: cell, inline: true },
      { name: "Tid tilbage", value: formatTime(remaining), inline: true }
    ]);

    await msg.edit({ embeds: [embed] });

  } catch (err) {
    console.log("Interval fejl:", err);
    clearInterval(interval);
  }
}, 1000);
```

} catch (err) {
console.log("COMMAND ERROR:", err);
}
});

// ===== READY + REGISTER =====
client.once("clientReady", async () => {
console.log("BOT ONLINE 🔥");

const commands = [
new SlashCommandBuilder()
.setName("celle")
.setDescription("Start celle nedtælling")
.addStringOption(o =>
o.setName("celle").setDescription("Celle").setRequired(true)
)
.addStringOption(o =>
o.setName("tid").setDescription("Tid fx 1h").setRequired(true)
)
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

try {
console.log("Register commands...");
await rest.put(
Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
{ body: commands }
);
console.log("Commands opdateret");
} catch (err) {
console.log(err);
}
});

// ===== START =====
client.login(TOKEN);
