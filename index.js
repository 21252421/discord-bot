const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

// ===== WEB SERVER =====
const app = express();
app.get("/", (req, res) => res.send("Alive"));
app.listen(process.env.PORT || 3000);

// ===== BOT =====
const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

// ===== FARVE =====
function getColor(celle) {
const c = celle.toUpperCase();
if (c.startsWith("A")) return 0x00ff00;
if (c.startsWith("B")) return 0x00ffff;
if (c.startsWith("C")) return 0xff0000;
return 0xffffff;
}

// ===== PLACERING =====
function getPlacering(celle) {
const c = celle.toLowerCase();

if (c.startsWith("b1662")) return "Over vagtstue";
if (c.startsWith("b1671")) return "Bag minen";
if (c.startsWith("b1741")) return "BO celler";

if (c.startsWith("apre37") || c.startsWith("apre38")) return "Hønsene (Portal)";
if (c.startsWith("apre75")) return "Kakerlakkene (Portal)";
if (c.startsWith("apre111")) return "Kyllingerne (Portal)";

return "Ukendt";
}

// ===== FORMAT TID =====
function formatTime(ms) {
const total = Math.floor(ms / 1000);
const h = Math.floor(total / 3600);
const m = Math.floor((total % 3600) / 60);
const s = total % 60;

return `${h}h ${m}m ${s}s`;
}

// ===== COMMAND =====
client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === "celle") {

```
const celle = interaction.options.getString("celle");
const tid = interaction.options.getString("tid");

await interaction.deferReply(); // 🔥 FIXER TIMEOUT

// parse tid
let duration = 0;
if (tid.includes("h")) duration += parseInt(tid) * 3600000;
if (tid.includes("m")) duration += parseInt(tid) * 60000;

const endTime = Date.now() + duration;

const interval = setInterval(async () => {
  const remaining = endTime - Date.now();

  if (remaining <= 0) {
    clearInterval(interval);
    return interaction.editReply("⛓️ Personen er løsladt!");
  }

  const embed = new EmbedBuilder()
    .setTitle("⏳ Celle Nedtælling")
    .setColor(getColor(celle))
    .addFields(
      { name: "Celle", value: celle, inline: true },
      { name: "Placering", value: getPlacering(celle), inline: true },
      { name: "Tid tilbage", value: formatTime(remaining), inline: false },
      { name: "Noter", value: "Ingen noter", inline: false }
    )
    .setFooter({ text: "Oprettet af: " + interaction.user.username })
    .setTimestamp();

  try {
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    clearInterval(interval);
  }

}, 1000);
```

}
});

// ===== READY =====
client.once("clientReady", () => {
console.log(`Logged in as ${client.user.tag}`);
});

// ===== LOGIN =====
client.login(process.env.TOKEN);
