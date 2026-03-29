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

// ===== PLACERING SYSTEM =====
function getPlacering(celle) {
const c = celle.toLowerCase();

// ===== A PRE =====
if (c.startsWith("apre37") || c.startsWith("apre38")) return "Hønsene (Portal)";
if (c.startsWith("apre75")) return "Kakerlakkene (Portal)";
if (c.startsWith("apre111")) return "Kyllingerne (Portal)";
if (c.startsWith("apre151")) return "Aberne (Portal)";
if (c.startsWith("apre231")) return "Æslerne (Portal)";
if (c.startsWith("apre261")) return "Ænderne (Portal)";
if (c.startsWith("apre311")) return "Ulvene (Portal)";
if (c.startsWith("apre383")) return "Bjørnene (Casino)";
if (c.startsWith("apre393")) return "Pandaerne (Casino)";
if (c.startsWith("apre403")) return "Koalaerne (Casino)";

// ===== A NORMAL =====
if (c.startsWith("a1")) return "Grisene (Portal)";
if (c.startsWith("a200")) return "Koalaerne (Portal)";
if (c.startsWith("a400")) return "Pelikanerne (Portal)";
if (c.startsWith("a600")) return "Bacon (Portal)";
if (c.startsWith("a800")) return "Bamserne (Portal)";
if (c.startsWith("a1000")) return "Flodhestene (Portal)";
if (c.startsWith("a1200")) return "Skildpadderne (Portal)";
if (c.startsWith("a1400")) return "Tigerne (Portal)";
if (c.startsWith("a1600")) return "Slangerne (Portal)";

// ===== B =====
if (c.startsWith("b1662")) return "Over vagtstue";
if (c.startsWith("b1671")) return "Bag minen";
if (c.startsWith("b1741")) return "BO celler";
if (c.startsWith("b495")) return "Portal 1";
if (c.startsWith("b1167")) return "Portal 2";
if (c.startsWith("b1438")) return "Portal 8";

// ===== C =====
if (c.startsWith("c1")) return "Cellegang 1";
if (c.startsWith("c97")) return "Cellegang 2";
if (c.startsWith("c193")) return "Cellegang 3";
if (c.startsWith("c289")) return "Cellegang 4";
if (c.startsWith("c385")) return "Cellegang 5";

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

let duration = 0;
if (tid.includes("h")) duration += parseInt(tid) * 3600000;
if (tid.includes("m")) duration += parseInt(tid) * 60000;

const endTime = Date.now() + duration;

await interaction.reply("Starter countdown...");

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

  await interaction.editReply({ embeds: [embed] });

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
