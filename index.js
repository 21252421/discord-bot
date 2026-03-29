const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require("express");

// ===== ENV =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const ROLE_NAME = "Celler+";

// ===== EXPRESS =====
const app = express();
app.get("/", (req, res) => res.send("Alive"));
app.listen(process.env.PORT || 3000);

// ===== CLIENT =====
const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

// ===== SAFE ERROR HANDLING =====
process.on("unhandledRejection", (err) => console.log("UNHANDLED:", err));
process.on("uncaughtException", (err) => console.log("CRASH:", err));

// ===== COMMAND =====
const commands = [
new SlashCommandBuilder()
.setName('celle')
.setDescription('Start en celle nedtælling')
.addStringOption(o => o.setName('celle').setDescription('Celle').setRequired(true))
.addStringOption(o => o.setName('tid').setDescription('Tid fx 1h 30m').setRequired(true))
].map(cmd => cmd.toJSON());

// ===== REGISTER =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
try {
await rest.put(
Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
{ body: commands }
);
console.log("✅ Commands loaded");
} catch (err) {
console.log(err);
}
})();

// ===== TIME =====
function parseTime(str) {
let total = 0;
const matches = str.match(/\d+[dhms]/g);
if (!matches) return 0;

for (const m of matches) {
if (m.endsWith("d")) total += parseInt(m) * 86400000;
if (m.endsWith("h")) total += parseInt(m) * 3600000;
if (m.endsWith("m")) total += parseInt(m) * 60000;
if (m.endsWith("s")) total += parseInt(m) * 1000;
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
client.on('interactionCreate', async interaction => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === "celle") {
try {
await interaction.deferReply();

```
  const cell = interaction.options.getString("celle");
  const timeStr = interaction.options.getString("tid");

  const ms = parseTime(timeStr);
  if (!ms) return interaction.editReply("❌ Ugyldig tid");

  const end = Date.now() + ms;

  const embed = new EmbedBuilder()
    .setTitle("⏳ Celle")
    .setDescription(`Celle: ${cell}`)
    .addFields({
      name: "Tid tilbage",
      value: formatTime(ms)
    });

  const message = await interaction.editReply({ embeds: [embed] });

  // 🔥 STABIL LOOP (INGEN CRASH)
  const interval = setInterval(async () => {
    try {
      const remaining = end - Date.now();

      if (remaining <= 0) {
        clearInterval(interval);

        embed.setFields({
          name: "Tid tilbage",
          value: "❌ Færdig"
        });

        await message.edit({ embeds: [embed] });
        return;
      }

      embed.setFields({
        name: "Tid tilbage",
        value: formatTime(remaining)
      });

      await message.edit({ embeds: [embed] });

    } catch (err) {
      console.log("Interval fejl:", err);
      clearInterval(interval);
    }
  }, 1000);

} catch (err) {
  console.log("Command fejl:", err);

  if (interaction.deferred) {
    interaction.editReply("❌ Fejl");
  }
}
```

}
});

// ===== READY =====
client.once("ready", () => {
console.log("🔥 Bot kører stabilt!");
});

// ===== LOGIN =====
client.login(TOKEN);
