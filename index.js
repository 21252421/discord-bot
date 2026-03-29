const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require("discord.js");

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ===== REGISTER =====
client.once("clientReady", async () => {
console.log("BOT ONLINE");

const commands = [
new SlashCommandBuilder()
.setName("celle")
.setDescription("Start celle nedtælling")
.addStringOption(o =>
o.setName("celle").setDescription("fx b20").setRequired(true)
)
.addStringOption(o =>
o.setName("tid").setDescription("fx 2h").setRequired(true)
)
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

await rest.put(
Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
{ body: commands }
);

console.log("Commands klar");
});

// ===== TIME =====
function parseTime(str) {
if (!str) return 0;

let total = 0;
const matches = str.match(/\d+[hm]/g);
if (!matches) return 0;

for (const m of matches) {
if (m.endsWith("h")) total += parseInt(m) * 3600000;
if (m.endsWith("m")) total += parseInt(m) * 60000;
}

return total;
}

// ===== COMMAND =====
client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === "celle") {
try {
const cell = interaction.options.getString("celle") || "unknown";
const tid = interaction.options.getString("tid") || "1m";

```
  const ms = parseTime(tid);

  const embed = new EmbedBuilder()
    .setTitle("✅ TEST EMBED")
    .setDescription(`Celle: ${cell}\nTid: ${tid}`)
    .setColor(0x00ff00);

  // 🔥 DIREKTE REPLY (INGEN DEFER)
  await interaction.reply({ embeds: [embed] });

} catch (err) {
  console.log("ERROR:", err);

  if (!interaction.replied) {
    interaction.reply("❌ Fejl");
  }
}
```

}
});

client.login(TOKEN);
