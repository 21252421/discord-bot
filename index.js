const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("Alive"));
app.listen(process.env.PORT || 3000);

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

function getColor(celle) {
if (!celle) return 0xffffff;
const c = celle.toUpperCase();
if (c.startsWith("A")) return 0x00ff00;
if (c.startsWith("B")) return 0x00ffff;
if (c.startsWith("C")) return 0xff0000;
return 0xffffff;
}

function formatTime(ms) {
const total = Math.max(0, Math.floor(ms / 1000));
const h = Math.floor(total / 3600);
const m = Math.floor((total % 3600) / 60);
const s = total % 60;
return `${h}h ${m}m ${s}s`;
}

client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;
if (interaction.commandName !== "celle") return;

try {
await interaction.deferReply();

```
const celle = interaction.options.getString("celle") || "Ukendt";
const tid = interaction.options.getString("tid") || "0m";

let duration = 0;

const hMatch = tid.match(/(\d+)h/);
const mMatch = tid.match(/(\d+)m/);

if (hMatch) duration += parseInt(hMatch[1]) * 3600000;
if (mMatch) duration += parseInt(mMatch[1]) * 60000;

if (duration <= 0) {
  return interaction.editReply("❌ Ugyldig tid! Brug fx 1h eller 30m");
}

const endTime = Date.now() + duration;

// 🔥 SEND MED DET SAMME
await interaction.editReply("⏳ Starter countdown...");

const interval = setInterval(async () => {
  try {
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
        { name: "Tid tilbage", value: formatTime(remaining), inline: false }
      )
      .setFooter({ text: "Oprettet af: " + interaction.user.username })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.error("Interval fejl:", err);
    clearInterval(interval);
  }
}, 1000);
```

} catch (err) {
console.error("Command fejl:", err);

```
if (!interaction.replied) {
  await interaction.reply("❌ Der skete en fejl");
}
```

}
});

client.once("clientReady", () => {
console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
