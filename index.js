const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("Alive"));
app.listen(process.env.PORT || 3000);

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

function getColor(celle) {
const c = celle.toUpperCase();
if (c.startsWith("A")) return 0x00ff00;
if (c.startsWith("B")) return 0x00ffff;
if (c.startsWith("C")) return 0xff0000;
return 0xffffff;
}

function formatTime(ms) {
const total = Math.floor(ms / 1000);
const h = Math.floor(total / 3600);
const m = Math.floor((total % 3600) / 60);
const s = total % 60;
return `${h}h ${m}m ${s}s`;
}

client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;
if (interaction.commandName !== "celle") return;

try {
// 🔥 SVAR MED DET SAMME
await interaction.deferReply();

```
const celle = interaction.options.getString("celle");
const tid = interaction.options.getString("tid");

let duration = 0;
if (tid.includes("h")) duration += parseInt(tid) * 3600000;
if (tid.includes("m")) duration += parseInt(tid) * 60000;

const endTime = Date.now() + duration;

// 🔥 SEND FØRSTE EMBED MED DET SAMME
const embed = new EmbedBuilder()
  .setTitle("⏳ Celle Nedtælling")
  .setColor(getColor(celle))
  .addFields(
    { name: "Celle", value: celle, inline: true },
    { name: "Placering", value: "Starter...", inline: true },
    { name: "Tid tilbage", value: "Loader...", inline: false }
  )
  .setFooter({ text: "Oprettet af: " + interaction.user.username });

await interaction.editReply({ embeds: [embed] });

// 🔥 START INTERVAL EFTER SVAR
const interval = setInterval(async () => {
  const remaining = endTime - Date.now();

  if (remaining <= 0) {
    clearInterval(interval);
    return interaction.editReply("⛓️ Personen er løsladt!");
  }

  const updatedEmbed = new EmbedBuilder()
    .setTitle("⏳ Celle Nedtælling")
    .setColor(getColor(celle))
    .addFields(
      { name: "Celle", value: celle, inline: true },
      { name: "Placering", value: "Aktiv celle", inline: true },
      { name: "Tid tilbage", value: formatTime(remaining), inline: false }
    )
    .setFooter({ text: "Oprettet af: " + interaction.user.username })
    .setTimestamp();

  await interaction.editReply({ embeds: [updatedEmbed] });

}, 1000);
```

} catch (err) {
console.error(err);
}
});

client.once("clientReady", () => {
console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
