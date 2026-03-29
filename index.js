const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

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

// ===== COLOR =====
function getColor(cell) {
const c = cell.toLowerCase();
if (c.startsWith("a")) return 0x00ff00;
if (c.startsWith("b")) return 0x00bfff;
if (c.startsWith("c")) return 0xff0000;
return 0xffffff;
}

// ===== PLACERING =====
function getPlacering(cell) {
const c = cell.toLowerCase();
if (c.startsWith("a")) return "A Celle";
if (c.startsWith("b")) return "B Celle";
if (c.startsWith("c")) return "C Celle";
return "Ukendt";
}

// ===== COMMAND =====
client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;
if (interaction.commandName !== "celle") return;

try {
await interaction.deferReply();

```
const cell = interaction.options.getString("celle");
const timeStr = interaction.options.getString("tid");

const ms = parseTime(timeStr);
if (!ms) return interaction.editReply("❌ Ugyldig tid");

const end = Date.now() + ms;

const embed = new EmbedBuilder()
  .setTitle("⏳ Celle Nedtælling")
  .setColor(getColor(cell))
  .addFields(
    { name: "Celle", value: cell, inline: true },
    { name: "Placering", value: getPlacering(cell), inline: true },
    { name: "Tid tilbage", value: formatTime(ms) }
  )
  .setFooter({ text: "Bot kører stabilt 🔥" });

const message = await interaction.editReply({ embeds: [embed] });

const interval = setInterval(async () => {
  try {
    const remaining = end - Date.now();

    if (remaining <= 0) {
      clearInterval(interval);

      embed.setFields(
        { name: "Celle", value: cell, inline: true },
        { name: "Placering", value: getPlacering(cell), inline: true },
        { name: "Tid tilbage", value: "❌ Udløbet" }
      );

      await message.edit({ embeds: [embed] });
      return;
    }

    embed.setFields(
      { name: "Celle", value: cell, inline: true },
      { name: "Placering", value: getPlacering(cell), inline: true },
      { name: "Tid tilbage", value: formatTime(remaining) }
    );

    await message.edit({ embeds: [embed] });

  } catch (err) {
    console.log("Interval fejl:", err);
    clearInterval(interval);
  }
}, 1000);
```

} catch (err) {
console.log("Command fejl:", err);

```
if (interaction.deferred) {
  interaction.editReply("❌ Fejl opstod");
}
```

}
});

// ===== READY =====
client.once("ready", () => {
console.log("🔥 Bot kører stabilt!");
});

client.login(process.env.TOKEN);
